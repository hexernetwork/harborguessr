-- database-schema.sql
-- Complete database schema for Finnish Harbor Guesser
-- Run this script in your Supabase SQL editor to set up the database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables with CASCADE to handle dependencies
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS trivia_answers CASCADE;
DROP TABLE IF EXISTS harbor_guesses CASCADE;
DROP TABLE IF EXISTS game_scores CASCADE;
DROP TABLE IF EXISTS harbor_hints CASCADE;
DROP TABLE IF EXISTS trivia_questions CASCADE;
DROP TABLE IF EXISTS harbors CASCADE;
DROP TABLE IF EXISTS harbor_images CASCADE;

-- Create harbors table with view_count for randomization
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
  metadata JSONB DEFAULT NULL
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
  distance_km FLOAT,
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
  time_taken_seconds FLOAT,
  score INTEGER NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (question_id, language) REFERENCES trivia_questions (id, language) ON DELETE CASCADE
);

-- Harbor images table for better image management
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

-- Enable RLS on tables that need it
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE harbor_guesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE trivia_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE harbor_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

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

-- ===================================================================
-- ADMIN AUTHENTICATION FUNCTIONS
-- ===================================================================

/**
 * Check if a user has admin role in any metadata field
 * Used by Cloudflare Worker for admin verification
 * 
 * @param user_id_param - UUID of the user to check
 * @returns boolean - true if user has admin role, false otherwise
 */
CREATE OR REPLACE FUNCTION check_user_admin(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check for admin role in any metadata field
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
$$;

/**
 * Grant admin role to a user by email
 * Helper function for admin management
 * 
 * @param user_email - Email of the user to make admin
 * @returns boolean - true if successful, false if user not found
 */
CREATE OR REPLACE FUNCTION grant_admin_role(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users 
  SET 
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}') || '{"role": "admin"}'::jsonb,
    user_metadata = COALESCE(user_metadata, '{}') || '{"role": "admin"}'::jsonb
  WHERE email = user_email;
  
  RETURN FOUND;
END;
$$;

/**
 * Remove admin role from a user by email
 * Helper function for admin management
 * 
 * @param user_email - Email of the user to remove admin from
 * @returns boolean - true if successful, false if user not found
 */
CREATE OR REPLACE FUNCTION revoke_admin_role(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users 
  SET 
    raw_user_meta_data = raw_user_meta_data - 'role',
    user_metadata = user_metadata - 'role'
  WHERE email = user_email;
  
  RETURN FOUND;
END;
$$;

/**
 * List all admin users
 * Helper function for admin management
 * 
 * @returns table with admin user details
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
AS $$
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
$$;

-- ===================================================================
-- GAME FUNCTIONS
-- ===================================================================

-- Create function to increment view count for harbors
CREATE OR REPLACE FUNCTION increment_harbor_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE harbors
  SET view_count = view_count + 1,
      last_viewed = NOW()
  WHERE id = NEW.harbor_id AND language = NEW.language;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to increment harbor view count when a guess is made
CREATE TRIGGER increment_harbor_view_count_trigger
AFTER INSERT ON harbor_guesses
FOR EACH ROW
EXECUTE FUNCTION increment_harbor_view_count();

-- Create function to increment view count for trivia questions
CREATE OR REPLACE FUNCTION increment_trivia_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE trivia_questions
  SET view_count = view_count + 1,
      last_viewed = NOW()
  WHERE id = NEW.question_id AND language = NEW.language;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
) AS $$
BEGIN
  RETURN QUERY
  SELECT h.*
  FROM harbors h
  WHERE h.language = lang
  ORDER BY h.view_count ASC, RANDOM()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

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
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.*
  FROM trivia_questions t
  WHERE t.language = lang
  ORDER BY t.view_count ASC, RANDOM()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create function to get multiple random trivia questions
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
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.*
  FROM trivia_questions t
  WHERE t.language = lang
  ORDER BY t.view_count ASC, RANDOM()
  LIMIT num_questions;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up orphaned images
CREATE OR REPLACE FUNCTION cleanup_orphaned_harbor_images()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Delete harbor_images records that don't have corresponding harbors
  DELETE FROM harbor_images 
  WHERE harbor_id NOT IN (SELECT DISTINCT id FROM harbors);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- STORAGE BUCKETS AND POLICIES
-- ===================================================================

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for harbor images
INSERT INTO storage.buckets (id, name, public)
VALUES ('harbor-images', 'harbor-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for harbor images
CREATE POLICY "Harbor images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'harbor-images');

CREATE POLICY "Authenticated users can upload harbor images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'harbor-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update harbor images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'harbor-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete harbor images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'harbor-images' AND auth.role() = 'authenticated');

-- ===================================================================
-- PERMISSIONS AND INDEXES
-- ===================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_harbors_language ON harbors(language);
CREATE INDEX IF NOT EXISTS idx_harbors_view_count ON harbors(view_count);
CREATE INDEX IF NOT EXISTS idx_harbors_language_view_count ON harbors(language, view_count);

CREATE INDEX IF NOT EXISTS idx_trivia_questions_language ON trivia_questions(language);
CREATE INDEX IF NOT EXISTS idx_trivia_questions_view_count ON trivia_questions(view_count);
CREATE INDEX IF NOT EXISTS idx_trivia_questions_language_view_count ON trivia_questions(language, view_count);

CREATE INDEX IF NOT EXISTS idx_game_scores_user_id ON game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_session_id ON game_scores(session_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_game_type ON game_scores(game_type);
CREATE INDEX IF NOT EXISTS idx_game_scores_completed_at ON game_scores(completed_at);

CREATE INDEX IF NOT EXISTS idx_harbor_guesses_user_id ON harbor_guesses(user_id);
CREATE INDEX IF NOT EXISTS idx_harbor_guesses_session_id ON harbor_guesses(session_id);
CREATE INDEX IF NOT EXISTS idx_harbor_guesses_harbor_id ON harbor_guesses(harbor_id);

CREATE INDEX IF NOT EXISTS idx_trivia_answers_user_id ON trivia_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_trivia_answers_session_id ON trivia_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_trivia_answers_question_id ON trivia_answers(question_id);

CREATE INDEX IF NOT EXISTS idx_harbor_images_harbor_id ON harbor_images(harbor_id);
CREATE INDEX IF NOT EXISTS idx_harbor_images_primary ON harbor_images(harbor_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_harbor_images_uploaded_by ON harbor_images(uploaded_by);

-- ===================================================================
-- USAGE EXAMPLES
-- ===================================================================

/*
-- Example: Grant admin role to a user
SELECT grant_admin_role('user@example.com');

-- Example: Check if user is admin
SELECT check_user_admin('8e2cd4de-ba91-470d-872c-713297cef25a'::uuid);

-- Example: List all admin users
SELECT * FROM list_admin_users();

-- Example: Remove admin role
SELECT revoke_admin_role('user@example.com');

-- Example: Get random harbor for game
SELECT * FROM get_random_harbor('fi');

-- Example: Get random trivia questions
SELECT * FROM get_random_trivia_questions('fi', 5);

-- Example: Clean up orphaned images
SELECT cleanup_orphaned_harbor_images();
*/