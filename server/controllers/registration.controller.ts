import { type Response } from "express";
import { type RequestWithActiveConference } from "../middlewares/checkActiveConference";
import { registrationRepository } from "../repositories/registrationRepository";
import { sessionRepository } from "../repositories/sessionRepository";
import { whitelistRepository } from "../repositories/whitelistRepository";
import { insertRegistrationSchema, batchRegistrationRequestSchema } from "@shared/validation";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { registrations as registrationsTable } from "@shared/schema";
import { registrationService } from "../services/registrationService";
import { emailService, type EmailSendResult } from "../services/emailService";
import { confirmationSuccessTemplate, errorTemplate } from "../utils/templates";

export const getPaginatedRegistrations = async (req: RequestWithActiveConference, res: Response) => {
    try {
        const conference = req.activeConference;
        if (!conference) return res.json({ data: [], total: 0 });
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const user = (req as any).user;
        const allowedSessionIds = user?.role === "staff" ? user.assignedSessionIds || [] : undefined;

        const result = await registrationRepository.getByConferenceSlug(conference.slug, page, limit, allowedSessionIds);
        
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        res.json({ data: result.data, total: result.total });
    } catch (error) {
        console.error("Error fetching registrations:", error);
        res.status(500).json({ message: "Lấy danh sách thất bại" });
    }
};

export const exportRegistrations = async (req: RequestWithActiveConference, res: Response) => {
    try {
        const conference = req.activeConference;
        if (!conference) return res.status(404).send("No active conference found.");
        
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename=registrations-${conference.slug}.csv`);
        
        // Add BOM for Excel UTF-8 support
        res.write("\uFEFF");
        
        const headers = ["ID", "Họ và tên", "Email", "Điện thoại", "Tổ chức", "Chức danh", "Phiên đăng ký", "Vai trò", "Yêu cầu Chứng nhận", "Trạng thái", "Thời gian đăng ký"];
        res.write(headers.join(",") + "\n");
        
        // Fetch all registrations (up to 50000 for safety)
        const { data: registrations } = await registrationRepository.getByConferenceSlug(conference.slug, 1, 50000);
        
        const escapeCSV = (val: any) => {
            const str = String(val ?? '');
            return `"${str.replace(/"/g, '""')}"`;
        };

        for (const r of registrations) {
            const session = await sessionRepository.getById(conference.slug, r.sessionId);
            
            const roleMap: Record<string, string> = {
                'participant': 'Tham dự',
                'speaker': 'Báo cáo viên',
                'moderator': 'Chủ tọa',
                'both': 'Báo cáo viên & Chủ tọa'
            };

            const row = [
                escapeCSV(r.id),
                escapeCSV(r.fullName),
                escapeCSV(r.email),
                escapeCSV(r.phone),
                escapeCSV(r.organization),
                escapeCSV(r.position),
                escapeCSV(session?.title),
                escapeCSV(roleMap[r.role] || r.role),
                escapeCSV(r.certificateRequested ? 'Có' : 'Không'),
                escapeCSV(r.status === 'confirmed' ? 'Đã xác nhận' : r.status === 'checked-in' ? 'Đã tham dự' : 'Chờ xác nhận'),
                escapeCSV(r.registeredAt ? new Date(r.registeredAt).toLocaleString('vi-VN') : '')
            ].join(",");
            
            res.write(row + "\n");
        }
        res.end();
    } catch (error) {
        console.error("Export error:", error);
        if (!res.headersSent) res.status(500).send("Failed to export registrations");
    }
};

export const addAdminRegistration = async (req: RequestWithActiveConference, res: Response) => {
    try {
        const conference = req.activeConference;
        if (!conference) return res.status(404).json({ message: "No active conference" });
        const registrationData = insertRegistrationSchema.parse({ ...req.body, conferenceSlug: conference.slug });
        
        if (await registrationRepository.isRegisteredForSession(registrationData.email, registrationData.sessionId)) {
            return res.status(400).json({ message: "Email này đã được đăng ký cho phiên này." });
        }

        const newRegistration = await registrationService.addAdminRegistration(conference.slug, registrationData);
        res.status(201).json(newRegistration);
    } catch (error: any) {
        res.status(400).json({ message: error.message || "Lỗi khi thêm đăng ký" });
    }
};

export const confirmRegistration = async (req: RequestWithActiveConference, res: Response) => {
    try {
        const { token } = req.params;
        const result = await registrationService.confirmRegistration(token);
        if (!result.success) {
            return res.status(400).send(errorTemplate(result.errorTitle!, result.errorMessage!));
        }
        res.send(confirmationSuccessTemplate(result.conferenceName!));
    } catch (_error: any) {
        res.status(500).send(errorTemplate("Lỗi xác nhận", "Đã có lỗi xảy ra."));
    }
};

export const getRegistrationsBySessionId = async (req: RequestWithActiveConference, res: Response) => {
    try { res.json(await registrationRepository.getBySession(req.params.sessionId)); } catch (_error) { res.status(500).json({ message: "Failed" }); }
};

