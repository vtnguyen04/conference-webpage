import cron from 'node-cron';
import { db } from '../db';
import { registrations, checkIns } from '@shared/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { emailService } from './emailService';
import { conferenceRepository } from '../repositories/conferenceRepository';
import { sessionRepository } from '../repositories/sessionRepository';
import { certificateService } from './certificateService';

export class CertificateAutomationService {
  start() {
    // Chạy mỗi phút để kiểm tra các phiên vừa kết thúc
    cron.schedule('* * * * *', async () => {
      try {
        await this.processCertificates();
      } catch (error) {
        console.error('[CertificateAutomationService] Error processing certificates:', error);
      }
    });
  }

  private async processCertificates() {
    const now = new Date();
    const activeConference = await conferenceRepository.getActive();
    if (!activeConference) return;

    const allSessions = await sessionRepository.getAll(activeConference.slug);
    const endedSessionIds = allSessions
      .filter(s => new Date(s.endTime) < now)
      .map(s => s.id);

    if (endedSessionIds.length === 0) return;

    // Tìm tất cả các bản đăng ký đã check-in vào các phiên đã kết thúc
    // và có yêu cầu chứng chỉ nhưng chưa được gửi.
    const eligibleRegistrations = await db
      .select({
        email: registrations.email,
        fullName: registrations.fullName,
        conferenceSlug: registrations.conferenceSlug,
      })
      .from(registrations)
      .innerJoin(checkIns, eq(registrations.id, checkIns.registrationId))
      .where(
        and(
          eq(registrations.conferenceSlug, activeConference.slug),
          eq(registrations.certificateRequested, true),
          eq(registrations.conferenceCertificateSent, false),
          inArray(checkIns.sessionId, endedSessionIds)
        )
      )
      .all();

    // Loại bỏ trùng lặp email để chỉ gửi 1 chứng chỉ duy nhất
    const uniqueEmails = Array.from(new Set(eligibleRegistrations.map(r => r.email)));

    for (const email of uniqueEmails) {
      const regInfo = eligibleRegistrations.find(r => r.email === email);
      if (!regInfo) continue;

      try {
        console.log(`[CertificateAutomationService] Sending consolidated certificate to ${email} for conference ${activeConference.name}`);
        
        const certificate = await certificateService.generateCertificate(regInfo.fullName);
        await emailService.sendCertificateEmail(
          email,
          regInfo.fullName,
          "Hội nghị",
          activeConference.name,
          certificate
        );

        // Đánh dấu tất cả các bản đăng ký của người này trong hội nghị này là đã gửi chứng nhận
        await db.update(registrations)
          .set({ conferenceCertificateSent: true })
          .where(
            and(
              eq(registrations.email, email),
              eq(registrations.conferenceSlug, activeConference.slug)
            )
          )
          .run();
          
      } catch (error) {
        console.error(`[CertificateAutomationService] Failed to send certificate to ${email}:`, error);
      }
    }
  }
}

export const certificateAutomationService = new CertificateAutomationService();
