-- Enable pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create medical knowledge table
CREATE TABLE IF NOT EXISTS "medical_knowledge" (
	"knowledge_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"embedding" "vector(768)",
	"category" varchar(50) NOT NULL,
	"subcategory" text,
	"metadata" jsonb,
	"validated_by" varchar(100) NOT NULL,
	"validated_at" timestamp NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- HNSW index for vector similarity search (1.5ms query time @ 58K records)
-- Source: AWS pgvector benchmark - https://aws.amazon.com/blogs/database/optimize-generative-ai-applications-with-pgvector-indexing-a-deep-dive-into-ivfflat-and-hnsw-techniques/
CREATE INDEX IF NOT EXISTS "medical_knowledge_embedding_idx"
ON "medical_knowledge"
USING hnsw (embedding vector_cosine_ops);

-- Category index for filtering by procedure/faq/policy/location
CREATE INDEX IF NOT EXISTS "medical_knowledge_category_idx"
ON "medical_knowledge" (category, subcategory);
