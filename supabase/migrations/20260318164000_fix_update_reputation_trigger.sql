-- Migration to fix the update_reputation trigger function
-- It was incorrectly referencing non-existent 'reviewee_id' column instead of 'reviewed_id'

CREATE OR REPLACE FUNCTION update_reputation()
RETURNS TRIGGER AS $$
DECLARE
  new_avg numeric;
  new_count integer;
  total_sales integer;
  new_level text;
BEGIN
  -- Calculate new stats for the reviewee (Seller)
  SELECT count(*), avg(rating)
  INTO new_count, new_avg
  FROM reviews
  WHERE reviewed_id = NEW.reviewed_id;

  -- Default nulls
  new_count := COALESCE(new_count, 0);
  new_avg := COALESCE(new_avg, 0);

  -- Get total sales count from orders (completed)
  SELECT count(*) INTO total_sales
  FROM orders
  WHERE seller_id = NEW.reviewed_id AND status = 'completed';

  -- Determine Level
  new_level := 'Iniciante';
  IF total_sales > 50 AND new_avg > 4.8 THEN
    new_level := 'Pro';
  ELSIF total_sales > 5 AND new_avg > 4.5 THEN
    new_level := 'Nível 1';
  END IF;

  -- Update Profile
  UPDATE profiles
  SET 
    rating_average = new_avg,
    reviews_count = new_count,
    level = new_level
  WHERE id = NEW.reviewed_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
