import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRemainingLmsModules1720000000000 implements MigrationInterface {
  name = 'AddRemainingLmsModules1720000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "passwordHash" varchar(255),
        ADD COLUMN IF NOT EXISTS "phone" varchar(32) NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "department" varchar(160) NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "bio" text NOT NULL DEFAULT '';

      CREATE TABLE IF NOT EXISTS "topics" (
        "id" varchar(64) PRIMARY KEY,
        "subjectId" varchar(64) NOT NULL REFERENCES "subjects"("id") ON DELETE CASCADE,
        "name" varchar(160) NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "order" integer NOT NULL DEFAULT 1,
        "isHidden" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IDX_topics_subject_order" ON "topics" ("subjectId", "order");

      CREATE TABLE IF NOT EXISTS "materials" (
        "id" varchar(64) PRIMARY KEY,
        "lessonId" varchar(64) NOT NULL REFERENCES "lessons"("id") ON DELETE CASCADE,
        "courseId" varchar(64) NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
        "title" varchar(200) NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "fileType" varchar(16) NOT NULL DEFAULT 'pdf',
        "fileUrl" text NOT NULL,
        "fileSize" varchar(32) NOT NULL DEFAULT '',
        "uploadedAt" timestamptz NOT NULL DEFAULT now(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IDX_materials_course_lesson" ON "materials" ("courseId", "lessonId");

      CREATE TABLE IF NOT EXISTS "quizzes" (
        "id" varchar(64) PRIMARY KEY,
        "courseId" varchar(64) NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
        "courseTitle" varchar(200) NOT NULL DEFAULT '',
        "lessonId" varchar(64) NULL REFERENCES "lessons"("id") ON DELETE SET NULL,
        "title" varchar(200) NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "timeLimitMinutes" integer NOT NULL DEFAULT 0,
        "passingScore" numeric(7,2) NOT NULL DEFAULT 0,
        "maxScore" numeric(7,2) NOT NULL DEFAULT 0,
        "isPublished" boolean NOT NULL DEFAULT false,
        "questionCount" integer NOT NULL DEFAULT 0,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IDX_quizzes_course" ON "quizzes" ("courseId", "createdAt");

      CREATE TABLE IF NOT EXISTS "questions" (
        "id" varchar(64) PRIMARY KEY,
        "quizId" varchar(64) NOT NULL REFERENCES "quizzes"("id") ON DELETE CASCADE,
        "content" text NOT NULL,
        "type" varchar(24) NOT NULL DEFAULT 'multiple_choice',
        "points" numeric(7,2) NOT NULL DEFAULT 1,
        "options" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "explanation" text NULL,
        "order" integer NOT NULL DEFAULT 1,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IDX_questions_quiz_order" ON "questions" ("quizId", "order");

      CREATE TABLE IF NOT EXISTS "quiz_attempts" (
        "id" varchar(64) PRIMARY KEY,
        "quizId" varchar(64) NOT NULL REFERENCES "quizzes"("id") ON DELETE CASCADE,
        "quizTitle" varchar(200) NOT NULL DEFAULT '',
        "courseId" varchar(64) NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
        "studentId" varchar(64) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "studentName" varchar(160) NOT NULL DEFAULT '',
        "studentAvatar" varchar(12) NOT NULL DEFAULT '',
        "status" varchar(16) NOT NULL DEFAULT 'in_progress',
        "answers" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "totalScore" numeric(7,2) NOT NULL DEFAULT 0,
        "maxScore" numeric(7,2) NOT NULL DEFAULT 0,
        "startedAt" timestamptz NOT NULL DEFAULT now(),
        "submittedAt" timestamptz NULL,
        "gradedAt" timestamptz NULL,
        "gradedBy" varchar(160) NULL,
        "teacherNotes" text NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IDX_attempts_quiz_student" ON "quiz_attempts" ("quizId", "studentId");

      CREATE TABLE IF NOT EXISTS "ocr_scans" (
        "id" varchar(64) PRIMARY KEY,
        "studentId" varchar(64) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "fileName" varchar(255) NOT NULL,
        "imageUrl" text NOT NULL,
        "recognizedText" text NOT NULL DEFAULT '',
        "correctedText" text NOT NULL DEFAULT '',
        "status" varchar(16) NOT NULL DEFAULT 'processing',
        "sentToAI" boolean NOT NULL DEFAULT false,
        "notes" text NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IDX_ocr_student_created" ON "ocr_scans" ("studentId", "createdAt");

      CREATE TABLE IF NOT EXISTS "recommendations" (
        "id" varchar(64) PRIMARY KEY,
        "studentId" varchar(64) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "title" varchar(200) NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "reason" text NULL,
        "type" varchar(16) NOT NULL DEFAULT 'tip',
        "courseId" varchar(64) NULL REFERENCES "courses"("id") ON DELETE SET NULL,
        "isRead" boolean NOT NULL DEFAULT false,
        "isDismissed" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IDX_recommendations_student" ON "recommendations" ("studentId", "isDismissed", "createdAt");

      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" varchar(64) PRIMARY KEY,
        "userId" varchar(64) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "title" varchar(200) NOT NULL,
        "message" text NOT NULL,
        "type" varchar(16) NOT NULL DEFAULT 'info',
        "isRead" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "link" text NULL
      );
      CREATE INDEX IF NOT EXISTS "IDX_notifications_user_created" ON "notifications" ("userId", "createdAt");

      CREATE TABLE IF NOT EXISTS "system_logs" (
        "id" varchar(64) PRIMARY KEY,
        "level" varchar(8) NOT NULL DEFAULT 'info',
        "action" varchar(200) NOT NULL,
        "actorId" varchar(64) NULL,
        "actorName" varchar(160) NOT NULL DEFAULT 'System',
        "actorRole" varchar(12) NOT NULL DEFAULT 'admin',
        "timestamp" timestamptz NOT NULL DEFAULT now(),
        "details" text NOT NULL DEFAULT ''
      );
      CREATE INDEX IF NOT EXISTS "IDX_system_logs_timestamp" ON "system_logs" ("timestamp" DESC);

      CREATE TABLE IF NOT EXISTS "ai_config" (
        "id" varchar(32) PRIMARY KEY DEFAULT 'default',
        "provider" varchar(16) NOT NULL DEFAULT 'gemini',
        "modelName" varchar(120) NOT NULL DEFAULT '',
        "apiKeyMasked" varchar(255) NOT NULL DEFAULT '',
        "maxTokens" integer NOT NULL DEFAULT 2048,
        "temperature" numeric(4,3) NOT NULL DEFAULT 0.7,
        "ocrEngine" varchar(32) NOT NULL DEFAULT 'tesseract',
        "ocrConfidenceThreshold" numeric(4,3) NULL,
        "maxUploadSizeMB" integer NULL,
        "serviceStatus" varchar(16) NOT NULL DEFAULT 'offline',
        "dailyUsageCount" integer NOT NULL DEFAULT 0,
        "dailyUsageLimit" integer NOT NULL DEFAULT 1000,
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      INSERT INTO "ai_config" ("id") VALUES ('default') ON CONFLICT ("id") DO NOTHING;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "ai_config";
      DROP TABLE IF EXISTS "system_logs";
      DROP TABLE IF EXISTS "notifications";
      DROP TABLE IF EXISTS "recommendations";
      DROP TABLE IF EXISTS "ocr_scans";
      DROP TABLE IF EXISTS "quiz_attempts";
      DROP TABLE IF EXISTS "questions";
      DROP TABLE IF EXISTS "quizzes";
      DROP TABLE IF EXISTS "materials";
      DROP TABLE IF EXISTS "topics";
      ALTER TABLE "users" DROP COLUMN IF EXISTS "bio", DROP COLUMN IF EXISTS "department",
        DROP COLUMN IF EXISTS "phone", DROP COLUMN IF EXISTS "passwordHash";
    `);
  }
}
