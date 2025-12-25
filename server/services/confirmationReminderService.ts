import cron from "node-cron";
import { registrationRepository } from "../repositories/registrationRepository";
import { conferenceRepository } from "../repositories/conferenceRepository";
import { emailService } from "./emailService";
const REMINDER_INTERVAL_HOURS = 4;
const MAX_REMINDERS = 2;
const CANCELLATION_THRESHOLD_HOURS = 24;
export class ConfirmationReminderService {
  start() {
    cron.schedule("0 * * * *", async () => {
      console.log("[ConfirmationReminderService] Checking for pending confirmations...");
      try {
        const activeConference = await conferenceRepository.getActive();
        if (!activeConference) return;
        const pending = await registrationRepository.getDueForReminder(activeConference.slug, REMINDER_INTERVAL_HOURS, MAX_REMINDERS);
        for (const reg of pending) {
          const registeredAt = reg.registeredAt ? new Date(reg.registeredAt) : null;
          if (registeredAt && (new Date().getTime() - registeredAt.getTime()) > CANCELLATION_THRESHOLD_HOURS * 60 * 60 * 1000) {
            if (reg.reminderCount >= MAX_REMINDERS) {
              await registrationRepository.deleteUnconfirmed(reg.id);
              continue;
            }
          }
          await emailService.sendConfirmationReminderEmail(reg.email, activeConference.name, { name: reg.fullName, email: reg.email, confirmationToken: reg.confirmationToken });
          await registrationRepository.updateReminderStatus(reg.id);
        }
      } catch (error) {
        console.error("Error in confirmation reminder service:", error);
      }
    });
  }
}
export const confirmationReminderService = new ConfirmationReminderService();
