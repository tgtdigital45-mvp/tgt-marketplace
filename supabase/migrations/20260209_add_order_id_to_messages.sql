-- Add order_id to messages table if it doesn't exist
ALTER TABLE messages ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_messages_order_id ON messages(order_id);
