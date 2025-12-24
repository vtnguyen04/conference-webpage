
import cron from 'node-cron';
import { db } from '../db';
import { registrations } from '@shared/schema';
import { and, eq } from 'drizzle-orm';
import { emailService } from './emailService';
import { conferenceRepository } from '../repositories/conferenceRepository';
import { sessionRepository } from '../repositories/sessionRepository';

export class ReminderService {
  start() {
    cron.schedule('* * * * *', async () => {
      console.log('[ReminderService] Checking for session reminders...');
      const now = new Date();
      const activeConference = await conferenceRepository.getActive();
      if (!activeConference) return;

      const allSessions = await sessionRepository.getAll(activeConference.slug);

      for (const session of allSessions) {
        const startTime = new Date(session.startTime);
        const timeDiff = startTime.getTime() - now.getTime();

        if (timeDiff <= 0) continue;

        // 1 day reminder
        if (timeDiff > 23 * 3600 * 1000 && timeDiff < 25 * 3600 * 1000) {
          await this.sendToConfirmed(session, '1 day', activeConference.name);
        }
        // 1 hour reminder
        if (timeDiff > 59 * 60 * 1000 && timeDiff < 61 * 60 * 1000) {
          await this.sendToConfirmed(session, '1 hour', activeConference.name);
        }
      }
    });
  }

  private async sendToConfirmed(session: any, timeLabel: string, confName: string) {
    const confirmed = await db.select().from(registrations).where(and(eq(registrations.sessionId, session.id), eq(registrations.status, 'confirmed')));
    for (const reg of confirmed) {
      await emailService.sendReminderEmail(reg.email, session.title, timeLabel, confName);
    }
  }
}

export const reminderService = new ReminderService();
