export function assertSafeDatabaseConfiguration(input: {
  env: string;
  synchronize: boolean;
  migrationsRun: boolean;
}): void {
  if (input.env !== 'production') return;
  // Allow synchronize=true in production ONLY when migrationsRun=false
  // (explicit opt-in for initial deployment / manual schema management)
  if (input.synchronize && input.migrationsRun) {
    throw new Error('DB_SYNCHRONIZE must be false in production when DB_MIGRATIONS_RUN=true');
  }
  if (!input.migrationsRun && !input.synchronize) {
    throw new Error('Either DB_SYNCHRONIZE=true or DB_MIGRATIONS_RUN=true required in production');
  }
}
