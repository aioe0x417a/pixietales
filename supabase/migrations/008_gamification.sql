-- Gamification tables

-- Story stamps / reading passport
CREATE TABLE IF NOT EXISTS story_stamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID REFERENCES child_profiles(id) ON DELETE CASCADE,
  story_id UUID NOT NULL,
  stamp_type TEXT NOT NULL DEFAULT 'standard',
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(child_profile_id, story_id)
);

CREATE INDEX IF NOT EXISTS idx_story_stamps_profile ON story_stamps(child_profile_id);
ALTER TABLE story_stamps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own stamps" ON story_stamps FOR ALL
  USING (EXISTS (
    SELECT 1 FROM child_profiles
    WHERE child_profiles.id = story_stamps.child_profile_id
    AND child_profiles.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM child_profiles
    WHERE child_profiles.id = story_stamps.child_profile_id
    AND child_profiles.user_id = auth.uid()
  ));

-- Nightly streaks
CREATE TABLE IF NOT EXISTS reading_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID UNIQUE REFERENCES child_profiles(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_read_date DATE,
  grace_used BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE reading_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own streaks" ON reading_streaks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM child_profiles
    WHERE child_profiles.id = reading_streaks.child_profile_id
    AND child_profiles.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM child_profiles
    WHERE child_profiles.id = reading_streaks.child_profile_id
    AND child_profiles.user_id = auth.uid()
  ));

-- Collectible companions
CREATE TABLE IF NOT EXISTS unlocked_companions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID REFERENCES child_profiles(id) ON DELETE CASCADE,
  companion_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(child_profile_id, companion_id)
);

ALTER TABLE unlocked_companions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own companions" ON unlocked_companions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM child_profiles
    WHERE child_profiles.id = unlocked_companions.child_profile_id
    AND child_profiles.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM child_profiles
    WHERE child_profiles.id = unlocked_companions.child_profile_id
    AND child_profiles.user_id = auth.uid()
  ));
