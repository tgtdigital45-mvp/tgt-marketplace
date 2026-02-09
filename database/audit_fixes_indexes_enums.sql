-- 1. Drop Dependencies
DROP VIEW IF EXISTS seller_stats;
DROP POLICY IF EXISTS "Buyers can cancel pending orders" ON orders;

-- 2. Performance: Create missing indexes
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_reviews_company_id ON reviews(company_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_messages_job_id ON messages(job_id);
CREATE INDEX IF NOT EXISTS idx_messages_participants ON messages(sender_id, receiver_id);

-- 3. Data Integrity: Create Enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM (
            'pending_payment',
            'pending', 
            'in_progress', 
            'review_requested', 
            'delivered',        
            'completed',        
            'cancelled', 
            'disputed'
        );
    END IF;
END$$;

-- 4. Migration: Alter Column
ALTER TABLE orders ALTER COLUMN status DROP DEFAULT;
ALTER TABLE orders ALTER COLUMN status TYPE order_status USING status::order_status;
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending_payment';

-- 5. Restoration: Re-create Policy with Explicit Casting
CREATE POLICY "Buyers can cancel pending orders" ON orders 
FOR UPDATE 
USING ((auth.uid() = buyer_id) AND (status = 'pending_payment'::order_status)) 
WITH CHECK (status = 'cancelled'::order_status);

-- 6. Restoration: Re-create View with Explicit Casting
CREATE OR REPLACE VIEW seller_stats AS
SELECT 
    seller_id,
    count(*) FILTER (WHERE status = 'completed'::order_status) AS total_completed_orders,
    count(*) AS total_orders,
    COALESCE(sum(price) FILTER (WHERE status = 'completed'::order_status), 0::numeric) AS total_earnings
FROM orders
GROUP BY seller_id;
