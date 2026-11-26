import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserInstitution1740000000000 implements MigrationInterface {
  name = 'AddUserInstitution1740000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "institution" varchar(160) NOT NULL DEFAULT '';
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "institution";`);
  }
}
