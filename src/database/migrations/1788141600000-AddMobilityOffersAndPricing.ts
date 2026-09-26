import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMobilityOffersAndPricing1788141600000 implements MigrationInterface {
  name = 'AddMobilityOffersAndPricing1788141600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "rides" ADD COLUMN IF NOT EXISTS "ride_tier" character varying(20)');
    await queryRunner.query('ALTER TABLE "rides" ADD COLUMN IF NOT EXISTS "rate_card_id" uuid');
    await queryRunner.query('ALTER TABLE "rides" ADD COLUMN IF NOT EXISTS "surge_multiplier" numeric(4,2) NOT NULL DEFAULT 1');
    for (const column of ['quote_base_amount', 'quote_distance_amount', 'quote_time_amount', 'quote_subtotal_amount']) {
      await queryRunner.query(`ALTER TABLE "rides" ADD COLUMN IF NOT EXISTS "${column}" integer`);
    }
    await queryRunner.query('ALTER TABLE "rides" ADD COLUMN IF NOT EXISTS "demand_zone_id" uuid');
    await queryRunner.query('ALTER TABLE "rides" ADD COLUMN IF NOT EXISTS "pin_required" boolean NOT NULL DEFAULT false');
    await queryRunner.query('ALTER TABLE "rides" ADD COLUMN IF NOT EXISTS "pickup_pin_ciphertext" text');
    await queryRunner.query('ALTER TABLE "rides" ADD COLUMN IF NOT EXISTS "pickup_pin_iv" character varying');
    await queryRunner.query('ALTER TABLE "rides" ADD COLUMN IF NOT EXISTS "pickup_pin_auth_tag" character varying');
    await queryRunner.query('ALTER TABLE "rides" ADD COLUMN IF NOT EXISTS "pickup_pin_digest" character varying');
    await queryRunner.query('ALTER TABLE "rides" ADD COLUMN IF NOT EXISTS "pin_failed_attempts" integer NOT NULL DEFAULT 0');
    await queryRunner.query('ALTER TABLE "rides" ADD COLUMN IF NOT EXISTS "pin_locked_until" TIMESTAMPTZ');
    await queryRunner.query(`UPDATE "rides" SET "ride_tier" = CASE WHEN "service_type" = 'ride_car' THEN 'eco' ELSE NULL END WHERE "ride_tier" IS NULL`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "rate_cards" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "service_type" character varying(40) NOT NULL, "ride_tier" character varying(20), "base_amount" integer NOT NULL, "per_km_amount" integer NOT NULL, "per_minute_amount" integer NOT NULL, "minimum_amount" integer NOT NULL, "average_speed_kmh" numeric NOT NULL, "effective_from" TIMESTAMPTZ NOT NULL, "effective_until" TIMESTAMPTZ, "enabled" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_rate_cards" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_rate_cards_lookup" ON "rate_cards" ("service_type", "ride_tier", "effective_from")`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "demand_zones" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "center_lat" double precision NOT NULL, "center_lng" double precision NOT NULL, "radius_m" integer NOT NULL, "service_type" character varying, "ride_tier" character varying, "multiplier" numeric(4,2) NOT NULL, "starts_at" TIMESTAMPTZ NOT NULL, "ends_at" TIMESTAMPTZ, "enabled" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_demand_zones" PRIMARY KEY ("id"), CONSTRAINT "CHK_demand_zones_radius" CHECK ("radius_m" > 0), CONSTRAINT "CHK_demand_zones_multiplier" CHECK ("multiplier" >= 1))`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "ride_offers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ride_id" uuid NOT NULL, "driver_id" uuid NOT NULL, "status" character varying(20) NOT NULL, "offered_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "expires_at" TIMESTAMPTZ NOT NULL, "responded_at" TIMESTAMPTZ, CONSTRAINT "PK_ride_offers" PRIMARY KEY ("id"), CONSTRAINT "UQ_ride_offers_ride_driver" UNIQUE ("ride_id", "driver_id"), CONSTRAINT "FK_ride_offers_ride" FOREIGN KEY ("ride_id") REFERENCES "rides"("id") ON DELETE CASCADE, CONSTRAINT "FK_ride_offers_driver" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE CASCADE)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_ride_offers_driver_status_expiry" ON "ride_offers" ("driver_id", "status", "expires_at")`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "driver_online_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "driver_id" uuid NOT NULL, "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "ended_at" TIMESTAMPTZ, "duration_seconds" integer, "last_activity_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "close_reason" character varying, CONSTRAINT "PK_driver_online_sessions" PRIMARY KEY ("id"), CONSTRAINT "FK_driver_online_sessions_driver" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE CASCADE)`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_driver_online_sessions_open" ON "driver_online_sessions" ("driver_id") WHERE "ended_at" IS NULL`);
    const seeds = [
      ['ride_car', 'eco', 500, 250, 25, 1000, 25, true],
      ['ride_car', 'premium', 500, 250, 25, 1000, 25, false],
      ['moto', null, 250, 150, 15, 500, 30, true],
      ['parcel', null, 500, 200, 10, 750, 25, true],
      ['merchant_delivery', null, 300, 175, 12, 600, 30, true],
    ];
    for (const [serviceType, tier, base, perKm, perMinute, minimum, speed, enabled] of seeds) {
      await queryRunner.query(`INSERT INTO "rate_cards" ("service_type", "ride_tier", "base_amount", "per_km_amount", "per_minute_amount", "minimum_amount", "average_speed_kmh", "effective_from", "enabled") SELECT $1,$2,$3,$4,$5,$6,$7,now(),$8 WHERE NOT EXISTS (SELECT 1 FROM "rate_cards" WHERE "service_type"=$1 AND "ride_tier" IS NOT DISTINCT FROM $2)`, [serviceType, tier, base, perKm, perMinute, minimum, speed, enabled]);
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "driver_online_sessions"');
    await queryRunner.query('DROP TABLE IF EXISTS "ride_offers"');
    await queryRunner.query('DROP TABLE IF EXISTS "demand_zones"');
    await queryRunner.query('DROP TABLE IF EXISTS "rate_cards"');
    for (const column of ['pin_locked_until', 'pin_failed_attempts', 'pickup_pin_digest', 'pickup_pin_auth_tag', 'pickup_pin_iv', 'pickup_pin_ciphertext', 'pin_required', 'demand_zone_id', 'quote_subtotal_amount', 'quote_time_amount', 'quote_distance_amount', 'quote_base_amount', 'surge_multiplier', 'rate_card_id', 'ride_tier']) {
      await queryRunner.query(`ALTER TABLE "rides" DROP COLUMN IF EXISTS "${column}"`);
    }
  }
}
