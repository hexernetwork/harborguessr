-- Existing tables
CREATE TABLE IF NOT EXISTS harbors (
  id INTEGER NOT NULL,
  name TEXT NOT NULL,
  coordinates JSONB NOT NULL,
  region TEXT NOT NULL,
  type TEXT[] NOT NULL,
  notable_feature TEXT NOT NULL,
  description TEXT NOT NULL,
  language TEXT NOT NULL,
  PRIMARY KEY (id, language)
);

CREATE TABLE IF NOT EXISTS harbor_hints (
  harbor_id INTEGER NOT NULL,
  hint_order INTEGER NOT NULL,
  hint_text TEXT NOT NULL,
  language TEXT NOT NULL,
  PRIMARY KEY (harbor_id, hint_order, language),
  FOREIGN KEY (harbor_id, language) REFERENCES harbors (id, language)
);

CREATE TABLE IF NOT EXISTS trivia_questions (
  id INTEGER NOT NULL,
  question TEXT NOT NULL,
  answers TEXT[] NOT NULL,
  correct_answer INTEGER NOT NULL,
  explanation TEXT NOT NULL,
  language TEXT NOT NULL,
  PRIMARY KEY (id, language)
);

-- New tables for user tracking
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  preferred_language TEXT DEFAULT 'fi',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  game_type TEXT NOT NULL, -- 'location' or 'trivia'
  score INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  language TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS harbor_guesses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  harbor_id INTEGER NOT NULL,
  attempts INTEGER NOT NULL,
  correct BOOLEAN NOT NULL,
  distance_km FLOAT,
  score INTEGER NOT NULL,
  guessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trivia_answers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  question_id INTEGER NOT NULL,
  language TEXT NOT NULL,
  answer_index INTEGER NOT NULL,
  correct BOOLEAN NOT NULL,
  time_taken_seconds FLOAT,
  score INTEGER NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (question_id, language) REFERENCES trivia_questions (id, language)
);

CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement TEXT NOT NULL,
  points INTEGER NOT NULL,
  language TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  achievement_id INTEGER REFERENCES achievements(id),
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
