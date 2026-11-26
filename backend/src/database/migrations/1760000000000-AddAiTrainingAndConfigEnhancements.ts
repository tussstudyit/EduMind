import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAiTrainingAndConfigEnhancements1760000000000 implements MigrationInterface {
  name = 'AddAiTrainingAndConfigEnhancements1760000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "ai_config"
        ALTER COLUMN "provider" TYPE varchar(32),
        ALTER COLUMN "modelName" SET DEFAULT 'gemini-3.8-flash',
        ALTER COLUMN "ocrEngine" SET DEFAULT 'gemini-multimodal',
        ALTER COLUMN "serviceStatus" SET DEFAULT 'healthy';

      ALTER TABLE "ai_config"
        ADD COLUMN IF NOT EXISTS "apiKey" text NULL,
        ADD COLUMN IF NOT EXISTS "customEndpoint" varchar(255) NULL,
        ADD COLUMN IF NOT EXISTS "systemPrompt" text NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "activeModelVersionId" varchar(64) NULL;

      UPDATE "ai_config"
      SET
        "modelName" = CASE
          WHEN "modelName" = '' OR "modelName" LIKE 'gemini-1.5%' OR "modelName" LIKE 'gemini-2.%' THEN 'gemini-3.8-flash'
          ELSE "modelName"
        END,
        "ocrEngine" = CASE WHEN "ocrEngine" = '' THEN 'gemini-multimodal' ELSE "ocrEngine" END,
        "ocrConfidenceThreshold" = COALESCE("ocrConfidenceThreshold", 0.85),
        "maxUploadSizeMB" = COALESCE("maxUploadSizeMB", 10),
        "serviceStatus" = CASE WHEN "serviceStatus" = 'offline' THEN 'healthy' ELSE "serviceStatus" END
      WHERE "id" = 'default';

      CREATE TABLE IF NOT EXISTS "ai_corpus_documents" (
        "id" varchar(64) PRIMARY KEY,
        "uploaderId" varchar(64) NOT NULL,
        "uploaderName" varchar(160) NOT NULL DEFAULT '',
        "uploaderRole" varchar(16) NOT NULL DEFAULT 'student',
        "title" varchar(200) NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "subject" varchar(120) NOT NULL DEFAULT '',
        "category" varchar(120) NOT NULL DEFAULT 'Ghi chú học tập',
        "fileName" varchar(255) NOT NULL DEFAULT '',
        "mimeType" varchar(120) NOT NULL DEFAULT 'application/octet-stream',
        "fileSize" integer NOT NULL DEFAULT 0,
        "extractedText" text NOT NULL DEFAULT '',
        "chunkCount" integer NOT NULL DEFAULT 0,
        "status" varchar(24) NOT NULL DEFAULT 'pending_review',
        "reviewedBy" varchar(160) NULL,
        "reviewNotes" text NULL,
        "includedInTraining" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IDX_ai_corpus_status" ON "ai_corpus_documents" ("status", "createdAt" DESC);
      CREATE INDEX IF NOT EXISTS "IDX_ai_corpus_uploader" ON "ai_corpus_documents" ("uploaderId", "createdAt" DESC);

      CREATE TABLE IF NOT EXISTS "ai_dataset_entries" (
        "id" varchar(64) PRIMARY KEY,
        "sourceType" varchar(24) NOT NULL DEFAULT 'manual',
        "sourceId" varchar(64) NULL,
        "subject" varchar(120) NOT NULL DEFAULT 'Tổng hợp',
        "prompt" text NOT NULL,
        "expectedResponse" text NOT NULL,
        "systemPrompt" text NOT NULL DEFAULT '',
        "tags" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "qualityScore" numeric(4,2) NOT NULL DEFAULT 0.90,
        "status" varchar(24) NOT NULL DEFAULT 'labeled',
        "createdBy" varchar(64) NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IDX_ai_dataset_status" ON "ai_dataset_entries" ("status", "createdAt" DESC);

      CREATE TABLE IF NOT EXISTS "ai_training_jobs" (
        "id" varchar(64) PRIMARY KEY,
        "name" varchar(200) NOT NULL,
        "baseModel" varchar(120) NOT NULL DEFAULT 'gemini-3.8-flash',
        "targetModelName" varchar(160) NOT NULL,
        "datasetCount" integer NOT NULL DEFAULT 0,
        "hyperparameters" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "status" varchar(24) NOT NULL DEFAULT 'queued',
        "progressPercent" integer NOT NULL DEFAULT 0,
        "currentEpoch" integer NOT NULL DEFAULT 0,
        "totalEpochs" integer NOT NULL DEFAULT 3,
        "trainingLoss" numeric(6,4) NULL,
        "validationLoss" numeric(6,4) NULL,
        "logs" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "startedAt" timestamptz NULL,
        "completedAt" timestamptz NULL,
        "createdBy" varchar(64) NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IDX_ai_training_jobs_created" ON "ai_training_jobs" ("createdAt" DESC);

      CREATE TABLE IF NOT EXISTS "ai_model_versions" (
        "id" varchar(64) PRIMARY KEY,
        "jobId" varchar(64) NULL REFERENCES "ai_training_jobs"("id") ON DELETE SET NULL,
        "versionTag" varchar(64) NOT NULL,
        "modelIdentifier" varchar(160) NOT NULL,
        "baseModel" varchar(120) NOT NULL DEFAULT 'gemini-3.8-flash',
        "datasetSize" integer NOT NULL DEFAULT 0,
        "metrics" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "evaluationSummary" text NOT NULL DEFAULT '',
        "status" varchar(24) NOT NULL DEFAULT 'candidate',
        "isDeployed" boolean NOT NULL DEFAULT false,
        "deployedAt" timestamptz NULL,
        "deployedBy" varchar(160) NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IDX_ai_model_versions_deployed" ON "ai_model_versions" ("isDeployed", "createdAt" DESC);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "ai_model_versions";
      DROP TABLE IF EXISTS "ai_training_jobs";
      DROP TABLE IF EXISTS "ai_dataset_entries";
      DROP TABLE IF EXISTS "ai_corpus_documents";
      ALTER TABLE "ai_config"
        DROP COLUMN IF EXISTS "activeModelVersionId",
        DROP COLUMN IF EXISTS "systemPrompt",
        DROP COLUMN IF EXISTS "customEndpoint",
        DROP COLUMN IF EXISTS "apiKey";
    `);
  }
}
