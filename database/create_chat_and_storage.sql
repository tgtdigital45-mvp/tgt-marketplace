-- Create Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) NOT NULL,
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Realtime
-- Note: You might need to run this in the SQL Editor dashboard if 'supabase_realtime' publication isn't accessible via simple script
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END
$$;

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies for Messages
CREATE POLICY "Participants can read messages"
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = messages.order_id
      AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
    )
  );

CREATE POLICY "Participants can insert messages"
  ON messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_id
      AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
    )
  );

-- Storage Buckets
-- Attempt to create buckets. If this fails due to permissions, create them manually in the Dashboard.
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-deliveries', 'order-deliveries', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- We assume files are stored as: bucket_id/order_id/filename

-- Policy for order-deliveries
CREATE POLICY "Participants can upload deliveries"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'order-deliveries' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM orders
    WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
  )
);

CREATE POLICY "Participants can download deliveries"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'order-deliveries' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM orders
    WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
  )
);

-- Policy for chat-attachments
CREATE POLICY "Participants can upload chat attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM orders
    WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
  )
);

CREATE POLICY "Participants can download chat attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-attachments' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM orders
    WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
  )
);
