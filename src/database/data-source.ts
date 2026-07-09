import { DataSource } from 'typeorm';

/**
 * Standalone TypeORM DataSource used by the CLI for migrations
 * (generate / run / revert). The runtime app uses DatabaseModule instead.
 *
 * Entities and migrations are loaded by glob so new files are picked up
 * automatically. Run with, e.g.:
 *   npm run migration:generate -- src/database/migrations/Init
 *   npm run migration:run
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'vts',
  password: process.env.DB_PASSWORD ?? 'vts',
  database: process.env.DB_NAME ?? 'vts',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
