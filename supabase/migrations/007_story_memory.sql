-- Story Memory: recurring characters per child profile
CREATE TABLE IF NOT EXISTS character_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID REFERENCES child_profiles(id) ON DELETE CASCADE,
  character_name TEXT NOT NULL,
  description TEXT,
  appeared_in_story_id UUID REFERENCES stories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_character_log_profile ON character_log(child_profile_id);

ALTER TABLE character_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own character log" ON character_log FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM child_profiles
      WHERE child_profiles.id = character_log.child_profile_id
      AND child_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM child_profiles
      WHERE child_profiles.id = character_log.child_profile_id
      AND child_profiles.user_id = auth.uid()
    )
  );
