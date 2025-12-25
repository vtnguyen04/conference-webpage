import { type Response } from "express";
import { type RequestWithActiveConference } from "../middlewares/checkActiveConference";
import { sessionRepository } from "../repositories/sessionRepository";
import { whitelistRepository } from "../repositories/whitelistRepository";
import { registrationRepository } from "../repositories/registrationRepository";
import { jsonStorage } from "../jsonStorage";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { registrations as registrationsTable } from "@shared/schema";
import { certificateService } from "../services/certificateService";
import { emailService } from "../services/emailService";
import { insertRegistrationSchema, batchRegistrationRequestSchema } from "@shared/validation";
import { registrationService } from "../services/registrationService";
import { backgroundQueue } from "../utils/backgroundQueue";
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
                `"${r.id}"`, 
                `"${r.fullName}"`, 
                `"${r.email}"`, 
                `"${r.phone || ''}"`, 
                `"${r.organization || ''}"`, 
                `"${r.position || ''}"`, 
                `"${session?.title || ''}"`, 
                `"${r.cmeCertificateRequested ? 'Có' : 'Không'}"`, 
                `"${r.status}"`, 
                `"${r.registeredAt ? new Date(r.registeredAt).toLocaleString() : ''}"`
            ].join(",");
            res.write(row + "\n");
        }
        res.end();
    } catch (error) {
        console.error("Export error:", error);
        if (!res.headersSent) {
            res.status(500).send("Failed to export registrations");
        }
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
        const session = await sessionRepository.getById(conference.slug, registrationData.sessionId);
        if (!session) return res.status(404).json({ message: "Không tìm thấy phiên" });
        if (session.capacity) {
            const currentCount = await registrationRepository.getSessionRegistrationCount(session.id);
            if (currentCount >= session.capacity) {
                return res.status(400).json({ message: `Phiên "${session.title}" đã hết chỗ.` });
            }
        }
        const newRegistration = await registrationRepository.createAdmin(registrationData);
        res.status(201).json(newRegistration);
        if (session) {
            backgroundQueue.enqueue(async () => {
                const startTime = new Date(session.startTime);
                const endTime = new Date(session.endTime);
                const sessionTime = `${startTime.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} | ${startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
                console.log(`[Queue] Đang gửi email cho ${newRegistration.email}...`);
                await emailService.sendConsolidatedRegistrationEmail(
                    newRegistration.email,
                    newRegistration.fullName,
                    conference.name,
                    newRegistration.cmeCertificateRequested,
                    [{ title: session.title, time: sessionTime, room: session.room, qrCode: newRegistration.qrCode! }]
                );
            });
        }
    } catch (error: any) {
        console.error("Add Registration Error:", error);
        res.status(400).json({ message: error.message || "Lỗi khi thêm đăng ký" });
    }
};
export const confirmRegistration = async (req: RequestWithActiveConference, res: Response) => {
    const errorTemplate = (title: string, message: string) => `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-gray-50 min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-red-50">
        <div class="mb-6 inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full">
            <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-3">${title}</h1>
        <p class="text-gray-600 mb-8 leading-relaxed">${message}</p>
        <a href="/" class="block w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-xl transition duration-200">
            Quay lại trang chủ
        </a>
    </div>
</body>
</html>`;
    try {
        const { token } = req.params;
        const registration = await db.select().from(registrationsTable).where(eq(registrationsTable.confirmationToken, token)).limit(1);
        if (!registration.length) return res.status(400).send(errorTemplate("Lỗi xác nhận", "Mã xác nhận không hợp lệ hoặc đã được sử dụng."));
        const reg = registration[0];
        if (reg.confirmationTokenExpires && new Date(reg.confirmationTokenExpires) < new Date()) return res.status(400).send(errorTemplate("Mã hết hạn", "Liên kết xác nhận đã hết hạn. Vui lòng đăng ký lại hoặc liên hệ ban tổ chức."));
        await db.update(registrationsTable)
            .set({ status: 'confirmed', confirmationToken: null, confirmationTokenExpires: null })
            .where(and(
                eq(registrationsTable.confirmationToken, token),
                eq(registrationsTable.status, 'pending')
            ))
            .run();
        const conference = await jsonStorage.getConferenceBySlug(reg.conferenceSlug);
        if (conference) {
            const userRegistrations = await registrationRepository.getByEmail(reg.email, conference.slug);
            const allSessions = await sessionRepository.getAll(conference.slug);
            const sessionDetails = userRegistrations.map((registration) => {
                const session = allSessions.find(s => s.id === registration.sessionId);
                if (!session) return null;
                const startTime = new Date(session.startTime);
                const endTime = new Date(session.endTime);
                return { 
                    title: session.title, 
                    time: `${startTime.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} | ${startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`, 
                    room: session.room, 
                    qrCode: registration.qrCode! 
                };
            }).filter(Boolean) as any[];
            if (sessionDetails.length > 0) await emailService.sendConsolidatedRegistrationEmail(reg.email, reg.fullName, conference.name, reg.cmeCertificateRequested, sessionDetails);
        }
        const successHtml = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xác nhận đăng ký thành công</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        .gradient-bg { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); }
    </style>
</head>
<body class="gradient-bg min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-blue-50">
        <div class="mb-6 inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
            <svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-3">Đăng ký thành công!</h1>
        <p class="text-gray-600 mb-8 leading-relaxed">
            Cảm ơn bạn đã xác nhận tham dự. Chúng tôi đã gửi thông tin chi tiết và <strong>mã QR check-in</strong> đến email của bạn.
        </p>
        <div class="space-y-4">
            <a href="/" class="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition duration-200 shadow-lg shadow-blue-200">
                Quay lại trang chủ
            </a>
            <p class="text-xs text-gray-400">
                Nếu không nhận được email, vui lòng kiểm tra thư mục Spam hoặc liên hệ ban tổ chức.
            </p>
        </div>
    </div>
</body>
</html>`;
        res.send(successHtml);
    } catch (error: any) { res.status(500).json({ message: "Lỗi xác nhận" }); } 
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
        const session = await sessionRepository.getById(conference.slug, sessionId);
        const registration = (await registrationRepository.getByEmail(email, conference.slug)).find(r => r.sessionId === sessionId);
        if (!registration) return res.status(404).json({ message: "Not found" });
        if (await registrationRepository.isCheckedIn(registration.id, sessionId)) return res.status(400).json({ message: "Already checked in" });
        const checkIn = await registrationRepository.createCheckIn({ registrationId: registration.id, sessionId, method: 'qr' });
        if (registration.cmeCertificateRequested && !registration.conferenceCertificateSent && session) {
            const certificate = await certificateService.generateCmeCertificate(registration.fullName);
            await emailService.sendCmeCertificateEmail(registration.email, registration.fullName, session.title, conference.name, certificate);
            await db.update(registrationsTable).set({ conferenceCertificateSent: true }).where(eq(registrationsTable.id, registration.id)).run();
        }
        res.json(checkIn);
    } catch (error: any) { res.status(400).json({ message: error.message }); }
};
export const manualCheckIn = async (req: RequestWithActiveConference, res: Response) => {
    try {
        const { registrationId } = req.body;
        const registration = await registrationRepository.getById(registrationId);
        if (!registration || registration.status !== "confirmed") return res.status(400).json({ message: "Invalid" });
        if (await registrationRepository.isCheckedIn(registration.id, registration.sessionId)) return res.status(400).json({ message: "Already checked in" });
        const checkIn = await registrationRepository.createCheckIn({ registrationId: registration.id, sessionId: registration.sessionId, method: 'manual' });
        const conference = req.activeConference;
        const session = await sessionRepository.getById(conference.slug, registration.sessionId);
        if (registration.cmeCertificateRequested && !registration.conferenceCertificateSent && session) {
            const certificate = await certificateService.generateCmeCertificate(registration.fullName);
            await emailService.sendCmeCertificateEmail(registration.email, registration.fullName, session.title, conference.name, certificate);
            await db.update(registrationsTable).set({ conferenceCertificateSent: true }).where(eq(registrationsTable.id, registration.id)).run();
        }
        res.json(checkIn);
    } catch (error: any) { res.status(400).json({ message: error.message }); }
};
export const bulkCheckIn = async (req: RequestWithActiveConference, res: Response) => {
    try {
      const { registrationIds, sessionId } = req.body;
      let successCount = 0; let failCount = 0;
      for (const regId of registrationIds) {
        try {
          const registration = await registrationRepository.getById(regId);
          if (!registration || registration.sessionId !== sessionId || registration.status !== 'confirmed') { failCount++; continue; }
          if (await registrationRepository.isCheckedIn(registration.id, sessionId)) { successCount++; continue; }
          await registrationRepository.createCheckIn({ registrationId: registration.id, sessionId: sessionId, method: 'manual' });
          successCount++;
        } catch (e) { failCount++; }
      }
      res.json({ successCount, failCount });
    } catch (error: any) { res.status(400).json({ message: error.message }); }
};