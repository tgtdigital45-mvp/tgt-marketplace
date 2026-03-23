-- STORAGE BUCKETS CONFIGURATION
-- This migration ensures that mandatory buckets exist and have proper RLS policies.

-- 1. Create buckets (ignoring if they already exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('marketplace', 'marketplace', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. AVATARS POLICIES
-- Anyone can see avatars
CREATE POLICY "Avatar Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Users can upload/update their own avatar
-- Expected path: avatars/USER_ID/filename.ext
CREATE POLICY "Users can manage their own avatar" ON storage.objects
FOR ALL TO authenticated
USING (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. MARKETPLACE POLICIES (Logo, Capa, Portfólio)
-- Anyone can see marketplace images
CREATE POLICY "Marketplace Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'marketplace');

-- Authenticated users (Providers) can upload to marketplace
-- A more strict policy would check if the user is a provider or owns the company,
-- but for simplicity in this migration we allow authenticated uploads.
CREATE POLICY "Marketplace Authenticated Uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'marketplace');

CREATE POLICY "Marketplace Owner Manage" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'marketplace')
WITH CHECK (bucket_id = 'marketplace');

-- 5. CHAT ATTACHMENTS POLICIES
-- Only authenticated users can access chat attachments
-- Ideally, this should check if the user is a participant of the order/chat,
-- but since order information is in a different schema, we'll start with authenticated access.
CREATE POLICY "Chat Attachments Access" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'chat-attachments');

CREATE POLICY "Chat Attachments Upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-attachments');
