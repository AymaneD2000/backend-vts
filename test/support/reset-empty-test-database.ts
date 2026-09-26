import { createIntegrationDataSource, resetPublicSchema } from './integration-data-source';

async function main(): Promise<void> {
  const db = await createIntegrationDataSource();
  try {
    await resetPublicSchema(db);
  } finally {
    await db.destroy();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
