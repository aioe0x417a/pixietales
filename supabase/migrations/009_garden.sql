-- Growing Garden: plants grow as children read stories
CREATE TABLE IF NOT EXISTS garden_plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id UUID REFERENCES child_profiles(id) ON DELETE CASCADE,
  plant_type TEXT NOT NULL,
  stamp_index INTEGER NOT NULL,
  grid_col INTEGER NOT NULL,
  grid_row INTEGER NOT NULL,
  planted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(child_profile_id, stamp_index)
);

CREATE INDEX IF NOT EXISTS idx_garden_plants_profile ON garden_plants(child_profile_id);
ALTER TABLE garden_plants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own garden" ON garden_plants FOR ALL
  USING (EXISTS (
    SELECT 1 FROM child_profiles
    WHERE child_profiles.id = garden_plants.child_profile_id
    AND child_profiles.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM child_profiles
    WHERE child_profiles.id = garden_plants.child_profile_id
    AND child_profiles.user_id = auth.uid()
  ));
