-- database-schema.sql
-- Complete database schema for Finnish Harbor Guesser with Leaderboards and Images
-- Run this script in your Supabase SQL editor to set up the database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables with CASCADE to handle dependencies
DROP TABLE IF EXISTS leaderboard_entries CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS trivia_answers CASCADE;
DROP TABLE IF EXISTS harbor_guesses CASCADE;
DROP TABLE IF EXISTS game_scores CASCADE;
DROP TABLE IF EXISTS harbor_hints CASCADE;
DROP TABLE IF EXISTS trivia_questions CASCADE;
DROP TABLE IF EXISTS harbors CASCADE;
DROP TABLE IF EXISTS harbor_images CASCADE;

-- Create harbors table with view_count for randomization and image support
CREATE TABLE harbors (
  id INTEGER NOT NULL,
  name TEXT NOT NULL,
  coordinates JSONB NOT NULL,
  region TEXT NOT NULL,
  type TEXT[] NOT NULL,
  notable_feature TEXT NOT NULL,
  description TEXT NOT NULL,
  language TEXT NOT NULL,
  view_count INTEGER DEFAULT 0,
  last_viewed TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  image_url TEXT DEFAULT NULL,
  image_filename TEXT DEFAULT NULL,
  image_uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  PRIMARY KEY (id, language)
);

-- Add comments to explain the image columns
COMMENT ON COLUMN harbors.image_url IS 'URL to harbor image stored in R2. Same image shared across all language versions of the harbor.';
COMMENT ON COLUMN harbors.image_filename IS 'Original filename of the uploaded image for reference.';
COMMENT ON COLUMN harbors.image_uploaded_at IS 'Timestamp when the image was uploaded.';

-- Create harbor_hints table
CREATE TABLE harbor_hints (
  harbor_id INTEGER NOT NULL,
  hint_order INTEGER NOT NULL,
  hint_text TEXT NOT NULL,
  language TEXT NOT NULL,
  PRIMARY KEY (harbor_id, hint_order, language),
  FOREIGN KEY (harbor_id, language) REFERENCES harbors (id, language) ON DELETE CASCADE
);

-- Create trivia_questions table with view_count for randomization
CREATE TABLE trivia_questions (
  id INTEGER NOT NULL,
  question TEXT NOT NULL,
  answers TEXT[] NOT NULL,
  correct_answer INTEGER NOT NULL,
  explanation TEXT NOT NULL,
  language TEXT NOT NULL,
  view_count INTEGER DEFAULT 0,
  last_viewed TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  PRIMARY KEY (id, language)
);

-- Game scores table (supports both authenticated and anonymous users)
CREATE TABLE game_scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT DEFAULT NULL,
  game_type TEXT NOT NULL, -- 'location' or 'trivia'
  score INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  language TEXT NOT NULL,
  metadata JSONB DEFAULT NULL,
  -- New fields for better leaderboard support
  nickname TEXT DEFAULT NULL, -- For anonymous users
  game_duration_seconds INTEGER DEFAULT NULL,
  questions_answered INTEGER DEFAULT NULL,
  correct_answers INTEGER DEFAULT NULL
);

-- Harbor guesses table (supports both authenticated and anonymous users)
CREATE TABLE harbor_guesses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT DEFAULT NULL,
  harbor_id INTEGER NOT NULL,
  language TEXT NOT NULL,
  attempts INTEGER NOT NULL,
  correct BOOLEAN NOT NULL,
  distance_km DOUBLE PRECISION,
  score INTEGER NOT NULL,
  guessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (harbor_id, language) REFERENCES harbors (id, language) ON DELETE CASCADE
);

-- Trivia answers table (supports both authenticated and anonymous users)
CREATE TABLE trivia_answers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT DEFAULT NULL,
  question_id INTEGER NOT NULL,
  language TEXT NOT NULL,
  answer_index INTEGER NOT NULL,
  correct BOOLEAN NOT NULL,
  time_taken_seconds DOUBLE PRECISION,
  score INTEGER NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (question_id, language) REFERENCES trivia_questions (id, language) ON DELETE CASCADE
);

