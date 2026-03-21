-- Families / billing table
CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'family', 'annual', 'lifetime')),
  stories_used_this_month INTEGER NOT NULL DEFAULT 0,
  billing_period_start TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_families_user_id ON families(user_id);
CREATE INDEX IF NOT EXISTS idx_families_stripe_customer_id ON families(stripe_customer_id);

ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- Users can read their own family record
CREATE POLICY "Users read own family" ON families FOR SELECT USING (auth.uid() = user_id);
-- Only service role can insert/update (via webhook)
CREATE POLICY "Service role manages families" ON families FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER families_updated_at
  BEFORE UPDATE ON families FOR EACH ROW EXECUTE FUNCTION update_updated_at();
