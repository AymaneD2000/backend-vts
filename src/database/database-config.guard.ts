export function assertSafeDatabaseConfiguration(input: {
  env: string;
  synchronize: boolean;
  migrationsRun: boolean;
}): void {
  if (input.env !== 'production') return;
  if (input.synchronize) {
    throw new Error('DB_SYNCHRONIZE must be false in production');
  }
  if (!input.migrationsRun) {
    throw new Error('DB_MIGRATIONS_RUN must be true in production');
  }
}
