-- Migration to add video_url to portfolio_items table

ALTER TABLE portfolio_items
ADD COLUMN video_url TEXT;
