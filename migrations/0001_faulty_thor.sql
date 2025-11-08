CREATE TABLE "contact_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"submitted_at" timestamp DEFAULT now()
);
