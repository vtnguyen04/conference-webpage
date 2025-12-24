import { sessionRepository } from "../repositories/sessionRepository";
import { InsertRegistration, Session, Registration } from "@shared/schema";
import { BatchRegistrationRequest } from "@shared/validation";
import { randomUUID } from "node:crypto";
import crypto from "node:crypto";
import QRCode from "qrcode";
import { registrationRepository } from "../repositories/registrationRepository";

export class RegistrationService {
    private checkSessionTimeOverlap(sessions: Session[]): boolean {
        if (sessions.length <= 1) return false;
        const sorted = [...sessions].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        for (let i = 0; i < sorted.length - 1; i++) {
            if (new Date(sorted[i].endTime).getTime() > new Date(sorted[i + 1].startTime).getTime()) return true;
        }
        return false;
    }

    async batchRegisterSessions(request: BatchRegistrationRequest): Promise<{ success: boolean; registrations?: Registration[]; confirmationToken?: string; error?: string; failedSessions?: string[]; }> {
        const { conferenceSlug, sessionIds, email, fullName, phone, organization, position, role, cmeCertificateRequested } = request;
        const allSessions = await sessionRepository.getAll(conferenceSlug);
        const requested = allSessions.filter(s => sessionIds.includes(s.id));
        
        if (requested.length !== sessionIds.length) return { success: false, error: "Sessions not found" };
        if (this.checkSessionTimeOverlap(requested)) return { success: false, error: "Overlapping time" };
        
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
                    cmeCertificateRequested,
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
}
export const registrationService = new RegistrationService();