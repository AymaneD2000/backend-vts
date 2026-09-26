import { readFileSync } from 'fs';
import { join } from 'path';
import { createIntegrationDataSource, resetPublicSchema } from './integration-data-source';

const baselineHistory: ReadonlyArray<readonly [number, string]> = [
  [1783728000000, 'BootstrapPreStitchSchema1783728000000'],
  [1783814400000, 'AddRideScheduling1783814400000'],
  [1783900800000, 'AddEmailOtpIdentity1783900800000'],
  [1783987200000, 'AddMerchantLogo1783987200000'],
  [1784160000000, 'AddMerchantCatalog1784160000000'],
  [1784163600000, 'AddCommerceOrders1784163600000'],
  [1784167200000, 'AddPromotionsAndDiscounts1784167200000'],
  [1784250000000, 'AddCategoryImages1784250000000'],
];

async function main(): Promise<void> {
  const db = await createIntegrationDataSource();
  try {
    await resetPublicSchema(db);
    await db.query(readFileSync(join(__dirname, '../fixtures/pre-stitch-schema.sql'), 'utf8'));
    await db.query(`
      CREATE TABLE "migrations" (
        "id" SERIAL NOT NULL,
        "timestamp" bigint NOT NULL,
        "name" character varying NOT NULL,
        CONSTRAINT "PK_migrations_id" PRIMARY KEY ("id")
      )
    `);
    for (const [timestamp, name] of baselineHistory) {
      await db.query(
        'INSERT INTO "migrations" ("timestamp", "name") VALUES ($1, $2)',
        [timestamp, name],
      );
    }
  } finally {
    await db.destroy();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
