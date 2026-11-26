import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowStandaloneQuizzes1750000000000 implements MigrationInterface {
  name = 'AllowStandaloneQuizzes1750000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "quizzes" ALTER COLUMN "courseId" DROP NOT NULL;
      ALTER TABLE "quiz_attempts" ALTER COLUMN "courseId" DROP NOT NULL;

      ALTER TABLE "quizzes"
        ADD COLUMN IF NOT EXISTS "createdBy" varchar(64) NULL
        REFERENCES "users"("id") ON DELETE SET NULL;

      UPDATE "quizzes" q
      SET "createdBy" = c."teacherId"
      FROM "courses" c
      WHERE q."courseId" = c."id" AND q."createdBy" IS NULL;

      CREATE INDEX IF NOT EXISTS "IDX_quizzes_created_by"
        ON "quizzes" ("createdBy", "createdAt");
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const [{ hasStandalone }] = await queryRunner.query(`
      SELECT EXISTS (SELECT 1 FROM "quizzes" WHERE "courseId" IS NULL) AS "hasStandalone"
    `);
    if (hasStandalone) {
      throw new Error('Cannot reverse standalone quiz support while standalone exams exist.');
    }

    await queryRunner.query(`
      ALTER TABLE "quiz_attempts" ALTER COLUMN "courseId" SET NOT NULL;
      ALTER TABLE "quizzes" ALTER COLUMN "courseId" SET NOT NULL;
      DROP INDEX IF EXISTS "IDX_quizzes_created_by";
      ALTER TABLE "quizzes" DROP COLUMN IF EXISTS "createdBy";
    `);
  }
}
