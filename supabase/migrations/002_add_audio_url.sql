-- Add audio_url column to story_chapters for Edge TTS narration
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/svriwcvcuminvgpzbxsq/sql

ALTER TABLE story_chapters ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Create story-audio storage bucket (public for CDN playback)
INSERT INTO storage.buckets (id, name, public)
VALUES ('story-audio', 'story-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: authenticated users can upload to their own folder
CREATE POLICY "Users upload own audio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'story-audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policy: anyone can read (public bucket for audio playback)
CREATE POLICY "Public audio read access"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'story-audio');

-- Storage policy: users can update/overwrite their own audio
CREATE POLICY "Users update own audio"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'story-audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policy: users can delete their own audio
CREATE POLICY "Users delete own audio"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'story-audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
