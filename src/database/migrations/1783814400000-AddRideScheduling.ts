import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRideScheduling1783814400000 implements MigrationInterface {
  name = 'AddRideScheduling1783814400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "rides" ADD COLUMN IF NOT EXISTS "scheduled_at" TIMESTAMPTZ',
    );
    await queryRunner.query(
      'ALTER TABLE "rides" ADD COLUMN IF NOT EXISTS "dispatched_at" TIMESTAMPTZ',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_rides_scheduled_at" ON "rides" ("scheduled_at")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_rides_scheduled_at"');
    await queryRunner.query(
      'ALTER TABLE "rides" DROP COLUMN IF EXISTS "dispatched_at"',
    );
    await queryRunner.query(
      'ALTER TABLE "rides" DROP COLUMN IF EXISTS "scheduled_at"',
    );
  }
}