-- Harbor images table for better image management (alternative to storing in harbors table)
CREATE TABLE harbor_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  harbor_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  alt_text TEXT DEFAULT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_primary BOOLEAN DEFAULT FALSE,
  file_size INTEGER DEFAULT NULL,
  content_type TEXT DEFAULT NULL
);

-- Achievements table (optional for future features)
CREATE TABLE achievements (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement TEXT NOT NULL,
  points INTEGER NOT NULL,
  language TEXT NOT NULL
);

-- User achievements table (optional for future features)
CREATE TABLE user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id INTEGER REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, achievement_id)
);

-- ===================================================================
-- LEADERBOARD SYSTEM
-- ===================================================================

-- Leaderboard entries table - aggregates best games for leaderboard display
CREATE TABLE leaderboard_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  game_score_id UUID NOT NULL REFERENCES game_scores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT DEFAULT NULL,
  nickname TEXT DEFAULT NULL, -- For anonymous users
  game_type TEXT NOT NULL,
  score INTEGER NOT NULL,
  language TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  -- Performance metrics for ranking
  game_duration_seconds INTEGER DEFAULT NULL,
  questions_answered INTEGER DEFAULT NULL,
  correct_answers INTEGER DEFAULT NULL,
  accuracy_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN questions_answered > 0 THEN (correct_answers::decimal / questions_answered::decimal) * 100
      ELSE NULL 
    END
  ) STORED,
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure we don't have duplicate entries for the same game
  UNIQUE (game_score_id),
  -- Constraint to ensure we have some form of identification
  CONSTRAINT check_user_identification CHECK (
    user_id IS NOT NULL OR (session_id IS NOT NULL AND nickname IS NOT NULL)
  )
);

-- Enable RLS on tables that need it
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE harbor_guesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE trivia_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE harbor_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- RLS POLICIES
-- ===================================================================

-- RLS Policies for game_scores
CREATE POLICY "Anyone can view game scores for leaderboards"
  ON game_scores FOR SELECT
  USING (true);

CREATE POLICY "Users can insert game scores"
  ON game_scores FOR INSERT
  WITH CHECK (
    (auth.uid() = user_id) OR 
    (user_id IS NULL AND session_id IS NOT NULL)
  );

-- RLS Policies for harbor_guesses
CREATE POLICY "Users can view harbor guesses"
  ON harbor_guesses FOR SELECT
  USING (
    (auth.uid() = user_id) OR 
    (user_id IS NULL)
  );

CREATE POLICY "Users can insert harbor guesses"
  ON harbor_guesses FOR INSERT
  WITH CHECK (
    (auth.uid() = user_id) OR 
    (user_id IS NULL AND session_id IS NOT NULL)
  );

-- RLS Policies for trivia_answers
CREATE POLICY "Users can view trivia answers"
  ON trivia_answers FOR SELECT
  USING (
    (auth.uid() = user_id) OR 
    (user_id IS NULL)
  );

CREATE POLICY "Users can insert trivia answers"
  ON trivia_answers FOR INSERT
  WITH CHECK (
    (auth.uid() = user_id) OR 
    (user_id IS NULL AND session_id IS NOT NULL)
  );

-- RLS Policies for harbor_images
CREATE POLICY "Anyone can view harbor images"
  ON harbor_images FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert harbor images"
  ON harbor_images FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own harbor images"
  ON harbor_images FOR UPDATE
  USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own harbor images"
  ON harbor_images FOR DELETE
  USING (auth.uid() = uploaded_by);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for leaderboard_entries
CREATE POLICY "Anyone can view leaderboard entries"
  ON leaderboard_entries FOR SELECT
  USING (true);

CREATE POLICY "System can insert leaderboard entries"
  ON leaderboard_entries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update leaderboard entries"
  ON leaderboard_entries FOR UPDATE
  USING (true);

-- ===================================================================
-- ADMIN AUTHENTICATION FUNCTIONS
-- ===================================================================

/**
 * Check if a user has admin role in any metadata field
 */
