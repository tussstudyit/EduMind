import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCoreTables1710000000000 implements MigrationInterface {
  name = 'CreateCoreTables1710000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" varchar(64) PRIMARY KEY,
        "email" varchar(255) NOT NULL UNIQUE,
        "name" varchar(160) NOT NULL,
        "role" varchar(12) NOT NULL DEFAULT 'student',
        "status" varchar(12) NOT NULL DEFAULT 'active',
        "avatar" varchar(12) NOT NULL DEFAULT '',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE "subjects" (
        "id" varchar(64) PRIMARY KEY,
        "code" varchar(32) NOT NULL UNIQUE,
        "name" varchar(160) NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "iconName" varchar(64) NOT NULL DEFAULT 'book',
        "isHidden" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE "courses" (
        "id" varchar(64) PRIMARY KEY,
        "subjectId" varchar(64) NOT NULL DEFAULT '',
        "subjectName" varchar(160) NOT NULL DEFAULT '',
        "teacherId" varchar(64) NOT NULL DEFAULT '',
        "teacherName" varchar(160) NOT NULL DEFAULT '',
        "title" varchar(200) NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "thumbnail" text NOT NULL DEFAULT '',
        "level" varchar(20) NOT NULL DEFAULT 'beginner',
        "status" varchar(20) NOT NULL DEFAULT 'draft',
        "tone" varchar(20) NOT NULL DEFAULT 'lavender',
        "badgeMark" varchar(24) NOT NULL DEFAULT '',
        "durationHours" integer NOT NULL DEFAULT 0,
        "lessonCount" integer NOT NULL DEFAULT 0,
        "enrolledCount" integer NOT NULL DEFAULT 0,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE "lessons" (
        "id" varchar(64) PRIMARY KEY,
        "courseId" varchar(64) NOT NULL,
        "title" varchar(200) NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "order" integer NOT NULL DEFAULT 1,
        "durationMinutes" integer NOT NULL DEFAULT 30,
        "videoUrl" text NULL,
        "contentMarkdown" text NOT NULL DEFAULT '',
        "isPublished" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "IDX_lessons_course_order" ON "lessons" ("courseId", "order");

      CREATE TABLE "enrollments" (
        "id" varchar(64) PRIMARY KEY,
        "courseId" varchar(64) NOT NULL,
        "courseTitle" varchar(200) NOT NULL DEFAULT '',
        "studentId" varchar(64) NOT NULL,
        "studentName" varchar(160) NOT NULL DEFAULT '',
        "studentAvatar" varchar(12) NOT NULL DEFAULT '',
        "studentEmail" varchar(255) NOT NULL DEFAULT '',
        "enrolledAt" timestamptz NOT NULL DEFAULT now(),
        "status" varchar(16) NOT NULL DEFAULT 'active',
        "progressPercent" integer NOT NULL DEFAULT 0,
        "lastAccessedAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_enrollment_student_course" UNIQUE ("studentId", "courseId")
      );

      CREATE TABLE "student_progress" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "studentId" varchar(64) NOT NULL,
        "courseId" varchar(64) NOT NULL,
        "completedLessonIds" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "lastLessonId" varchar(64) NOT NULL DEFAULT '',
        "lastStudiedAt" timestamptz NOT NULL DEFAULT now(),
        "percentCompleted" integer NOT NULL DEFAULT 0,
        "totalMinutesStudied" integer NOT NULL DEFAULT 0,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_progress_student_course" UNIQUE ("studentId", "courseId")
      );

      CREATE TABLE "conversations" (
        "id" varchar(64) PRIMARY KEY,
        "studentId" varchar(64) NOT NULL,
        "courseId" varchar(64) NULL,
        "title" varchar(200) NOT NULL DEFAULT 'Cuộc trò chuyện mới với AI Tutor',
        "isArchived" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "IDX_conversations_student_archived" ON "conversations" ("studentId", "isArchived");

      CREATE TABLE "chat_messages" (
        "id" varchar(64) PRIMARY KEY,
        "conversationId" varchar(64) NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
        "sender" varchar(12) NOT NULL,
        "content" text NOT NULL,
        "suggestions" jsonb NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "IDX_chat_messages_conversation_created" ON "chat_messages" ("conversationId", "createdAt");
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "chat_messages";
      DROP TABLE IF EXISTS "conversations";
      DROP TABLE IF EXISTS "student_progress";
      DROP TABLE IF EXISTS "enrollments";
      DROP TABLE IF EXISTS "lessons";
      DROP TABLE IF EXISTS "courses";
      DROP TABLE IF EXISTS "subjects";
      DROP TABLE IF EXISTS "users";
    `);
  }
}
