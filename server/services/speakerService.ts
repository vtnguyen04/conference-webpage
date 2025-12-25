import { speakerRepository } from "../repositories/speakerRepository";
import { sessionRepository } from "../repositories/sessionRepository";
import { registrationService } from "./registrationService";
import { db } from "../db";
import { registrations as registrationsTable } from "@shared/schema";
import { eq } from "drizzle-orm";
import { Speaker, Conference } from "@shared/schema";
export class SpeakerService {
  async autoRegisterModerator(speaker: Speaker, conference: Conference) {
    if ((speaker.role !== 'moderator' && speaker.role !== 'both') || !speaker.email) return;
    try {
      const allSessions = await sessionRepository.getAll(conference.slug);
      const sessionIds = allSessions.map(s => s.id);
      if (sessionIds.length > 0) {
        const result = await registrationService.batchRegisterSessions({
          conferenceSlug: conference.slug,
          sessionIds,
          fullName: speaker.name,
          email: speaker.email,
          phone: '',
          cmeCertificateRequested: false,
          role: 'participant'
        });
        if (result.success && result.registrations) {
          for (const reg of result.registrations) {
            await db.update(registrationsTable)
              .set({ status: 'confirmed', confirmationToken: null, confirmationTokenExpires: null })
              .where(eq(registrationsTable.id, reg.id))
              .run();
          }
          console.log(`Auto-confirmed registrations for moderator ${speaker.name}.`);
        }
      }
    } catch (e) {
      console.error("Auto-registration error:", e);
    }
  }
  async createSpeaker(slug: string, data: any, conference: Conference) {
    const speaker = await speakerRepository.create(slug, data);
    await this.autoRegisterModerator(speaker, conference);
    return speaker;
  }
  async updateSpeaker(slug: string, id: string, updates: any, conference: Conference) {
    const oldSpeaker = await speakerRepository.getById(slug, id);
    const updated = await speakerRepository.update(slug, id, updates);
    if (updated && (updated.role === 'moderator' || updated.role === 'both') && updated.email) {
        if (!oldSpeaker || oldSpeaker.email !== updated.email || oldSpeaker.role !== updated.role) {
            await this.autoRegisterModerator(updated, conference);
        }
    }
    return updated;
  }
}
export const speakerService = new SpeakerService();