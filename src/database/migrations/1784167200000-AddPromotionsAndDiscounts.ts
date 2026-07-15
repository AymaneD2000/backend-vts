import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPromotionsAndDiscounts1784167200000
  implements MigrationInterface
{
  name = 'AddPromotionsAndDiscounts1784167200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "promotions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "merchant_id" uuid NOT NULL,
        "name" character varying(160) NOT NULL,
        "type" character varying(30) NOT NULL,
        "value" integer NOT NULL DEFAULT 0,
        "minimum_order_amount" integer NOT NULL DEFAULT 0,
        "starts_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "ends_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_promotions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_promotions_merchant" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_promotions_merchant" ON "promotions" ("merchant_id")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_promotions_starts" ON "promotions" ("starts_at")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_promotions_ends" ON "promotions" ("ends_at")',
    );
    await queryRunner.query(
      'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "discount_amount" integer NOT NULL DEFAULT 0',
    );
    await queryRunner.query(
      'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "promotion_id" uuid',
    );
    await queryRunner.query(
      'ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "promotion_name" character varying',
    );
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_promotion" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "FK_orders_promotion"',
    );
    await queryRunner.query(
      'ALTER TABLE "orders" DROP COLUMN IF EXISTS "promotion_name"',
    );
    await queryRunner.query(
      'ALTER TABLE "orders" DROP COLUMN IF EXISTS "promotion_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "orders" DROP COLUMN IF EXISTS "discount_amount"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "promotions"');
  }
}
