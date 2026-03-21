-- COPPA consent audit log
CREATE TABLE IF NOT EXISTS consent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_version TEXT NOT NULL DEFAULT 'v1.0',
  consented_at TIMESTAMPTZ DEFAULT now(),
  ip_hash TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_consent_log_user_id ON consent_log(user_id);

ALTER TABLE consent_log ENABLE ROW LEVEL SECURITY;

-- Users can read their own consent records
CREATE POLICY "Users read own consent" ON consent_log FOR SELECT USING (auth.uid() = user_id);
-- Service role inserts consent records
CREATE POLICY "Service inserts consent" ON consent_log FOR INSERT WITH CHECK (true);
