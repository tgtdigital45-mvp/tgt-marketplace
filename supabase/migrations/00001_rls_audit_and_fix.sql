-- ==========================================
-- Migration: RLS Audit and Strict Isolation Fix
-- Description: Ensures clients and professionals can only access their own transactional data.
-- ==========================================

-- 1. Securing ORDERS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can read orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;

-- SELECT: Buyer or Seller only
CREATE POLICY "Strict View Orders" 
ON public.orders FOR SELECT 
TO authenticated 
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- INSERT: Buyer must be the authenticated user, status must be pending
CREATE POLICY "Strict Insert Orders" 
ON public.orders FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = buyer_id AND status = 'pending');

-- UPDATE: Buyer or Seller only, but restrict payment_status changes
CREATE POLICY "Strict Update Orders" 
ON public.orders FOR UPDATE 
TO authenticated 
USING (auth.uid() = buyer_id OR auth.uid() = seller_id)
WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);
-- Note: Edge functions bypass RLS to update payment_status and escrow_status via service_role

-- 2. Securing QUOTES (Orçamentos)
-- Assuming 'quotes' table exists with buyer_id and seller_id (or service_id relation)
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can create quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can update own quotes" ON public.quotes;

-- SELECT: Buyer or Seller only
CREATE POLICY "Strict View Quotes" 
ON public.quotes FOR SELECT 
TO authenticated 
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- INSERT/UPDATE: Similar isolation
CREATE POLICY "Strict Insert Quotes" 
ON public.quotes FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Strict Update Quotes" 
ON public.quotes FOR UPDATE 
TO authenticated 
USING (auth.uid() = buyer_id OR auth.uid() = seller_id)
WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- 3. Securing DISPUTES
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own disputes" ON public.disputes;
DROP POLICY IF EXISTS "Users can create disputes" ON public.disputes;

-- SELECT: Accessible if the user is the reporter, or the user is part of the disputed order
CREATE POLICY "Strict View Disputes" 
ON public.disputes FOR SELECT 
TO authenticated 
USING (
    reporter_id = auth.uid() 
    OR 
    order_id IN (SELECT id FROM public.orders WHERE buyer_id = auth.uid() OR seller_id = auth.uid())
);

-- INSERT: Anyone involved in the order can open a dispute
CREATE POLICY "Strict Insert Disputes" 
ON public.disputes FOR INSERT 
TO authenticated 
WITH CHECK (
    reporter_id = auth.uid() AND
    order_id IN (SELECT id FROM public.orders WHERE buyer_id = auth.uid() OR seller_id = auth.uid())
);

-- 4. Securing CHAT_THREADS & MESSAGES
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their chat threads" ON public.chat_threads;
DROP POLICY IF EXISTS "Users can update their chat threads" ON public.chat_threads;
DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;

-- CHAT THREADS: Only participants can view strings
CREATE POLICY "Strict View Chat Threads" 
ON public.chat_threads FOR SELECT 
TO authenticated 
USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

-- MESSAGES: Only participants in the thread can read/write messages
CREATE POLICY "Strict View Messages" 
ON public.messages FOR SELECT 
TO authenticated 
USING (
    thread_id IN (
        SELECT id FROM public.chat_threads 
        WHERE participant_1_id = auth.uid() OR participant_2_id = auth.uid()
    )
    OR
    order_id IN (
        SELECT id FROM public.orders
        WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
);

CREATE POLICY "Strict Insert Messages" 
ON public.messages FOR INSERT 
TO authenticated 
WITH CHECK (
    sender_id = auth.uid() AND
    (
      thread_id IN (
          SELECT id FROM public.chat_threads 
          WHERE participant_1_id = auth.uid() OR participant_2_id = auth.uid()
      )
      OR
      order_id IN (
          SELECT id FROM public.orders
          WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
      )
    )
);
