import { sessionRepository } from "../repositories/sessionRepository";
import { Session, Registration, registrations as registrationsTable, CheckIn, InsertRegistration } from "@shared/schema";
import { BatchRegistrationRequest } from "@shared/validation";
import { randomUUID } from "node:crypto";
import crypto from "node:crypto";
import QRCode from "qrcode";
import { registrationRepository } from "../repositories/registrationRepository";
import { emailService } from "./emailService";
import { backgroundQueue } from "../utils/backgroundQueue";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { jsonStorage } from "../jsonStorage";
import { certificateService } from "./certificateService";

export class RegistrationService {
    private formatSessionTime(startTime: string | Date, endTime: string | Date): string {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const dateStr = start.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const timeStr = `${start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
        return `${dateStr} | ${timeStr}`;
    }

    private checkSessionTimeOverlap(sessions: Session[]): boolean {
        if (sessions.length <= 1) return false;
        const sorted = [...sessions].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        for (let i = 0; i < sorted.length - 1; i++) {
            if (new Date(sorted[i].endTime).getTime() > new Date(sorted[i + 1].startTime).getTime()) return true;
        }
        return false;
    }

    async batchRegisterSessions(request: BatchRegistrationRequest): Promise<{ success: boolean; registrations?: Registration[]; confirmationToken?: string; error?: string; failedSessions?: string[]; }> {
        const { conferenceSlug, sessionIds, email, fullName, phone, organization, position, role, certificateRequested } = request;
        const allSessions = await sessionRepository.getAll(conferenceSlug);
        const requested = allSessions.filter(s => sessionIds.includes(s.id));

        if (requested.length !== sessionIds.length) return { success: false, error: "Không tìm thấy một số phiên yêu cầu" };
        if (this.checkSessionTimeOverlap(requested)) return { success: false, error: "Thời gian các phiên bị chồng chéo" };

        const failedSessions: string[] = [];
        for (const session of requested) {
            if (session.capacity) {
                const currentCount = await registrationRepository.getSessionRegistrationCount(session.id);
                if (currentCount >= session.capacity) failedSessions.push(session.title);
            }
        }

        if (failedSessions.length > 0) {
            return { 
                success: false, 
                error: `Một số phiên đã hết chỗ: ${failedSessions.join(", ")}`,
                failedSessions 
            };
        }

        try {
            const token = crypto.randomBytes(32).toString("hex");
            const newRegistrationsData = await Promise.all(sessionIds.map(async (sid) => {
                return {
                    id: randomUUID(),
                    conferenceSlug,
                    sessionId: sid,
                    fullName,
                    email,
                    phone,
                    organization: organization || null,
                    position: position || null,
                    role,
                    certificateRequested,
                    conferenceCertificateSent: false,
                    status: "pending",
                    qrCode: await QRCode.toDataURL(`CONF|${conferenceSlug}|${sid}|${email}|${Date.now()}`),
                    confirmationToken: token,
                    confirmationTokenExpires: new Date(Date.now() + 3600000),
                    createdAt: new Date(),
                    registeredAt: new Date(),
                    emailSent: false,
                    reminderCount: 0,
                } as any;
            }));
            const created = await registrationRepository.createBatchInDb(newRegistrationsData);
            return { success: true, registrations: created, confirmationToken: token };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }

    async confirmRegistration(token: string): Promise<{ success: boolean; conferenceName?: string; errorTitle?: string; errorMessage?: string }> {
        const registration = await db.select().from(registrationsTable).where(eq(registrationsTable.confirmationToken, token)).limit(1);

        if (!registration.length) {
            return { success: false, errorTitle: "Lỗi xác nhận", errorMessage: "Mã xác nhận không hợp lệ hoặc đã được sử dụng." };
        }

        const reg = registration[0];
        if (reg.confirmationTokenExpires && new Date(reg.confirmationTokenExpires) < new Date()) {
            return { success: false, errorTitle: "Mã hết hạn", errorMessage: "Liên kết xác nhận đã hết hạn. Vui lòng đăng ký lại." };
        }

        await db.update(registrationsTable)
            .set({ status: 'confirmed', confirmationToken: null, confirmationTokenExpires: null })
            .where(and(eq(registrationsTable.confirmationToken, token), eq(registrationsTable.status, 'pending')))
            .run();

        const conference = await jsonStorage.getConferenceBySlug(reg.conferenceSlug);
        if (conference) {
            backgroundQueue.enqueue(async () => {
                const userRegistrations = await registrationRepository.getByEmail(reg.email, conference.slug);
                const allSessions = await sessionRepository.getAll(conference.slug);
                const sessionDetails = userRegistrations
                    .map(r => {
                        const session = allSessions.find(s => s.id === r.sessionId);
                        if (!session) return null;
                        return { 
                            title: session.title, 
                            time: this.formatSessionTime(session.startTime, session.endTime), 
                            room: session.room, 
                            qrCode: r.qrCode! 
                        };
                    })
                    .filter(Boolean) as any[];

                if (sessionDetails.length > 0) {
                    await emailService.sendConsolidatedRegistrationEmail(reg.email, reg.fullName, conference.name, reg.certificateRequested, sessionDetails);
                }
            });
            return { success: true, conferenceName: conference.name };
        }

        return { success: true, conferenceName: "Hội nghị" };
    }

    async addAdminRegistration(conferenceSlug: string, data: InsertRegistration): Promise<Registration> {
        const session = await sessionRepository.getById(conferenceSlug, data.sessionId);
        if (!session) throw new Error("Không tìm thấy phiên làm việc");

        if (session.capacity) {
            const currentCount = await registrationRepository.getSessionRegistrationCount(session.id);
            if (currentCount >= session.capacity) throw new Error(`Phiên "${session.title}" đã hết chỗ.`);
        }

        const newRegistration = await registrationRepository.createAdmin({ ...data, conferenceSlug });

        backgroundQueue.enqueue(async () => {
            const conference = await jsonStorage.getConferenceBySlug(conferenceSlug);
            await emailService.sendConsolidatedRegistrationEmail(
                newRegistration.email,
                newRegistration.fullName,
                conference?.name || "Hội nghị",
                newRegistration.certificateRequested,
                [{ 
                    title: session.title, 
                    time: this.formatSessionTime(session.startTime, session.endTime), 
                    room: session.room, 
                    qrCode: newRegistration.qrCode! 
                }]
            );
        });

        return newRegistration;
    }

    async processCheckIn(registration: Registration, sessionId: string, conferenceName: string, method: 'qr' | 'manual'): Promise<CheckIn> {
        if (await registrationRepository.isCheckedIn(registration.id, sessionId)) {
            throw new Error("Người tham dự này đã check-in rồi.");
        }

        const checkIn = await registrationRepository.createCheckIn({ 
            registrationId: registration.id, 
            sessionId, 
            method 
        });

        // Xử lý Chứng nhận tham dự hội nghị tự động nếu có yêu cầu (Gửi duy nhất 1 lần cho cả hội nghị)
        if (registration.certificateRequested) {
            backgroundQueue.enqueue(async () => {
                // Kiểm tra xem người dùng này đã nhận chứng nhận nào trong hội nghị này chưa
                const userRegistrations = await registrationRepository.getByEmail(registration.email, registration.conferenceSlug);
                const alreadySent = userRegistrations.some(r => r.conferenceCertificateSent);

                if (!alreadySent) {
                    const session = await sessionRepository.getById(registration.conferenceSlug, sessionId);
                    if (session) {
                        const certificate = await certificateService.generateCertificate(registration.fullName);
                        // Gửi email chứng nhận chung cho hội nghị
                        await emailService.sendCertificateEmail(registration.email, registration.fullName, "Hội nghị", conferenceName, certificate);
                        
                        // Đánh dấu tất cả các đăng ký của người này trong hội nghị này là đã gửi chứng nhận
                        await db.update(registrationsTable)
                            .set({ conferenceCertificateSent: true })
                            .where(and(
                                eq(registrationsTable.email, registration.email),
                                eq(registrationsTable.conferenceSlug, registration.conferenceSlug)
                            )).run();
                    }
                }
            });
        }

        return checkIn;
    }
}

export const registrationService = new RegistrationService();