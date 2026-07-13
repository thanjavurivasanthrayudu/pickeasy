-- ============================================================
-- SQL Trigger to update mechanic's score/rating on new review
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Function to recalculate mechanic rating and increase leaderboard points
CREATE OR REPLACE FUNCTION update_mechanic_score_on_review()
RETURNS TRIGGER AS $$
DECLARE
  new_avg_rating DECIMAL(3,2);
  points_to_add INTEGER;
BEGIN
  -- Calculate new average rating for the mechanic
  SELECT COALESCE(AVG(rating), 0)::DECIMAL(3,2)
  INTO new_avg_rating
  FROM reviews
  WHERE mechanic_id = NEW.mechanic_id;

  -- Calculate points to add (e.g. rating * 10)
  points_to_add := NEW.rating * 10;

  -- Update mechanics table directly
  UPDATE mechanics
  SET 
    rating = new_avg_rating,
    leaderboard_points = COALESCE(leaderboard_points, 0) + points_to_add
  WHERE id = NEW.mechanic_id;

  -- Also update the leaderboard table if you use it for rankings
  UPDATE leaderboard
  SET 
    avg_rating = new_avg_rating,
    points = COALESCE(points, 0) + points_to_add
  WHERE mechanic_id = NEW.mechanic_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_update_mechanic_score ON reviews;

-- Create the trigger on reviews
CREATE TRIGGER trg_update_mechanic_score
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_mechanic_score_on_review();
