import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMerchantExperienceAndInventory1788055200000 implements MigrationInterface {
  name = 'AddMerchantExperienceAndInventory1788055200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "merchants" ADD COLUMN IF NOT EXISTS "cover_url" character varying',
    );
    await queryRunner.query(
      'ALTER TABLE "merchants" ADD COLUMN IF NOT EXISTS "rating_avg" numeric(3,2) NOT NULL DEFAULT 0',
    );
    await queryRunner.query(
      'ALTER TABLE "merchants" ADD COLUMN IF NOT EXISTS "rating_count" integer NOT NULL DEFAULT 0',
    );
    await queryRunner.query(
      'ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "track_inventory" boolean NOT NULL DEFAULT false',
    );
    await queryRunner.query(
      'ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "stock_quantity" integer',
    );
    await queryRunner.query(
      'UPDATE "products" SET "track_inventory" = false, "stock_quantity" = NULL WHERE "track_inventory" IS NULL OR "track_inventory" = false',
    );
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "products" ADD CONSTRAINT "CHK_products_stock_quantity_nonnegative" CHECK ("stock_quantity" >= 0);
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "merchant_favorites" (
        "user_id" uuid NOT NULL,
        "merchant_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_merchant_favorites" PRIMARY KEY ("user_id", "merchant_id"),
        CONSTRAINT "FK_merchant_favorites_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_merchant_favorites_merchant" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_merchant_favorites_user" ON "merchant_favorites" ("user_id")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_merchant_favorites_merchant" ON "merchant_favorites" ("merchant_id")',
    );
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "merchant_reviews" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "merchant_id" uuid NOT NULL,
        "order_id" uuid NOT NULL,
        "customer_id" uuid NOT NULL,
        "score" smallint NOT NULL,
        "comment" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_merchant_reviews" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_merchant_reviews_order" UNIQUE ("order_id"),
        CONSTRAINT "CHK_merchant_reviews_score" CHECK ("score" BETWEEN 1 AND 5),
        CONSTRAINT "FK_merchant_reviews_merchant" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_merchant_reviews_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_merchant_reviews_customer" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_merchant_reviews_merchant_created" ON "merchant_reviews" ("merchant_id", "created_at" DESC)',
    );
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "inventory_movements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "merchant_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "order_id" uuid,
        "actor_user_id" uuid,
        "type" character varying(30) NOT NULL,
        "quantity_delta" integer NOT NULL,
        "balance_after" integer NOT NULL,
        "reason" text,
        "idempotency_key" character varying(200) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_inventory_movements" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_inventory_movements_idempotency" UNIQUE ("idempotency_key"),
        CONSTRAINT "CHK_inventory_movements_balance" CHECK ("balance_after" >= 0),
        CONSTRAINT "FK_inventory_movements_merchant" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_inventory_movements_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_inventory_movements_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_inventory_movements_actor" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_inventory_movements_product_created" ON "inventory_movements" ("merchant_id", "product_id", "created_at" DESC)',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "inventory_movements"');
    await queryRunner.query('DROP TABLE IF EXISTS "merchant_reviews"');
    await queryRunner.query('DROP TABLE IF EXISTS "merchant_favorites"');
    await queryRunner.query('ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "CHK_products_stock_quantity_nonnegative"');
    await queryRunner.query('ALTER TABLE "products" DROP COLUMN IF EXISTS "stock_quantity"');
    await queryRunner.query('ALTER TABLE "products" DROP COLUMN IF EXISTS "track_inventory"');
    await queryRunner.query('ALTER TABLE "merchants" DROP COLUMN IF EXISTS "rating_count"');
    await queryRunner.query('ALTER TABLE "merchants" DROP COLUMN IF EXISTS "rating_avg"');
    await queryRunner.query('ALTER TABLE "merchants" DROP COLUMN IF EXISTS "cover_url"');
  }
}
