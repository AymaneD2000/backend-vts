import { assertSafeDatabaseConfiguration } from './database-config.guard';

describe('assertSafeDatabaseConfiguration', () => {
  it('rejects production schema synchronization', () => {
    expect(() =>
      assertSafeDatabaseConfiguration({
        env: 'production',
        synchronize: true,
        migrationsRun: true,
      }),
    ).toThrow('DB_SYNCHRONIZE must be false in production');
  });

  it('rejects production without migrations', () => {
    expect(() =>
      assertSafeDatabaseConfiguration({
        env: 'production',
        synchronize: false,
        migrationsRun: false,
      }),
    ).toThrow('DB_MIGRATIONS_RUN must be true in production');
  });

  it('accepts safe production configuration and all non-production modes', () => {
    expect(() =>
      assertSafeDatabaseConfiguration({
        env: 'production',
        synchronize: false,
        migrationsRun: true,
      }),
    ).not.toThrow();
    expect(() =>
      assertSafeDatabaseConfiguration({
        env: 'development',
        synchronize: true,
        migrationsRun: false,
      }),
    ).not.toThrow();
  });
});
