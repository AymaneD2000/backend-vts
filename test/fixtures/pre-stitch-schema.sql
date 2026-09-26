CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE "public"."users_roles_enum" AS ENUM ('client', 'driver', 'admin', 'guarantor', 'partner', 'merchant');
CREATE TYPE "public"."merchants_type_enum" AS ENUM ('store', 'restaurant');
CREATE TYPE "public"."merchants_status_enum" AS ENUM ('pending', 'active', 'suspended');
CREATE TYPE "public"."rides_service_type_enum" AS ENUM ('ride_car', 'moto', 'parcel', 'merchant_delivery');
CREATE TYPE "public"."rides_status_enum" AS ENUM ('requested', 'accepted', 'in_progress', 'completed', 'cancelled', 'no_driver');
CREATE TYPE "public"."rides_payment_method_enum" AS ENUM ('cash', 'mobile_money');
CREATE TYPE "public"."rides_cancelled_by_enum" AS ENUM ('client', 'driver');
CREATE TYPE "public"."rides_cancel_reason_enum" AS ENUM ('changed_mind', 'driver_too_far', 'wait_too_long', 'wrong_address', 'client_no_show', 'client_unreachable', 'price', 'other');
CREATE TYPE "public"."rides_payment_status_enum" AS ENUM ('pending', 'paid', 'failed');
CREATE TYPE "public"."rides_parcel_size_enum" AS ENUM ('small', 'medium', 'large');

CREATE TABLE "users" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "phone" character varying(20),
  "email" character varying,
  "full_name" character varying,
  "roles" "public"."users_roles_enum"[] NOT NULL DEFAULT '{client}',
  "phone_verified" boolean NOT NULL DEFAULT false,
  "email_verified" boolean NOT NULL DEFAULT false,
  "password_hash" character varying,
  "refresh_token_hash" character varying,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_users" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "IDX_users_phone_unique" ON "users" ("phone");
CREATE UNIQUE INDEX "IDX_users_email_unique" ON "users" ("email") WHERE "email" IS NOT NULL;

CREATE TABLE "merchants" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "name" character varying NOT NULL,
  "type" "public"."merchants_type_enum" NOT NULL,
  "owner_user_id" uuid,
  "phone" character varying(20),
  "address" character varying,
  "logo_url" character varying,
  "description" text,
  "accepting_orders" boolean NOT NULL DEFAULT true,
  "delivery_fee" integer NOT NULL DEFAULT 0,
  "minimum_order_amount" integer NOT NULL DEFAULT 0,
  "estimated_delivery_minutes" integer NOT NULL DEFAULT 30,
  "lat" double precision,
  "lng" double precision,
  "status" "public"."merchants_status_enum" NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_merchants" PRIMARY KEY ("id")
);
CREATE INDEX "IDX_merchants_owner_user_id" ON "merchants" ("owner_user_id");
CREATE INDEX "IDX_merchants_status" ON "merchants" ("status");

CREATE TABLE "product_categories" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "merchant_id" uuid NOT NULL,
  "name" character varying(120) NOT NULL,
  "sort_order" integer NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  "image_url" character varying,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_product_categories" PRIMARY KEY ("id"),
  CONSTRAINT "UQ_product_categories_merchant_name" UNIQUE ("merchant_id", "name"),
  CONSTRAINT "FK_product_categories_merchant" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE
);
CREATE INDEX "IDX_product_categories_merchant" ON "product_categories" ("merchant_id");

CREATE TABLE "products" (
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
);
CREATE INDEX "IDX_products_merchant" ON "products" ("merchant_id");
CREATE INDEX "IDX_products_category" ON "products" ("category_id");

