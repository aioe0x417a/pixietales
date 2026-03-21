-- Expand child profile age range from 1-6 to 1-8
ALTER TABLE child_profiles DROP CONSTRAINT IF EXISTS child_profiles_age_check;
ALTER TABLE child_profiles ADD CONSTRAINT child_profiles_age_check CHECK (age >= 1 AND age <= 8);
