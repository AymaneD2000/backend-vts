import { readFileSync } from 'fs';
import { join } from 'path';
import { DataSource, MigrationInterface, QueryRunner } from 'typeorm';

export type MigrationConstructor = new () => MigrationInterface;

export async function createIntegrationDataSource(): Promise<DataSource> {
  const db = new DataSource({
    type: 'postgres',
    url: process.env.TEST_DATABASE_URL ?? 'postgresql://vts:vts@127.0.0.1:5433/vts_test',
    entities: [join(__dirname, '../../src/**/*.entity{.ts,.js}')],
    migrations: [],
    migrationsTableName: 'migrations',
    installExtensions: false,
    synchronize: false,
  });
  await db.initialize();
  return db;
}

export async function resetPublicSchema(db: DataSource): Promise<void> {
  const [{ database }] = await db.query('SELECT current_database() AS database');
  if (process.env.NODE_ENV !== 'test' || !String(database).endsWith('_test')) {
    throw new Error(`Refusing to reset non-test database: ${database}`);
  }
  await db.query('DROP SCHEMA IF EXISTS public CASCADE');
  await db.query('CREATE SCHEMA public');
}

export async function createMigrationTestDataSource(
  priorMigrations: readonly MigrationConstructor[] = [],
): Promise<DataSource> {
  const db = await createIntegrationDataSource();
  try {
    await resetPublicSchema(db);
    const fixture = readFileSync(join(__dirname, '../fixtures/pre-stitch-schema.sql'), 'utf8');
    await db.query(fixture);
    for (const Migration of priorMigrations) {
      await runTargetMigration(db, Migration);
    }
    return db;
  } catch (error) {
    await db.destroy();
    throw error;
  }
}

export async function runTargetMigration(
  db: DataSource,
  Migration: MigrationConstructor,
): Promise<void> {
  const runner: QueryRunner = db.createQueryRunner();
  await runner.connect();
  await runner.startTransaction();
  try {
    await new Migration().up(runner);
    await runner.commitTransaction();
  } catch (error) {
    await runner.rollbackTransaction();
    throw error;
  } finally {
    await runner.release();
  }
}
