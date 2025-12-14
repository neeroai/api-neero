CREATE TABLE IF NOT EXISTS "appointments" (
	"appointment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"appointment_type" varchar(50) NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"location" varchar(255),
	"status" varchar(50) DEFAULT 'scheduled' NOT NULL,
	"reminders_sent" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "consents" (
	"consent_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"consent_type" varchar(50) NOT NULL,
	"granted" boolean DEFAULT false NOT NULL,
	"method" varchar(50) NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversation_state" (
	"conversation_id" uuid PRIMARY KEY NOT NULL,
	"lead_id" uuid,
	"current_stage" varchar(50) DEFAULT 'greeting' NOT NULL,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"messages_count" jsonb,
	"requires_human" boolean DEFAULT false NOT NULL,
	"handover_reason" text,
	"context" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leads" (
	"lead_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"name" text,
	"phone" varchar(20),
	"email" varchar(255),
	"country" varchar(100),
	"city" varchar(100),
	"procedure_interest" text,
	"stage" varchar(50) DEFAULT 'new' NOT NULL,
	"source" varchar(50) DEFAULT 'whatsapp' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "leads_conversation_id_unique" UNIQUE("conversation_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "message_logs" (
	"message_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"direction" varchar(20) NOT NULL,
	"text" text,
	"attachments_meta" jsonb,
	"tool_calls" jsonb,
	"model" varchar(100),
	"tokens_used" jsonb,
	"processing_time_ms" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "appointments" ADD CONSTRAINT "appointments_lead_id_leads_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "leads"("lead_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "consents" ADD CONSTRAINT "consents_lead_id_leads_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "leads"("lead_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversation_state" ADD CONSTRAINT "conversation_state_lead_id_leads_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "leads"("lead_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
