ALTER TABLE "registrations" ADD COLUMN "reminder_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "last_reminder_sent_at" timestamp;--> statement-breakpoint
CREATE INDEX "idx_registrations_confirmation_token" ON "registrations" USING btree ("confirmation_token");