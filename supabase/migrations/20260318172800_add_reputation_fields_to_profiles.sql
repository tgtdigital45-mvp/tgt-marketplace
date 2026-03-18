-- Migration to add reputation fields to the profiles table
-- These fields are used by the 'update_reputation' trigger
-- to maintain a seller's overall rating and level

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS rating_average NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'Iniciante';
