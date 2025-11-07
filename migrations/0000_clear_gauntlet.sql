CREATE TABLE "audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"action" varchar NOT NULL,
	"entity_type" varchar NOT NULL,
	"entity_id" varchar,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "check_ins" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" varchar NOT NULL,
	"session_id" varchar NOT NULL,
	"method" varchar DEFAULT 'qr' NOT NULL,
	"device_id" varchar,
	"checked_in_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "registrations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conference_year" integer NOT NULL,
	"session_id" varchar NOT NULL,
	"full_name" text NOT NULL,
	"email" varchar NOT NULL,
	"phone" varchar NOT NULL,
	"organization" text,
	"position" text,
	"cme_certificate_requested" boolean DEFAULT false NOT NULL,
	"qr_code" text,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"email_sent" boolean DEFAULT false,
	"confirmation_token" varchar,
	"confirmation_token_expires" timestamp,
	"registered_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"password_hash" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"role" varchar DEFAULT 'user' NOT NULL,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_audit_logs_user" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_created" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_checkins_reg" ON "check_ins" USING btree ("registration_id");--> statement-breakpoint
CREATE INDEX "idx_checkins_session" ON "check_ins" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_checkins_checked_at" ON "check_ins" USING btree ("checked_in_at");--> statement-breakpoint
CREATE INDEX "idx_registrations_year" ON "registrations" USING btree ("conference_year");--> statement-breakpoint
CREATE INDEX "idx_registrations_session" ON "registrations" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_registrations_email" ON "registrations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_registrations_email_session" ON "registrations" USING btree ("email","session_id");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");