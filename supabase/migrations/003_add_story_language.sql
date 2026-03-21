-- Add language column to stories table for multilingual story support
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/svriwcvcuminvgpzbxsq/sql

ALTER TABLE stories ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';
