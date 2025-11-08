import cron from "node-cron";
import { getPendingRegistrationsDueForReminder, updateRegistrationReminderStatus, cancelAndDeleteUnconfirmedRegistration } from "./registrationDb";
import { sendConfirmationReminderEmail } from "./emailService";
import { jsonStorage } from "./jsonStorage";

const REMINDER_INTERVAL_HOURS = 4;
const MAX_REMINDERS = 2;
const CANCELLATION_THRESHOLD_HOURS = 24; // Registrations are cancelled after 24 hours if not confirmed and 2 reminders sent

export function startConfirmationReminderService() {
  // Schedule to run every hour
  cron.schedule("0 * * * *", async () => {
    console.log("Running confirmation reminder service...");
    try {
      const activeConference = await jsonStorage.getActiveConference();
      if (!activeConference) {
        console.log("No active conference found, skipping confirmation reminders.");
        return;
      }

      const pendingRegistrations = await getPendingRegistrationsDueForReminder(
        activeConference.year,
        REMINDER_INTERVAL_HOURS,
        MAX_REMINDERS
      );

      for (const registration of pendingRegistrations) {
        // Check if the registration is past its cancellation threshold
        const registeredAt = registration.registeredAt ? new Date(registration.registeredAt) : null;
        const now = new Date();

        if (registeredAt && (now.getTime() - registeredAt.getTime()) > CANCELLATION_THRESHOLD_HOURS * 60 * 60 * 1000) {
          // If registration is older than 24 hours and still pending after max reminders, cancel and delete
          if (registration.reminderCount >= MAX_REMINDERS) {
            console.log(`Cancelling and deleting unconfirmed registration ${registration.id} for ${registration.email}`);
            await cancelAndDeleteUnconfirmedRegistration(registration.id);
            continue; // Move to next registration
          }
        }

        // Send reminder email
        console.log(`Sending confirmation reminder to ${registration.email} for registration ${registration.id}`);
        await sendConfirmationReminderEmail(
          registration.email,
          activeConference.name,
          {
            name: registration.fullName,
            email: registration.email,
            confirmationToken: registration.confirmationToken,
          }
        );

        // Update reminder status
        await updateRegistrationReminderStatus(registration.id);
      }
      console.log("Confirmation reminder service finished.");
    } catch (error) {
      console.error("Error in confirmation reminder service:", error);
    }
  });
}
