CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`metadata` text,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_audit_logs_user` ON `audit_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_created` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE TABLE `check_ins` (
	`id` text PRIMARY KEY NOT NULL,
	`registration_id` text NOT NULL,
	`session_id` text NOT NULL,
	`method` text DEFAULT 'qr' NOT NULL,
	`device_id` text,
	`checked_in_at` integer,
	`created_at` integer,
	FOREIGN KEY (`registration_id`) REFERENCES `registrations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_checkins_reg` ON `check_ins` (`registration_id`);--> statement-breakpoint
CREATE INDEX `idx_checkins_session` ON `check_ins` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_checkins_checked_at` ON `check_ins` (`checked_in_at`);--> statement-breakpoint
CREATE TABLE `contact_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`submitted_at` integer
);
--> statement-breakpoint
CREATE TABLE `registrations` (
	`id` text PRIMARY KEY NOT NULL,
	`conference_slug` text NOT NULL,
	`session_id` text NOT NULL,
	`full_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`organization` text,
	`position` text,
	`cme_certificate_requested` integer DEFAULT false NOT NULL,
	`conference_certificate_sent` integer DEFAULT false NOT NULL,
	`qr_code` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`email_sent` integer DEFAULT false,
	`confirmation_token` text,
	`confirmation_token_expires` integer,
	`reminder_count` integer DEFAULT 0 NOT NULL,
	`last_reminder_sent_at` integer,
	`registered_at` integer,
	`created_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_registrations_slug` ON `registrations` (`conference_slug`);--> statement-breakpoint
CREATE INDEX `idx_registrations_session` ON `registrations` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_registrations_email` ON `registrations` (`email`);--> statement-breakpoint
CREATE INDEX `idx_registrations_email_session` ON `registrations` (`email`,`session_id`);--> statement-breakpoint
CREATE INDEX `idx_registrations_confirmation_token` ON `registrations` (`confirmation_token`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`sid` text PRIMARY KEY NOT NULL,
	`sess` text NOT NULL,
	`expire` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `IDX_session_expire` ON `sessions` (`expire`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text,
	`first_name` text,
	`last_name` text,
	`role` text DEFAULT 'user' NOT NULL,
	`profile_image_url` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);