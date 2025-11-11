import cron from 'node-cron';
import { db } from './db';
import { registrations } from '@shared/schema';
import type { Session } from '@shared/schema';
import { and, eq, gte, lte } from 'drizzle-orm';
import { sendReminderEmail } from './emailService';
import { jsonStorage } from './jsonStorage';

export function startReminderService() {
  // Schedule a job to run every minute
  cron.schedule('* * * * *', async () => {
    console.log('Running reminder check...');
    const now = new Date();

    // Get all active conferences
    const activeConference = await jsonStorage.getActiveConference();
    if (!activeConference) {
      console.log('No active conference found for reminders.');
      return;
    }

    // Get all sessions for the active conference
    const allSessions: Session[] = await jsonStorage.getSessions(activeConference.slug);

    for (const session of allSessions) {
      const sessionStartTime = new Date(session.startTime);
      const timeDiff = sessionStartTime.getTime() - now.getTime(); // Difference in milliseconds

      // Only send reminders for sessions that haven't started yet
      if (timeDiff <= 0) continue;

      // 1 day reminder (23-25 hours before)
      if (timeDiff > 23 * 3600 * 1000 && timeDiff < 25 * 3600 * 1000) {
        const confirmedRegistrations = await db.select().from(registrations).where(and(eq(registrations.sessionId, session.id), eq(registrations.status, 'confirmed')));
        for (const registration of confirmedRegistrations) {
          await sendReminderEmail(registration.email, session.title, '1 day', activeConference.name);
        }
      }

      // 1 hour reminder (59-61 minutes before)
      if (timeDiff > 59 * 60 * 1000 && timeDiff < 61 * 60 * 1000) {
        const confirmedRegistrations = await db.select().from(registrations).where(and(eq(registrations.sessionId, session.id), eq(registrations.status, 'confirmed')));
        for (const registration of confirmedRegistrations) {
          await sendReminderEmail(registration.email, session.title, '1 hour', activeConference.name);
        }
      }

      // 15 minutes reminder (14-16 minutes before)
      if (timeDiff > 14 * 60 * 1000 && timeDiff < 16 * 60 * 1000) {
        const confirmedRegistrations = await db.select().from(registrations).where(and(eq(registrations.sessionId, session.id), eq(registrations.status, 'confirmed')));
        for (const registration of confirmedRegistrations) {
          await sendReminderEmail(registration.email, session.title, '15 minutes', activeConference.name);
        }
      }
    }
  });
}
