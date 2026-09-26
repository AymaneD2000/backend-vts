import { MigrationInterface, QueryRunner } from 'typeorm';
import { PRE_STITCH_SCHEMA_SQL } from '../baseline/pre-stitch-schema';

export class BootstrapPreStitchSchema1783728000000 implements MigrationInterface {
  name = 'BootstrapPreStitchSchema1783728000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const [{ exists }] = await queryRunner.query(
      `SELECT to_regclass('public.users') IS NOT NULL AS exists`,
    );
    if (exists) return;
    await queryRunner.query(PRE_STITCH_SCHEMA_SQL);
  }

  async down(): Promise<void> {
    // The baseline is retained on rollback; destructive schema rollback is not
    // safe for an existing installation and must use a forward migration.
  }
}
