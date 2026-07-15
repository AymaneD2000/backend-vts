import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommerceOrders1784163600000 implements MigrationInterface {
  name = 'AddCommerceOrders1784163600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "customer_id" uuid NOT NULL,
        "merchant_id" uuid NOT NULL,
        "ride_id" uuid,
        "status" character varying(30) NOT NULL DEFAULT 'pending',
        "subtotal" integer NOT NULL,
        "delivery_fee" integer NOT NULL,
        "total" integer NOT NULL,
        "payment_method" character varying(30) NOT NULL,
        "customer_name" character varying(160) NOT NULL,
        "customer_phone" character varying(30) NOT NULL,
        "delivery_address" character varying(500) NOT NULL,
        "delivery_lat" double precision NOT NULL,
        "delivery_lng" double precision NOT NULL,
        "note" text,
        "scheduled_at" TIMESTAMP WITH TIME ZONE,
        "accepted_at" TIMESTAMP WITH TIME ZONE,
        "preparing_at" TIMESTAMP WITH TIME ZONE,
        "ready_at" TIMESTAMP WITH TIME ZONE,
        "picked_up_at" TIMESTAMP WITH TIME ZONE,
        "delivered_at" TIMESTAMP WITH TIME ZONE,
        "cancelled_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_orders" PRIMARY KEY ("id"),
        CONSTRAINT "FK_orders_customer" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_orders_merchant" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_orders_ride" FOREIGN KEY ("ride_id") REFERENCES "rides"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_orders_customer" ON "orders" ("customer_id")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_orders_merchant" ON "orders" ("merchant_id")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_orders_ride" ON "orders" ("ride_id")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_orders_status" ON "orders" ("status")',
    );
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "order_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_id" uuid NOT NULL,
        "product_id" uuid,
        "product_name" character varying(160) NOT NULL,
        "unit_price" integer NOT NULL,
        "quantity" integer NOT NULL,
        "line_total" integer NOT NULL,
        CONSTRAINT "PK_order_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_order_items_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_order_items_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_order_items_order" ON "order_items" ("order_id")',
    );
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "order_status_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_id" uuid NOT NULL,
        "from_status" character varying(30),
        "to_status" character varying(30) NOT NULL,
        "actor_user_id" uuid,
        "note" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_order_status_history" PRIMARY KEY ("id"),
        CONSTRAINT "FK_order_status_history_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_order_status_history_actor" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_order_status_history_order" ON "order_status_history" ("order_id")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "order_status_history"');
    await queryRunner.query('DROP TABLE IF EXISTS "order_items"');
    await queryRunner.query('DROP TABLE IF EXISTS "orders"');
  }
}
