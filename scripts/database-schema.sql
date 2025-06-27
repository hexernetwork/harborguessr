-- database-schema.sql
-- Complete database schema for Finnish Harbor Guesser with Leaderboards
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
  -- Constraint to ensure either user_id or session_id+nickname is provided
  CONSTRAINT check_user_identification CHECK (
    (user_id IS NOT NULL AND session_id IS NULL AND nickname IS NULL) OR
    (user_id IS NULL AND session_id IS NOT NULL AND nickname IS NOT NULL)
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
AS $$
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
$$;

/**
 * Grant admin role to a user by email
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

-- ===================================================================
-- LEADERBOARD FUNCTIONS
-- ===================================================================

-- Function to automatically create leaderboard entry when a game score is inserted
CREATE OR REPLACE FUNCTION create_leaderboard_entry()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

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
) AS $$
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
$$ LANGUAGE plpgsql;

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
) AS $$
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
$$ LANGUAGE plpgsql;

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
) AS $$
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
    WHERE (user_id_param IS NOT NULL AND al.user_id = user_id_param)
       OR (session_id_param IS NOT NULL AND al.nickname IS NOT NULL)
  )
  SELECT 
    us.game_type,
    us.best_score,
    us.best_accuracy,
    us.games_played,
    wr.rank as rank_weekly,
    ar.rank as rank_alltime
  FROM user_stats us
  LEFT JOIN weekly_ranks wr ON us.game_type = wr.game_type
  LEFT JOIN alltime_ranks ar ON us.game_type = ar.game_type;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old leaderboard entries (optional maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_leaderboard_entries(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Keep all-time best scores, but clean up older lower scores
  DELETE FROM leaderboard_entries 
  WHERE completed_at < NOW() - INTERVAL '1 day' * days_to_keep
    AND id NOT IN (
      SELECT DISTINCT ON (COALESCE(user_id::text, session_id), game_type, language) id
      FROM leaderboard_entries
      ORDER BY COALESCE(user_id::text, session_id), game_type, language, score DESC
    );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up orphaned images
CREATE OR REPLACE FUNCTION cleanup_orphaned_harbor_images()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
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

-- Leaderboard indexes for performance
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_language ON leaderboard_entries(language);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_game_type ON leaderboard_entries(game_type);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_score ON leaderboard_entries(score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_completed_at ON leaderboard_entries(completed_at);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_user_id ON leaderboard_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_session_id ON leaderboard_entries(session_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_weekly ON leaderboard_entries(language, game_type, completed_at) WHERE completed_at >= NOW() - INTERVAL '7 days';
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_ranking ON leaderboard_entries(language, game_type, score DESC, accuracy_percentage DESC, game_duration_seconds ASC);

-- ===================================================================
-- USAGE EXAMPLES
-- ===================================================================

/*
-- Example: Grant admin role to a user
SELECT grant_admin_role('user@example.com');

-- Example: Get weekly leaderboard for location games
SELECT * FROM get_weekly_leaderboard('fi', 'location', 20);

-- Example: Get all-time leaderboard for all games
SELECT * FROM get_alltime_leaderboard('fi', NULL, 50);

-- Example: Get user's best scores
SELECT * FROM get_user_best_scores('8e2cd4de-ba91-470d-872c-713297cef25a'::uuid, NULL, 'fi');

-- Example: Get anonymous user's best scores
SELECT * FROM get_user_best_scores(NULL, 'session_123', 'fi');

-- Example: Clean up old leaderboard entries (keep 90 days)
SELECT cleanup_old_leaderboard_entries(90);

-- Example: Insert a game score (will automatically create leaderboard entry)
INSERT INTO game_scores (user_id, game_type, score, language, nickname, game_duration_seconds, questions_answered, correct_answers)
VALUES (auth.uid(), 'trivia', 850, 'fi', NULL, 120, 10, 8);

-- Example: Insert anonymous game score
INSERT INTO game_scores (session_id, game_type, score, language, nickname, game_duration_seconds, questions_answered, correct_answers)
VALUES ('session_123', 'location', 1200, 'fi', 'Harbor Master', 180, 5, 4);
*/