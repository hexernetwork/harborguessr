-- Drop all existing tables with CASCADE to handle dependencies
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS trivia_answers CASCADE;
DROP TABLE IF EXISTS harbor_guesses CASCADE;
DROP TABLE IF EXISTS game_scores CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS harbor_hints CASCADE;
DROP TABLE IF EXISTS trivia_questions CASCADE;
DROP TABLE IF EXISTS harbors CASCADE;

-- Create harbors table with view_count for randomization
CREATE TABLE IF NOT EXISTS harbors (
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
  PRIMARY KEY (id, language)
);

-- Create harbor_hints table
CREATE TABLE IF NOT EXISTS harbor_hints (
  harbor_id INTEGER NOT NULL,
  hint_order INTEGER NOT NULL,
  hint_text TEXT NOT NULL,
  language TEXT NOT NULL,
  PRIMARY KEY (harbor_id, hint_order, language),
  FOREIGN KEY (harbor_id, language) REFERENCES harbors (id, language) ON DELETE CASCADE
);

-- Create trivia_questions table with view_count for randomization
CREATE TABLE IF NOT EXISTS trivia_questions (
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

-- User profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  preferred_language TEXT DEFAULT 'fi',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game scores table
CREATE TABLE IF NOT EXISTS game_scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL, -- 'location' or 'trivia'
  score INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  language TEXT NOT NULL
);

-- Harbor guesses table
CREATE TABLE IF NOT EXISTS harbor_guesses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  harbor_id INTEGER NOT NULL,
  language TEXT NOT NULL,
  attempts INTEGER NOT NULL,
  correct BOOLEAN NOT NULL,
  distance_km FLOAT,
  score INTEGER NOT NULL,
  guessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (harbor_id, language) REFERENCES harbors (id, language) ON DELETE CASCADE
);

-- Trivia answers table
CREATE TABLE IF NOT EXISTS trivia_answers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL,
  language TEXT NOT NULL,
  answer_index INTEGER NOT NULL,
  correct BOOLEAN NOT NULL,
  time_taken_seconds FLOAT,
  score INTEGER NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (question_id, language) REFERENCES trivia_questions (id, language) ON DELETE CASCADE
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement TEXT NOT NULL,
  points INTEGER NOT NULL,
  language TEXT NOT NULL
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id INTEGER REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, achievement_id)
);

-- Create RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE harbor_guesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE trivia_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policies for game_scores
CREATE POLICY "Users can view their own scores"
  ON game_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scores"
  ON game_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for harbor_guesses
CREATE POLICY "Users can view their own harbor guesses"
  ON harbor_guesses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own harbor guesses"
  ON harbor_guesses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for trivia_answers
CREATE POLICY "Users can view their own trivia answers"
  ON trivia_answers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trivia answers"
  ON trivia_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for user_achievements
CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

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
  last_viewed TIMESTAMP WITH TIME ZONE
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

-- Create functions to manually increment view counts (for use in server actions)
CREATE OR REPLACE FUNCTION increment_harbor_views(harbor_id INTEGER, lang TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE harbors
  SET view_count = view_count + 1,
      last_viewed = NOW()
  WHERE id = harbor_id AND language = lang;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_trivia_views(question_id INTEGER, lang TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE trivia_questions
  SET view_count = view_count + 1,
      last_viewed = NOW()
  WHERE id = question_id AND language = lang;
END;
$$ LANGUAGE plpgsql;