export const batchRegister = async (req: RequestWithActiveConference, res: Response) => {
    try {
        const conference = req.activeConference;
        if (!conference) return res.status(404).json({ message: "No active conference" });
        const requestData = batchRegistrationRequestSchema.parse({ ...req.body, conferenceSlug: conference.slug });

        const result = await registrationService.batchRegisterSessions(requestData);
        if (!result.success) return res.status(400).json({ message: result.error, failedSessions: result.failedSessions });

        let emailResult: EmailSendResult = { success: false, error: undefined, errorCode: undefined };
        if (result.confirmationToken) {
            emailResult = await emailService.sendRegistrationVerificationEmail(requestData.email, requestData.fullName, conference.name, result.confirmationToken);
            
            if (!emailResult.success && result.registrations) {
                console.error('[RegistrationController] Email sending failed:', {
                    email: requestData.email,
                    error: emailResult.error,
                    errorCode: emailResult.errorCode,
                    conference: conference.name
                });

                // Cập nhật lỗi vào DB cho tất cả các bản ghi trong đợt đăng ký này
                for (const reg of result.registrations) {
                    await db.update(registrationsTable)
                        .set({ 
                            lastEmailError: emailResult.error || 'Unknown error',
                            lastEmailErrorAt: new Date()
                        })
                        .where(eq(registrationsTable.id, reg.id))
                        .run();
                }
            } else if (emailResult.success && result.registrations) {
                // Đánh dấu đã gửi thành công
                for (const reg of result.registrations) {
                    await db.update(registrationsTable)
                        .set({ emailSent: true, lastEmailError: null, lastEmailErrorAt: null })
                        .where(eq(registrationsTable.id, reg.id))
                        .run();
                }
            }
        }
        
        res.json({ 
            success: true, 
            registrations: result.registrations, 
            emailSent: emailResult.success,
            emailError: emailResult.error,
            message: emailResult.success 
                ? "Đăng ký thành công, vui lòng kiểm tra email để xác nhận." 
                : "Đăng ký thành công nhưng không thể gửi email xác nhận. Vui lòng liên hệ ban tổ chức."
        });
    } catch (error: any) { 
        console.error('[RegistrationController] Batch registration error:', error);
        res.status(400).json({ message: error.message }); 
    }
};

