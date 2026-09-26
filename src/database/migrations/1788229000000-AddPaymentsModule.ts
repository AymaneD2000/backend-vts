import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add payments module tables: payment_transactions and payment_events.
 * Supports Mobile Money integration with idempotency and provider callbacks.
 */
export class AddPaymentsModule1788229000000 implements MigrationInterface {
  name = 'AddPaymentsModule1788229000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Payment transaction direction enum
    await queryRunner.query(`
      CREATE TYPE "public"."payment_direction_enum" AS ENUM (
        'COLLECTION', 'REFUND', 'PAYOUT'
      )
    `);

    // Payment transaction status enum
    await queryRunner.query(`
      CREATE TYPE "public"."payment_status_enum" AS ENUM (
        'PAY_ON_DELIVERY', 'PENDING', 'PROCESSING', 'PAID',
        'FAILED', 'REFUND_PENDING', 'REFUNDED'
      )
    `);

    // Payment transactions table
    await queryRunner.query(`
      CREATE TABLE "payment_transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "order_id" uuid,
        "ride_id" uuid,
        "withdrawal_id" uuid,
        "parent_transaction_id" uuid,
        "direction" "public"."payment_direction_enum" NOT NULL,
        "provider" character varying NOT NULL,
        "provider_reference" character varying,
        "idempotency_key" character varying NOT NULL,
        "amount" integer NOT NULL CHECK ("amount" > 0),
        "currency" character varying NOT NULL DEFAULT 'XOF',
        "destination_phone" character varying,
        "status" "public"."payment_status_enum" NOT NULL DEFAULT 'PENDING',
        "failure_code" character varying,
        "initiated_at" TIMESTAMP WITH TIME ZONE,
        "completed_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payment_transactions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_payment_transactions_idempotency" UNIQUE ("idempotency_key"),
        CONSTRAINT "FK_payment_transactions_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_payment_transactions_order" FOREIGN KEY ("order_id")
          REFERENCES "orders"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_payment_transactions_ride" FOREIGN KEY ("ride_id")
          REFERENCES "rides"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_payment_transactions_parent" FOREIGN KEY ("parent_transaction_id")
          REFERENCES "payment_transactions"("id") ON DELETE SET NULL
      )
    `);

    // Indexes for payment_transactions
    await queryRunner.query(`
      CREATE INDEX "IDX_payment_transactions_user" ON "payment_transactions" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_payment_transactions_order" ON "payment_transactions" ("order_id")
      WHERE "order_id" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_payment_transactions_ride" ON "payment_transactions" ("ride_id")
      WHERE "ride_id" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_payment_transactions_provider_ref" ON "payment_transactions" ("provider_reference")
      WHERE "provider_reference" IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_payment_transactions_status" ON "payment_transactions" ("status")
    `);

    // Payment events table (for provider callbacks/audit)
    await queryRunner.query(`
      CREATE TABLE "payment_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "transaction_id" uuid NOT NULL,
        "provider" character varying NOT NULL,
        "provider_event_id" character varying NOT NULL,
        "provider_status" character varying NOT NULL,
        "normalized_status" character varying NOT NULL,
        "signature_valid" boolean NOT NULL DEFAULT false,
        "payload_hash" character varying NOT NULL,
        "sanitized_payload" jsonb,
        "received_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payment_events" PRIMARY KEY ("id"),
        CONSTRAINT "FK_payment_events_transaction" FOREIGN KEY ("transaction_id")
          REFERENCES "payment_transactions"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_payment_events_provider_event" UNIQUE ("provider", "provider_event_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_payment_events_transaction" ON "payment_events" ("transaction_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_payment_events_received" ON "payment_events" ("received_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_payment_events_received"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_payment_events_transaction"');
    await queryRunner.query('DROP TABLE IF EXISTS "payment_events"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_payment_transactions_status"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_payment_transactions_provider_ref"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_payment_transactions_ride"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_payment_transactions_order"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_payment_transactions_user"');
    await queryRunner.query('DROP TABLE IF EXISTS "payment_transactions"');
    await queryRunner.query('DROP TYPE IF EXISTS "public"."payment_status_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "public"."payment_direction_enum"');
  }
}