import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createIntegrationDataSource, resetPublicSchema } from './integration-data-source';

async function main(): Promise<void> {
  const db = await createIntegrationDataSource();
  try {
    await resetPublicSchema(db);
    const schema = await db.driver.createSchemaBuilder().log();
    if (schema.upQueries.some(({ parameters }) => (parameters?.length ?? 0) > 0)) {
      throw new Error('Pre-Stitch schema snapshot contains parameterized DDL');
    }
    const sql = [
      'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
      ...schema.upQueries.map(({ query }) => `${query.trim().replace(/;$/, '')};`),
    ].join('\n\n') + '\n';
    const fixturePath = join(__dirname, '../fixtures/pre-stitch-schema.sql');
    const sourcePath = join(__dirname, '../../src/database/baseline/pre-stitch-schema.ts');
    if (existsSync(fixturePath) || existsSync(sourcePath)) {
      throw new Error('Refusing to overwrite the immutable pre-Stitch baseline');
    }
    mkdirSync(join(__dirname, '../fixtures'), { recursive: true });
    mkdirSync(join(__dirname, '../../src/database/baseline'), { recursive: true });
    writeFileSync(fixturePath, sql);
    writeFileSync(
      sourcePath,
      `// Generated once before Stitch feature entities. Do not regenerate.\nexport const PRE_STITCH_SCHEMA_SQL = ${JSON.stringify(sql)};\n`,
    );
  } finally {
    await db.destroy();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
