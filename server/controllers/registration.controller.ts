import { type Response } from "express";
import { type RequestWithActiveConference } from "../middlewares/checkActiveConference";
import { registrationRepository } from "../repositories/registrationRepository";
import { sessionRepository } from "../repositories/sessionRepository";
import { whitelistRepository } from "../repositories/whitelistRepository";
import { insertRegistrationSchema, batchRegistrationRequestSchema } from "@shared/validation";
import { registrationService } from "../services/registrationService";
import { emailService } from "../services/emailService";
import { confirmationSuccessTemplate, errorTemplate } from "../utils/templates";

export const getPaginatedRegistrations = async (req: RequestWithActiveConference, res: Response) => {
    try {
        const conference = req.activeConference;
        if (!conference) return res.json({ data: [], total: 0 });
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const result = await registrationRepository.getByConferenceSlug(conference.slug, page, limit);
        
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
        res.write("\uFEFF");
        const headers = ["ID", "Họ và tên", "Email", "Điện thoại", "Tổ chức", "Chức danh", "Phiên đăng ký", "Yêu cầu CME", "Trạng thái", "Thời gian đăng ký"];
        res.write(headers.join(",") + "\n");
        const { data: registrations } = await registrationRepository.getByConferenceSlug(conference.slug, 1, 10000);
        for (const r of registrations) {
            const session = await sessionRepository.getById(conference.slug, r.sessionId);
            const row = [
                `"${r.id}"`, `"${r.fullName}"`, `"${r.email}"`, `"${r.phone || ''}"`, 
                `"${r.organization || ''}"`, `"${r.position || ''}"`, `"${session?.title || ''}"`, 
                `"${r.cmeCertificateRequested ? 'Có' : 'Không'}"`, `"${r.status}"`, 
                `"${r.registeredAt ? new Date(r.registeredAt).toLocaleString() : ''}"`
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
    } catch (error: any) {
        res.status(500).send(errorTemplate("Lỗi xác nhận", "Đã có lỗi xảy ra."));
    }
};

export const getRegistrationsBySessionId = async (req: RequestWithActiveConference, res: Response) => {
    try { res.json(await registrationRepository.getBySession(req.params.sessionId)); } catch (error) { res.status(500).json({ message: "Failed" }); }
};

export const batchRegister = async (req: RequestWithActiveConference, res: Response) => {
    try {
        const conference = req.activeConference;
        if (!conference) return res.status(404).json({ message: "No active conference" });
        const requestData = batchRegistrationRequestSchema.parse({ ...req.body, conferenceSlug: conference.slug });
        
        const result = await registrationService.batchRegisterSessions(requestData);
        if (!result.success) return res.status(400).json({ message: result.error, failedSessions: result.failedSessions });
        
        let emailSent = false;
        if (result.confirmationToken) {
            emailSent = await emailService.sendRegistrationVerificationEmail(requestData.email, requestData.fullName, conference.name, result.confirmationToken);
        }
        res.json({ success: true, registrations: result.registrations, emailSent, message: "Đăng ký thành công, vui lòng kiểm tra email để xác nhận." });
    } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const searchForRegistrations = async (req: RequestWithActiveConference, res: Response) => {
    try {
        const conference = req.activeConference;
        if (!conference) return res.status(404).json({ message: "No active conference" });
        res.json(await registrationRepository.search(conference.slug, req.query.query as string, parseInt(req.query.page as string) || 1, parseInt(req.query.limit as string) || 10));
    } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const deleteRegistrationById = async (req: RequestWithActiveConference, res: Response) => {
    try { if (await registrationRepository.delete(req.params.id)) res.json({ success: true }); else res.status(404).json({ message: "Not found" }); } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const getWhitelists = async (req: RequestWithActiveConference, res: Response) => {
    try { if (!req.activeConference) return res.json([]); res.json(await whitelistRepository.getAll(req.activeConference.slug)); } catch (error) { res.status(500).json({ message: "Failed" }); }
};

export const addToWhitelist = async (req: RequestWithActiveConference, res: Response) => {
    try { res.json(await whitelistRepository.create(req.activeConference.slug, { email: req.body.email, conferenceId: req.activeConference.slug, name: "" })); } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const removeFromWhitelist = async (req: RequestWithActiveConference, res: Response) => {
    try { await whitelistRepository.delete(req.activeConference.slug, req.params.id); res.json({ success: true }); } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const getCheckIns = async (req: RequestWithActiveConference, res: Response) => {
    try { res.json(await registrationRepository.getCheckInsBySession(req.params.sessionId, parseInt(req.query.page as string) || 1, parseInt(req.query.limit as string) || 10)); } catch (error) { res.status(500).json({ message: "Failed" }); }
};

export const qrCheckIn = async (req: RequestWithActiveConference, res: Response) => {
    try {
        const { qrData, sessionId } = req.body;
        const parts = qrData.split('|');
        if (parts.length < 5) return res.status(400).json({ message: "Invalid QR" });
        const [, qrSlug, qrSid, email] = parts;
        const conference = req.activeConference;
        if (qrSlug !== conference.slug || qrSid !== sessionId) return res.status(400).json({ message: "Mismatch" });

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
        if (!registration || registration.status !== "confirmed") return res.status(400).json({ message: "Invalid" });
        
        const conference = req.activeConference;
        const checkIn = await registrationService.processCheckIn(registration, registration.sessionId, conference.name, 'manual');
        res.json(checkIn);
    } catch (error: any) { res.status(400).json({ message: error.message }); }
};

export const bulkCheckIn = async (req: RequestWithActiveConference, res: Response) => {
    try {
      const { registrationIds, sessionId } = req.body;
      const conference = req.activeConference;
      let successCount = 0; let failCount = 0;
      for (const regId of registrationIds) {
        try {
          const registration = await registrationRepository.getById(regId);
          if (!registration || registration.sessionId !== sessionId || registration.status !== 'confirmed') { failCount++; continue; }
          await registrationService.processCheckIn(registration, sessionId, conference.name, 'manual');
          successCount++;
        } catch (e) { failCount++; }
      }
      res.json({ successCount, failCount });
    } catch (error: any) { res.status(400).json({ message: error.message }); }
};
