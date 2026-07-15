import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMerchantCatalog1784160000000 implements MigrationInterface {
  name = 'AddMerchantCatalog1784160000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query(
      'ALTER TABLE "merchants" ADD COLUMN IF NOT EXISTS "description" text',
    );
    await queryRunner.query(
      'ALTER TABLE "merchants" ADD COLUMN IF NOT EXISTS "accepting_orders" boolean NOT NULL DEFAULT true',
    );
    await queryRunner.query(
      'ALTER TABLE "merchants" ADD COLUMN IF NOT EXISTS "delivery_fee" integer NOT NULL DEFAULT 0',
    );
    await queryRunner.query(
      'ALTER TABLE "merchants" ADD COLUMN IF NOT EXISTS "minimum_order_amount" integer NOT NULL DEFAULT 0',
    );
    await queryRunner.query(
      'ALTER TABLE "merchants" ADD COLUMN IF NOT EXISTS "estimated_delivery_minutes" integer NOT NULL DEFAULT 30',
    );
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "merchant_id" uuid NOT NULL,
        "name" character varying(120) NOT NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_categories" PRIMARY KEY ("id"),
        CONSTRAINT "FK_product_categories_merchant" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_product_categories_merchant_name" UNIQUE ("merchant_id", "name")
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_product_categories_merchant" ON "product_categories" ("merchant_id")',
    );
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "merchant_id" uuid NOT NULL,
        "category_id" uuid NOT NULL,
        "name" character varying(160) NOT NULL,
        "description" text,
        "price" integer NOT NULL,
        "image_url" character varying,
        "is_available" boolean NOT NULL DEFAULT true,
        "sort_order" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_products" PRIMARY KEY ("id"),
        CONSTRAINT "FK_products_merchant" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_products_category" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_products_merchant" ON "products" ("merchant_id")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_products_category" ON "products" ("category_id")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "products"');
    await queryRunner.query('DROP TABLE IF EXISTS "product_categories"');
    await queryRunner.query(
      'ALTER TABLE "merchants" DROP COLUMN IF EXISTS "estimated_delivery_minutes"',
    );
    await queryRunner.query(
      'ALTER TABLE "merchants" DROP COLUMN IF EXISTS "minimum_order_amount"',
    );
    await queryRunner.query(
      'ALTER TABLE "merchants" DROP COLUMN IF EXISTS "delivery_fee"',
    );
    await queryRunner.query(
      'ALTER TABLE "merchants" DROP COLUMN IF EXISTS "accepting_orders"',
    );
    await queryRunner.query(
      'ALTER TABLE "merchants" DROP COLUMN IF EXISTS "description"',
    );
  }
}
