import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordResetWorkflow1730000000000 implements MigrationInterface {
  name = 'AddPasswordResetWorkflow1730000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "password_reset_requests" (
        "id" varchar(64) PRIMARY KEY,
        "userId" varchar(64) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "email" varchar(255) NOT NULL,
        "name" varchar(160) NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'pending',
        "requestedAt" timestamptz NOT NULL DEFAULT now(),
        "sentAt" timestamptz NULL,
        "completedAt" timestamptz NULL,
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IDX_password_reset_requests_status_date"
        ON "password_reset_requests" ("status", "requestedAt");
      CREATE INDEX IF NOT EXISTS "IDX_password_reset_requests_user_date"
        ON "password_reset_requests" ("userId", "requestedAt");

      CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
        "id" varchar(64) PRIMARY KEY,
        "tokenHash" varchar(64) NOT NULL UNIQUE,
        "userId" varchar(64) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "requestId" varchar(64) NOT NULL REFERENCES "password_reset_requests"("id") ON DELETE CASCADE,
        "expiresAt" timestamptz NOT NULL,
        "usedAt" timestamptz NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IDX_password_reset_tokens_user_used"
        ON "password_reset_tokens" ("userId", "usedAt");
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "password_reset_tokens";
      DROP TABLE IF EXISTS "password_reset_requests";
    `);
  }
}
