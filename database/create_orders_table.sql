-- Create Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  buyer_id UUID REFERENCES profiles(id) NOT NULL,
  seller_id UUID REFERENCES profiles(id) NOT NULL,
  service_id UUID REFERENCES services(id) NOT NULL,
  package_tier TEXT NOT NULL CHECK (package_tier IN ('basic', 'standard', 'premium')),
  price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'active', 'in_review', 'completed', 'cancelled')),
  delivery_deadline TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policies

-- Buyer can view their own orders
CREATE POLICY "Users can view their own orders as buyer"
  ON orders
  FOR SELECT
  USING (auth.uid() = buyer_id);

-- Seller can view their own orders
CREATE POLICY "Users can view their own orders as seller"
  ON orders
  FOR SELECT
  USING (auth.uid() = seller_id);

-- Buyer can create orders (typically verified by backend or payment webhook, but allowing insert for MVP simulation)
CREATE POLICY "Users can create orders as buyer"
  ON orders
  FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- Update policies (Seller updates status to delivered, Buyer updates to completed/revision)
-- For MVP, allow both to update if they are part of the order. 
-- In production, strict state machine logic in DB or API is better.
CREATE POLICY "Users can update their own orders"
  ON orders
  FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