export const searchForRegistrations = async (req: RequestWithActiveConference, res: Response) => {
    try {
        const conference = req.activeConference;
        if (!conference) return res.status(404).json({ message: "No active conference" });
        const user = (req as any).user;
        const allowedSessionIds = user?.role === "staff" ? user.assignedSessionIds || [] : undefined;
        res.json(await registrationRepository.search(conference.slug, req.query.query as string, parseInt(req.query.page as string) || 1, parseInt(req.query.limit as string) || 10, allowedSessionIds));
    } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const deleteRegistrationById = async (req: RequestWithActiveConference, res: Response) => {
    try { if (await registrationRepository.delete(req.params.id)) res.json({ success: true }); else res.status(404).json({ message: "Not found" }); } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const getWhitelists = async (req: RequestWithActiveConference, res: Response) => {
    try { if (!req.activeConference) return res.json([]); res.json(await whitelistRepository.getAll(req.activeConference.slug)); } catch (_error) { res.status(500).json({ message: "Failed" }); }
};

export const addToWhitelist = async (req: RequestWithActiveConference, res: Response) => {
    try { res.json(await whitelistRepository.create(req.activeConference.slug, { email: req.body.email, conferenceId: req.activeConference.slug, name: "" })); } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const removeFromWhitelist = async (req: RequestWithActiveConference, res: Response) => {
    try { await whitelistRepository.delete(req.activeConference.slug, req.params.id); res.json({ success: true }); } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const getCheckIns = async (req: RequestWithActiveConference, res: Response) => {
    try { res.json(await registrationRepository.getCheckInsBySession(req.params.sessionId, parseInt(req.query.page as string) || 1, parseInt(req.query.limit as string) || 10)); } catch (_error) { res.status(500).json({ message: "Failed" }); }
};

export const qrCheckIn = async (req: RequestWithActiveConference, res: Response) => {
    try {
        const { qrData, sessionId } = req.body;
        const parts = qrData.split('|');
        if (parts.length < 5) return res.status(400).json({ message: "Invalid QR" });
        const [, qrSlug, qrSid, email] = parts;
        const conference = req.activeConference;
        if (qrSlug !== conference.slug || qrSid !== sessionId) return res.status(400).json({ message: "Mismatch" });

        const user = (req as any).user;
        if (user?.role === "staff") {
            const allowed = user.assignedSessionIds || [];
            if (!allowed.includes(sessionId)) {
                return res.status(403).json({ message: "Forbidden: Bạn không có quyền check-in cho phiên này" });
            }
        }

        const registration = (await registrationRepository.getByEmail(email, conference.slug)).find(r => r.sessionId === sessionId);
        if (!registration) return res.status(404).json({ message: "Not found" });

        const checkIn = await registrationService.processCheckIn(registration, sessionId, conference.name, 'qr');
        res.json(checkIn);
    } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const manualCheckIn = async (req: RequestWithActiveConference, res: Response) => {
    try {
        const { registrationId } = req.body;
        const registration = await registrationRepository.getById(registrationId);
        if (!registration || registration.status !== "confirmed") return res.status(400).json({ message: "Trạng thái đăng ký không hợp lệ (Phải là 'đã xác nhận')" });
        
        const user = (req as any).user;
        if (user?.role === "staff") {
            const allowed = user.assignedSessionIds || [];
            if (!allowed.includes(registration.sessionId)) {
                return res.status(403).json({ message: "Forbidden: Bạn không có quyền check-in cho phiên này" });
            }
        }

        const conference = req.activeConference;
        const checkIn = await registrationService.processCheckIn(registration, registration.sessionId, conference.name, 'manual');
        res.json(checkIn);
    } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const bulkCheckIn = async (req: RequestWithActiveConference, res: Response) => {
    try {
      const { registrationIds, sessionId } = req.body;
      const conference = req.activeConference;
      
      const user = (req as any).user;
      if (user?.role === "staff") {
          const allowed = user.assignedSessionIds || [];
          if (!allowed.includes(sessionId)) {
              return res.status(403).json({ message: "Forbidden: Bạn không có quyền check-in cho phiên này" });
          }
      }

      let successCount = 0; let failCount = 0;
      for (const regId of registrationIds) {
        try {
          const registration = await registrationRepository.getById(regId);
          if (!registration || registration.sessionId !== sessionId || registration.status !== 'confirmed') { failCount++; continue; }
          await registrationService.processCheckIn(registration, sessionId, conference.name, 'manual');
          successCount++;
        } catch (_e) { failCount++; }
      }
      res.json({ successCount, failCount });
    } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const bulkDeleteRegistrations = async (req: RequestWithActiveConference, res: Response) => {
    try {
      const { registrationIds } = req.body;
      const user = (req as any).user;
      let successCount = 0; let failCount = 0;
      for (const regId of registrationIds) {
        try {
          const registration = await registrationRepository.getById(regId);
          if (!registration) { failCount++; continue; }
          // Staff can only delete registrations belonging to their assigned sessions
          if (user?.role === "staff") {
              const allowed = user.assignedSessionIds || [];
              if (!allowed.includes(registration.sessionId)) {
                  failCount++; continue;
              }
          }
          await registrationRepository.delete(regId);
          successCount++;
        } catch (_e) { failCount++; }
      }
      res.json({ successCount, failCount });
    } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const resendEmail = async (req: RequestWithActiveConference, res: Response) => {
    try {
        const { id } = req.params;
        const conference = req.activeConference;
        if (!conference) return res.status(404).json({ message: "No active conference" });

        const registration = await registrationRepository.getById(id);
        if (!registration) return res.status(404).json({ message: "Không tìm thấy thông tin đăng ký" });

        let emailResult: EmailSendResult;

        if (registration.status === 'pending') {
            // Gửi lại thư xác nhận
            emailResult = await emailService.sendRegistrationVerificationEmail(
                registration.email,
                registration.fullName,
                conference.name,
                registration.confirmationToken || ''
            );
        } else {
            // Gửi lại thư thông tin đăng ký (đã xác nhận)
            const userRegistrations = await registrationRepository.getByEmail(registration.email, conference.slug);
            const allSessions = await sessionRepository.getAll(conference.slug);
            
            // Helper function logic (since formatSessionTime is private)
            const formatSessionTime = (startTime: string | Date, endTime: string | Date): string => {
                const start = new Date(startTime);
                const end = new Date(endTime);
                const dateStr = start.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                const timeStr = `${start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
                return `${dateStr} | ${timeStr}`;
            };

            const sessionDetails = userRegistrations
                .map(r => {
                    const session = allSessions.find(s => s.id === r.sessionId);
                    if (!session) return null;
                    return { 
                        title: session.title, 
                        time: formatSessionTime(session.startTime, session.endTime), 
                        room: session.room, 
                        qrCode: r.qrCode! 
                    };
                })
                .filter(Boolean) as any[];

            emailResult = await emailService.sendConsolidatedRegistrationEmail(
                registration.email,
                registration.fullName,
                conference.name,
                registration.certificateRequested,
                sessionDetails
            );
        }

        // Cập nhật kết quả vào DB
        await registrationRepository.updateEmailError(
            registration.id, 
            emailResult.success ? null : (emailResult.error || 'Resend failed'),
            emailResult.success
        );

        if (emailResult.success) {
            res.json({ success: true, message: "Đã gửi lại email thành công" });
        } else {
            res.status(500).json({ success: false, message: `Gửi email thất bại: ${emailResult.error}` });
        }
    } catch (error: any) {
        console.error('[RegistrationController] Resend email error:', error);
        res.status(500).json({ message: error.message || "Lỗi khi gửi lại email" });
    }
};
