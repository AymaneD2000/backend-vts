import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailOtpIdentity1783900800000
  implements MigrationInterface
{
  name = 'AddEmailOtpIdentity1783900800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" ALTER COLUMN "phone" DROP NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified" boolean NOT NULL DEFAULT false',
    );
    await queryRunner.query(
      'UPDATE "users" SET "email" = LOWER(TRIM("email")) WHERE "email" IS NOT NULL',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "IDX_users_email_unique" ON "users" ("email") WHERE "email" IS NOT NULL',
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'CHK_users_identity'
        ) THEN
          ALTER TABLE "users"
          ADD CONSTRAINT "CHK_users_identity"
          CHECK ("phone" IS NOT NULL OR "email" IS NOT NULL);
        END IF;
      END $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "CHK_users_identity"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_users_email_unique"',
    );
    await queryRunner.query(
      'ALTER TABLE "users" DROP COLUMN IF EXISTS "email_verified"',
    );
    await queryRunner.query(
      'ALTER TABLE "users" ALTER COLUMN "phone" SET NOT NULL',
    );
  }
}
