-- PixieTales Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/svriwcvcuminvgpzbxsq/sql

-- Child profiles
CREATE TABLE IF NOT EXISTS child_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 1 AND age <= 6),
  companion TEXT NOT NULL DEFAULT 'bunny',
  favorite_themes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Stories
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  child_profile_id UUID REFERENCES child_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  theme TEXT NOT NULL DEFAULT 'adventure',
  child_name TEXT NOT NULL,
  prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Story chapters
CREATE TABLE IF NOT EXISTS story_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  chapter_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_prompt TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_child_profiles_user_id ON child_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_child_profile_id ON stories(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_story_chapters_story_id ON story_chapters(story_id);

-- Row Level Security
ALTER TABLE child_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_chapters ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own data
CREATE POLICY "Users manage own child profiles"
  ON child_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own stories"
  ON stories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own story chapters"
  ON story_chapters FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_chapters.story_id
      AND stories.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = story_chapters.story_id
      AND stories.user_id = auth.uid()
    )
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER child_profiles_updated_at
  BEFORE UPDATE ON child_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
