CREATE TABLE IF NOT EXISTS "contact_normalizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_id" text NOT NULL,
	"conversation_id" text,
	"status" varchar(20) NOT NULL,
	"confidence" real,
	"extracted_data" jsonb,
	"before" jsonb,
	"after" jsonb,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
