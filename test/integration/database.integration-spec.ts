import { readFileSync } from 'fs';
import { join } from 'path';
import { DataSource, MigrationInterface, QueryRunner } from 'typeorm';
import {
  createIntegrationDataSource,
  createMigrationTestDataSource,
  resetPublicSchema,
  runTargetMigration,
} from '../support/integration-data-source';
import { BootstrapPreStitchSchema1783728000000 } from '../../src/database/migrations/1783728000000-BootstrapPreStitchSchema';
import { PRE_STITCH_SCHEMA_SQL } from '../../src/database/baseline/pre-stitch-schema';

class CreateMigrationProbe implements MigrationInterface {
  name = 'CreateMigrationProbe';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE IF NOT EXISTS "migration_probe" ("id" integer NOT NULL)',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "migration_probe"');
  }
}

describe('integration database', () => {
  let db: DataSource;

  beforeAll(async () => {
    db = await createIntegrationDataSource();
  });

  afterAll(async () => {
    await db?.destroy();
  });

  it('connects with synchronize disabled', async () => {
    expect(db.options.synchronize).toBe(false);
    expect(await db.query('select 1 as value')).toEqual([{ value: 1 }]);
  });

  it('runs one target migration without applying later feature schema', async () => {
    const migrationDb = await createMigrationTestDataSource();
    try {
      await runTargetMigration(migrationDb, CreateMigrationProbe);
      const tables = await migrationDb.query(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = 'public' ORDER BY table_name`,
      );
      const names = tables.map((row: { table_name: string }) => row.table_name);
      expect(names).toEqual(expect.arrayContaining(['users', 'rides', 'merchants', 'products', 'orders', 'migration_probe']));
      expect(names).not.toContain('merchant_favorites');
      expect(names).not.toContain('ride_offers');
      expect(names).not.toContain('payment_transactions');
    } finally {
      await migrationDb.destroy();
    }
  });

  it('bootstraps an empty schema and is a no-op on an existing schema', async () => {
    const migrationDb = await createIntegrationDataSource();
    try {
      await resetPublicSchema(migrationDb);
      await runTargetMigration(migrationDb, BootstrapPreStitchSchema1783728000000);
      const first = await migrationDb.query(
        `SELECT to_regclass('public.users') AS users, to_regclass('public.rides') AS rides`,
      );
      expect(first[0]).toEqual({ users: 'users', rides: 'rides' });
      await expect(
        runTargetMigration(migrationDb, BootstrapPreStitchSchema1783728000000),
      ).resolves.toBeUndefined();
    } finally {
      await migrationDb.destroy();
    }
  });

  it('keeps the immutable baseline fixture aligned with its source snapshot', () => {
    const fixture = readFileSync(join(__dirname, '../fixtures/pre-stitch-schema.sql'), 'utf8');
    const source = readFileSync(join(__dirname, '../../src/database/baseline/pre-stitch-schema.ts'), 'utf8');
    expect(fixture).toContain('uuid-ossp');
    expect(fixture).toContain('CREATE TABLE "users"');
    expect(fixture).toContain('CREATE TABLE "rides"');
    expect(fixture).toContain('CREATE TABLE "merchants"');
    expect(fixture).toContain('CREATE TABLE "products"');
    expect(fixture).toContain('CREATE TABLE "orders"');
    expect(fixture).not.toContain('merchant_favorites');
    expect(fixture).not.toContain('ride_offers');
    expect(fixture).not.toContain('payment_transactions');
    expect(fixture).not.toContain('driver_ledger_entries');
    expect(source).toContain('PRE_STITCH_SCHEMA_SQL');
    expect(fixture).toBe(PRE_STITCH_SCHEMA_SQL);
  });
});