CREATE OR REPLACE FUNCTION check_user_admin(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_id_param 
    AND (
      raw_user_meta_data->>'role' = 'admin' OR
      user_metadata->>'role' = 'admin' OR
      app_metadata->>'role' = 'admin' OR
      raw_app_meta_data->>'role' = 'admin'
    )
  );
END;
$;

/**
 * Grant admin role to a user by email
 */
CREATE OR REPLACE FUNCTION grant_admin_role(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $
BEGIN
  UPDATE auth.users 
  SET 
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}') || '{"role": "admin"}'::jsonb,
    user_metadata = COALESCE(user_metadata, '{}') || '{"role": "admin"}'::jsonb
  WHERE email = user_email;
  
  RETURN FOUND;
END;
$;

/**
 * Remove admin role from a user by email
 */
CREATE OR REPLACE FUNCTION revoke_admin_role(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $
BEGIN
  UPDATE auth.users 
  SET 
    raw_user_meta_data = raw_user_meta_data - 'role',
    user_metadata = user_metadata - 'role'
  WHERE email = user_email;
  
  RETURN FOUND;
END;
$;

/**
 * List all admin users
 */
CREATE OR REPLACE FUNCTION list_admin_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  role_source text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.created_at,
    u.last_sign_in_at,
    CASE 
      WHEN u.raw_user_meta_data->>'role' = 'admin' THEN 'raw_user_meta_data'
      WHEN u.user_metadata->>'role' = 'admin' THEN 'user_metadata'
      WHEN u.app_metadata->>'role' = 'admin' THEN 'app_metadata'
      WHEN u.raw_app_meta_data->>'role' = 'admin' THEN 'raw_app_meta_data'
      ELSE 'unknown'
    END as role_source
  FROM auth.users u
  WHERE 
    u.raw_user_meta_data->>'role' = 'admin' OR
    u.user_metadata->>'role' = 'admin' OR
    u.app_metadata->>'role' = 'admin' OR
    u.raw_app_meta_data->>'role' = 'admin'
  ORDER BY u.created_at;
END;
$;

-- ===================================================================
-- GAME FUNCTIONS
-- ===================================================================

-- Create function to increment view count for harbors
CREATE OR REPLACE FUNCTION increment_harbor_view_count()
RETURNS TRIGGER AS $
BEGIN
  UPDATE harbors
  SET view_count = view_count + 1,
      last_viewed = NOW()
  WHERE id = NEW.harbor_id AND language = NEW.language;
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Create trigger to increment harbor view count when a guess is made
CREATE TRIGGER increment_harbor_view_count_trigger
AFTER INSERT ON harbor_guesses
FOR EACH ROW
EXECUTE FUNCTION increment_harbor_view_count();

-- Create function to increment view count for trivia questions
CREATE OR REPLACE FUNCTION increment_trivia_view_count()
RETURNS TRIGGER AS $
BEGIN
  UPDATE trivia_questions
  SET view_count = view_count + 1,
      last_viewed = NOW()
  WHERE id = NEW.question_id AND language = NEW.language;
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Create trigger to increment trivia view count when an answer is submitted
CREATE TRIGGER increment_trivia_view_count_trigger
AFTER INSERT ON trivia_answers
FOR EACH ROW
EXECUTE FUNCTION increment_trivia_view_count();

-- Create functions for random selection based on view count
CREATE OR REPLACE FUNCTION get_random_harbor(lang TEXT)
RETURNS TABLE (
  id INTEGER,
  name TEXT,
  coordinates JSONB,
  region TEXT,
  type TEXT[],
  notable_feature TEXT,
  description TEXT,
  language TEXT,
  view_count INTEGER,
  last_viewed TIMESTAMP WITH TIME ZONE,
  image_url TEXT,
  image_filename TEXT,
  image_uploaded_at TIMESTAMP WITH TIME ZONE
) AS $
BEGIN
  RETURN QUERY
  SELECT h.*
  FROM harbors h
  WHERE h.language = lang
  ORDER BY h.view_count ASC, RANDOM()
  LIMIT 1;
END;
$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_random_trivia_question(lang TEXT)
RETURNS TABLE (
  id INTEGER,
  question TEXT,
  answers TEXT[],
  correct_answer INTEGER,
  explanation TEXT,
  language TEXT,
  view_count INTEGER,
  last_viewed TIMESTAMP WITH TIME ZONE
) AS $
BEGIN
  RETURN QUERY
  SELECT t.*
  FROM trivia_questions t
  WHERE t.language = lang
  ORDER BY t.view_count ASC, RANDOM()
  LIMIT 1;
END;
$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_random_trivia_questions(lang TEXT, num_questions INTEGER)
RETURNS TABLE (
  id INTEGER,
  question TEXT,
  answers TEXT[],
  correct_answer INTEGER,
  explanation TEXT,
  language TEXT,
  view_count INTEGER,
  last_viewed TIMESTAMP WITH TIME ZONE
) AS $
BEGIN
  RETURN QUERY
  SELECT t.*
  FROM trivia_questions t
  WHERE t.language = lang
  ORDER BY t.view_count ASC, RANDOM()
  LIMIT num_questions;
END;
$ LANGUAGE plpgsql;

-- ===================================================================
-- IMAGE MANAGEMENT FUNCTIONS
-- ===================================================================

-- Create a view to easily see harbors with and without images
CREATE OR REPLACE VIEW harbors_image_status AS
SELECT 
  id,
  language,
  name,
  region,
  CASE 
    WHEN image_url IS NOT NULL AND image_url != '' THEN 'Has Image'
    ELSE 'No Image'
  END as image_status,
  image_url,
  image_filename,
  image_uploaded_at,
  view_count
FROM harbors
ORDER BY id, language;

-- Create a function to get harbor statistics including image counts
CREATE OR REPLACE FUNCTION get_harbor_image_stats()
RETURNS TABLE (
  total_harbors INTEGER,
  harbors_with_images INTEGER,
  harbors_without_images INTEGER,
  image_coverage_percentage NUMERIC,
  total_images_uploaded INTEGER,
  most_recent_upload TIMESTAMP WITH TIME ZONE
) 
LANGUAGE SQL
AS $
  SELECT 
    COUNT(DISTINCT id)::INTEGER as total_harbors,
    COUNT(DISTINCT CASE WHEN image_url IS NOT NULL AND image_url != '' THEN id END)::INTEGER as harbors_with_images,
    COUNT(DISTINCT CASE WHEN image_url IS NULL OR image_url = '' THEN id END)::INTEGER as harbors_without_images,
    ROUND(
      (COUNT(DISTINCT CASE WHEN image_url IS NOT NULL AND image_url != '' THEN id END)::NUMERIC / 
       COUNT(DISTINCT id)::NUMERIC) * 100, 
      2
    ) as image_coverage_percentage,
    COUNT(CASE WHEN image_url IS NOT NULL AND image_url != '' THEN 1 END)::INTEGER as total_images_uploaded,
    MAX(image_uploaded_at) as most_recent_upload
  FROM harbors;
$;

-- Function to update all language versions of a harbor with the same image
CREATE OR REPLACE FUNCTION update_harbor_image(
  harbor_id_param INTEGER,
  image_url_param TEXT,
  image_filename_param TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $
DECLARE
  affected_rows INTEGER := 0;
BEGIN
  UPDATE harbors 
  SET 
    image_url = image_url_param,
    image_filename = image_filename_param,
    image_uploaded_at = NOW()
  WHERE id = harbor_id_param;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$;

-- Function to remove image from all language versions of a harbor
CREATE OR REPLACE FUNCTION remove_harbor_image(harbor_id_param INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $
DECLARE
  affected_rows INTEGER := 0;
BEGIN
  UPDATE harbors 
  SET 
    image_url = NULL,
    image_filename = NULL,
    image_uploaded_at = NULL
  WHERE id = harbor_id_param;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$;

-- ===================================================================
-- LEADERBOARD FUNCTIONS
-- ===================================================================

-- Function to automatically create leaderboard entry when a game score is inserted
CREATE OR REPLACE FUNCTION create_leaderboard_entry()
RETURNS TRIGGER AS $
BEGIN
  -- Only create leaderboard entry for games with decent scores
  IF NEW.score > 0 THEN
    INSERT INTO leaderboard_entries (
      game_score_id,
      user_id,
      session_id,
      nickname,
      game_type,
      score,
      language,
      completed_at,
      game_duration_seconds,
      questions_answered,
      correct_answers
    ) VALUES (
      NEW.id,
      NEW.user_id,
      NEW.session_id,
      NEW.nickname,
      NEW.game_type,
      NEW.score,
      NEW.language,
      NEW.completed_at,
      NEW.game_duration_seconds,
      NEW.questions_answered,
      NEW.correct_answers
    );
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger to automatically create leaderboard entries
CREATE TRIGGER create_leaderboard_entry_trigger
AFTER INSERT ON game_scores
FOR EACH ROW
EXECUTE FUNCTION create_leaderboard_entry();

-- Function to get weekly leaderboard
CREATE OR REPLACE FUNCTION get_weekly_leaderboard(
  lang TEXT DEFAULT 'fi',
  game_type_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  rank INTEGER,
  user_id UUID,
  nickname TEXT,
  is_registered BOOLEAN,
  display_name TEXT,
  game_type TEXT,
  score INTEGER,
  accuracy_percentage DECIMAL(5,2),
  game_duration_seconds INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE
) AS $
BEGIN
  RETURN QUERY
  WITH ranked_entries AS (
    SELECT 
      ROW_NUMBER() OVER (
        ORDER BY le.score DESC, 
        le.accuracy_percentage DESC NULLS LAST, 
        le.game_duration_seconds ASC NULLS LAST,
        le.completed_at ASC
      ) as rank,
      le.user_id,
      le.nickname,
      (le.user_id IS NOT NULL) as is_registered,
      COALESCE(
        CASE WHEN le.user_id IS NOT NULL THEN u.email ELSE NULL END,
        le.nickname,
        'Anonymous'
      ) as display_name,
      le.game_type,
      le.score,
      le.accuracy_percentage,
      le.game_duration_seconds,
      le.completed_at
    FROM leaderboard_entries le
    LEFT JOIN auth.users u ON le.user_id = u.id
    WHERE le.language = lang
      AND le.completed_at >= NOW() - INTERVAL '7 days'
      AND (game_type_filter IS NULL OR le.game_type = game_type_filter)
  )
  SELECT * FROM ranked_entries
  ORDER BY rank
  LIMIT limit_count;
END;
$ LANGUAGE plpgsql;

-- Function to get all-time leaderboard
CREATE OR REPLACE FUNCTION get_alltime_leaderboard(
  lang TEXT DEFAULT 'fi',
  game_type_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  rank INTEGER,
  user_id UUID,
  nickname TEXT,
  is_registered BOOLEAN,
  display_name TEXT,
  game_type TEXT,
  score INTEGER,
  accuracy_percentage DECIMAL(5,2),
  game_duration_seconds INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE
) AS $
BEGIN
  RETURN QUERY
  WITH ranked_entries AS (
    SELECT 
      ROW_NUMBER() OVER (
        ORDER BY le.score DESC, 
        le.accuracy_percentage DESC NULLS LAST, 
        le.game_duration_seconds ASC NULLS LAST,
        le.completed_at ASC
      ) as rank,
      le.user_id,
      le.nickname,
      (le.user_id IS NOT NULL) as is_registered,
      COALESCE(
        CASE WHEN le.user_id IS NOT NULL THEN u.email ELSE NULL END,
        le.nickname,
        'Anonymous'
      ) as display_name,
      le.game_type,
      le.score,
      le.accuracy_percentage,
      le.game_duration_seconds,
      le.completed_at
    FROM leaderboard_entries le
    LEFT JOIN auth.users u ON le.user_id = u.id
    WHERE le.language = lang
      AND (game_type_filter IS NULL OR le.game_type = game_type_filter)
  )
  SELECT * FROM ranked_entries
  ORDER BY rank
  LIMIT limit_count;
END;
$ LANGUAGE plpgsql;

-- Function to get user's best scores
CREATE OR REPLACE FUNCTION get_user_best_scores(
  user_id_param UUID DEFAULT NULL,
  session_id_param TEXT DEFAULT NULL,
  lang TEXT DEFAULT 'fi'
)
RETURNS TABLE (
  game_type TEXT,
  best_score INTEGER,
  best_accuracy DECIMAL(5,2),
  games_played BIGINT,
  rank_weekly INTEGER,
  rank_alltime INTEGER
) AS $
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      le.game_type,
      MAX(le.score) as best_score,
      MAX(le.accuracy_percentage) as best_accuracy,
      COUNT(*) as games_played
    FROM leaderboard_entries le
    WHERE le.language = lang
      AND (
        (user_id_param IS NOT NULL AND le.user_id = user_id_param) OR
        (session_id_param IS NOT NULL AND le.session_id = session_id_param)
      )
    GROUP BY le.game_type
  ),
  weekly_ranks AS (
    SELECT 
      wl.game_type,
      wl.rank
    FROM get_weekly_leaderboard(lang) wl
    WHERE (user_id_param IS NOT NULL AND wl.user_id = user_id_param)
       OR (session_id_param IS NOT NULL AND wl.nickname IS NOT NULL)
  ),
  alltime_ranks AS (
    SELECT 
      al.game_type,
      al.rank
    FROM get_alltime_leaderboard(lang) al
    WHERE (user_id_param IS NOT NULL-- Add image_url column to harbors table
-- Run this SQL in your Supabase SQL Editor

-- Add the image_url column to harbors table if it doesn't exist
ALTER TABLE harbors 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add a comment to explain the column
COMMENT ON COLUMN harbors.image_url IS 'URL to harbor image stored in R2. Same image shared across all language versions of the harbor.';

-- Create index for faster queries when filtering by image availability
CREATE INDEX IF NOT EXISTS idx_harbors_image_url ON harbors(image_url) WHERE image_url IS NOT NULL;

-- Update existing harbors with sample image URLs if needed (optional)
-- Uncomment and modify these if you have specific images to add
/*
UPDATE harbors 
SET image_url = 'https://your-r2-domain.r2.dev/sample-harbor-1.jpg' 
WHERE id = 1 AND image_url IS NULL;

UPDATE harbors 
SET image_url = 'https://your-r2-domain.r2.dev/sample-harbor-2.jpg' 
WHERE id = 2 AND image_url IS NULL;
*/

-- Create a view to easily see harbors with and without images
CREATE OR REPLACE VIEW harbors_image_status AS
SELECT 
  id,
  language,
  name,
  region,
  CASE 
    WHEN image_url IS NOT NULL AND image_url != '' THEN 'Has Image'
    ELSE 'No Image'
  END as image_status,
  image_url,
  view_count
FROM harbors
ORDER BY id, language;

-- Create a function to get harbor statistics including image counts
CREATE OR REPLACE FUNCTION get_harbor_image_stats()
RETURNS TABLE (
  total_harbors INTEGER,
  harbors_with_images INTEGER,
  harbors_without_images INTEGER,
  image_coverage_percentage NUMERIC
) 
LANGUAGE SQL
AS $$
  SELECT 
    COUNT(DISTINCT id)::INTEGER as total_harbors,
    COUNT(DISTINCT CASE WHEN image_url IS NOT NULL AND image_url != '' THEN id END)::INTEGER as harbors_with_images,
    COUNT(DISTINCT CASE WHEN image_url IS NULL OR image_url = '' THEN id END)::INTEGER as harbors_without_images,
    ROUND(
      (COUNT(DISTINCT CASE WHEN image_url IS NOT NULL AND image_url != '' THEN id END)::NUMERIC / 
       COUNT(DISTINCT id)::NUMERIC) * 100, 
      2
    ) as image_coverage_percentage
  FROM harbors;
$$;

-- Usage examples:
-- SELECT * FROM harbors_image_status;
-- SELECT * FROM get_harbor_image_stats();