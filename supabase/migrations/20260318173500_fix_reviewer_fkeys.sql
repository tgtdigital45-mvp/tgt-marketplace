-- Migration to fix the foreign keys for reviewer_id and reviewed_id
-- Previously, these pointed to auth.users, which prevented PostgREST
-- from automatically joining the profiles table.

ALTER TABLE reviews
DROP CONSTRAINT IF EXISTS reviews_reviewer_id_fkey,
DROP CONSTRAINT IF EXISTS reviews_reviewed_id_fkey;

ALTER TABLE reviews
ADD CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES profiles(id) ON DELETE CASCADE,
ADD CONSTRAINT reviews_reviewed_id_fkey FOREIGN KEY (reviewed_id) REFERENCES profiles(id) ON DELETE CASCADE;
