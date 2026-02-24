ALTER TABLE "public"."bookings"
ADD COLUMN IF NOT EXISTS "order_id" uuid REFERENCES "public"."orders"("id"),
ADD COLUMN IF NOT EXISTS "service_id" uuid REFERENCES "public"."services"("id"),
ADD COLUMN IF NOT EXISTS "package_tier" text;

CREATE INDEX IF NOT EXISTS "bookings_order_id_idx" ON "public"."bookings"("order_id");
CREATE INDEX IF NOT EXISTS "bookings_service_id_idx" ON "public"."bookings"("service_id");
