import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Enable PostGIS extension and add spatial index on merchants for scalable
 * nearby-feed queries.
 *
 * - Adds postgis extension
 * - Adds a geography(Point, 4326) column "location" to merchants
 * - Populates location from existing lat/lng
 * - Adds a GIST spatial index for fast radius / KNN queries
 * - Keeps lat/lng for backward compatibility
 */
export class EnablePostGISAndSpatialIndex1788228000000 implements MigrationInterface {
  name = 'EnablePostGISAndSpatialIndex1788228000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable PostGIS extension
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS postgis');

    // Add geography(Point, 4326) column for spatial queries
    await queryRunner.query(`
      ALTER TABLE "merchants"
      ADD COLUMN IF NOT EXISTS "location" geography(Point, 4326)
    `);

    // Populate location from existing lat/lng where both are present
    await queryRunner.query(`
      UPDATE "merchants"
      SET "location" = ST_SetSRID(ST_MakePoint("lng", "lat"), 4326)::geography
      WHERE "lat" IS NOT NULL AND "lng" IS NOT NULL
    `);

    // Create GIST index for spatial queries (radius, KNN)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_merchants_location"
      ON "merchants" USING GIST ("location")
    `);

    // Also add a regular index on lat/lng for fallback queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_merchants_lat_lng"
      ON "merchants" ("lat", "lng")
      WHERE "lat" IS NOT NULL AND "lng" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_merchants_lat_lng"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_merchants_location"');
    await queryRunner.query('ALTER TABLE "merchants" DROP COLUMN IF EXISTS "location"');
    // Note: We don't drop postgis extension as other tables may use it
  }
}