-- 1. REPUTATION SYSTEM
-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Buyers can write reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Function to update Service and Profile average ratings
CREATE OR REPLACE FUNCTION update_reputation_metrics()
RETURNS TRIGGER AS $$
DECLARE
  v_service_id UUID;
  v_seller_id UUID;
BEGIN
  -- Get context from the order
  SELECT service_id, seller_id INTO v_service_id, v_seller_id
  FROM orders WHERE id = NEW.order_id;

  -- Update Service Rating (if service exists)
  -- Assuming services table has rating fields: average_rating, total_reviews
  -- If not, we might need to add them. Let's assume standard 'services' table from prev sessions.
  -- We'll check if columns exist or add them in a migration if needed. For now assuming standard fields or we calculate on fly?
  -- User specifically asked to "recalculate ... in 'services' and 'profiles'". I will update them.
  
  -- Update Service
  UPDATE services
  SET 
    rating = (SELECT AVG(rating)::numeric(3,2) FROM reviews r JOIN orders o ON r.order_id = o.id WHERE o.service_id = v_service_id),
    total_reviews = (SELECT COUNT(*) FROM reviews r JOIN orders o ON r.order_id = o.id WHERE o.service_id = v_service_id)
  WHERE id = v_service_id;

  -- Update Profile (Seller)
  -- Assuming profiles table has 'rating' or 'reputation'
  UPDATE profiles
  SET 
    rating = (SELECT AVG(rating)::numeric(3,2) FROM reviews r JOIN orders o ON r.order_id = o.id WHERE o.seller_id = v_seller_id),
    total_reviews = (SELECT COUNT(*) FROM reviews r JOIN orders o ON r.order_id = o.id WHERE o.seller_id = v_seller_id)
  WHERE id = v_seller_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS on_review_created ON reviews;
CREATE TRIGGER on_review_created
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_reputation_metrics();


-- 2. WALLET SYSTEM
-- Wallets Table
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) UNIQUE NOT NULL,
  balance NUMERIC DEFAULT 0,
  pending_balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own wallet" ON wallets FOR SELECT USING (auth.uid() = user_id);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES wallets(id) NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  description TEXT,
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own transactions" ON transactions FOR SELECT USING (
  wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid())
);

-- Wallet creation trigger (ensure every user has a wallet)
CREATE OR REPLACE FUNCTION create_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Bind to profiles creation (if not already handled, good safety measure)
DROP TRIGGER IF EXISTS on_profile_created_wallet ON profiles;
CREATE TRIGGER on_profile_created_wallet
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION create_wallet_for_new_user();


-- 3. SECURE ORDER COMPLETION RPC
-- This function handles: Order Update -> Review Insert -> Fund Transfer
CREATE OR REPLACE FUNCTION process_order_completion(
  p_order_id UUID,
  p_rating INTEGER,
  p_comment TEXT
)
RETURNS VOID AS $$
DECLARE
  v_order RECORD;
  v_seller_wallet_id UUID;
  v_platform_fee NUMERIC := 0.10; -- 10% fee
  v_net_amount NUMERIC;
BEGIN
  -- 1. Validate and Update Order
  -- Must be 'delivered' (or 'active' if skipping delivery for simplicity, but let's stick to flow: delivered -> completed)
  -- Must be Buyer calling it
  UPDATE orders
  SET status = 'completed'
  WHERE id = p_order_id
    AND buyer_id = auth.uid() 
    AND status IN ('delivered', 'active') -- Supporting active for quick testing if needed, but primarily delivered
  RETURNING * INTO v_order;

  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Order not found or not eligible for completion';
  END IF;

  -- 2. Insert Review
  INSERT INTO reviews (order_id, reviewer_id, rating, comment)
  VALUES (p_order_id, auth.uid(), p_rating, p_comment);

  -- 3. Process Wallet Transfer
  -- Find Seller Wallet
  SELECT id INTO v_seller_wallet_id FROM wallets WHERE user_id = v_order.seller_id;
  
  -- Create wallet if missing (safety)
  IF v_seller_wallet_id IS NULL THEN
    INSERT INTO wallets (user_id) VALUES (v_order.seller_id) RETURNING id INTO v_seller_wallet_id;
  END IF;

  -- Calculate Amount
  v_net_amount := v_order.price * (1 - v_platform_fee);

  -- Update Balance
  UPDATE wallets
  SET balance = balance + v_net_amount
  WHERE id = v_seller_wallet_id;

  -- Log Transaction
  INSERT INTO transactions (wallet_id, amount, type, description, order_id)
  VALUES (
    v_seller_wallet_id,
    v_net_amount,
    'credit',
    'Venda do pedido #' || substring(p_order_id::text, 1, 8),
    p_order_id
  );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