CREATE TABLE "driver_profiles" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "user_id" uuid NOT NULL,
  "kyc_status" character varying NOT NULL DEFAULT 'pending',
  "kyc_rejection_reason" text,
  "trust_level" smallint NOT NULL DEFAULT 0,
  "guarantor_id" uuid,
  "partner_company_id" uuid,
  "vehicle_type" character varying,
  "vehicle_plate" character varying,
  "vehicle_make" character varying,
  "vehicle_model" character varying,
  "vehicle_color" character varying,
  "vehicle_year" smallint,
  "is_available" boolean NOT NULL DEFAULT false,
  "last_lat" double precision,
  "last_lng" double precision,
  "rating_avg" numeric(3,2) NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_driver_profiles" PRIMARY KEY ("id"),
  CONSTRAINT "UQ_driver_profiles_user_id" UNIQUE ("user_id"),
  CONSTRAINT "FK_driver_profiles_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE "rides" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "service_type" "public"."rides_service_type_enum" NOT NULL,
  "status" "public"."rides_status_enum" NOT NULL DEFAULT 'requested',
  "client_id" uuid NOT NULL,
  "driver_id" uuid,
  "pickup_lat" double precision NOT NULL,
  "pickup_lng" double precision NOT NULL,
  "pickup_address" character varying,
  "dropoff_lat" double precision NOT NULL,
  "dropoff_lng" double precision NOT NULL,
  "dropoff_address" character varying,
  "distance_m" integer NOT NULL,
  "duration_s" integer NOT NULL,
  "fare_amount" integer NOT NULL,
  "currency" character varying NOT NULL DEFAULT 'XOF',
  "payment_method" "public"."rides_payment_method_enum" NOT NULL DEFAULT 'cash',
  "payment_status" "public"."rides_payment_status_enum" NOT NULL DEFAULT 'pending',
  "accepted_at" TIMESTAMP WITH TIME ZONE,
  "started_at" TIMESTAMP WITH TIME ZONE,
  "completed_at" TIMESTAMP WITH TIME ZONE,
  "scheduled_at" TIMESTAMP WITH TIME ZONE,
  "dispatched_at" TIMESTAMP WITH TIME ZONE,
  "cancelled_at" TIMESTAMP WITH TIME ZONE,
  "cancelled_by" "public"."rides_cancelled_by_enum",
  "cancel_reason" "public"."rides_cancel_reason_enum",
  "cancel_note" text,
  "declared_value" numeric(12,0),
  "parcel_description" text,
  "recipient_name" character varying,
  "recipient_phone" character varying(20),
  "parcel_size" "public"."rides_parcel_size_enum",
  "required_trust_level" smallint,
  "merchant_id" uuid,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_rides" PRIMARY KEY ("id"),
  CONSTRAINT "FK_rides_client" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "FK_rides_driver" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE SET NULL
);
CREATE INDEX "IDX_rides_status" ON "rides" ("status");
CREATE INDEX "IDX_rides_client_id" ON "rides" ("client_id");
CREATE INDEX "IDX_rides_driver_id" ON "rides" ("driver_id");
CREATE INDEX "IDX_rides_scheduled_at" ON "rides" ("scheduled_at");
CREATE INDEX "IDX_rides_merchant_id" ON "rides" ("merchant_id");

CREATE TABLE "orders" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "customer_id" uuid NOT NULL,
  "merchant_id" uuid NOT NULL,
  "ride_id" uuid,
  "status" character varying(30) NOT NULL DEFAULT 'pending',
  "subtotal" integer NOT NULL,
  "delivery_fee" integer NOT NULL,
  "discount_amount" integer NOT NULL DEFAULT 0,
  "promotion_id" uuid,
  "promotion_name" character varying,
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
);
CREATE INDEX "IDX_orders_customer" ON "orders" ("customer_id");
CREATE INDEX "IDX_orders_merchant" ON "orders" ("merchant_id");
CREATE INDEX "IDX_orders_ride" ON "orders" ("ride_id");
CREATE INDEX "IDX_orders_status" ON "orders" ("status");

CREATE TABLE "order_items" (
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
);
CREATE INDEX "IDX_order_items_order" ON "order_items" ("order_id");

CREATE TABLE "order_status_history" (
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
);
CREATE INDEX "IDX_order_status_history_order" ON "order_status_history" ("order_id");
