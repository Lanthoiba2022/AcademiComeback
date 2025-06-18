-- Add revenuecat_id column to profiles table
ALTER TABLE profiles
ADD COLUMN revenuecat_id TEXT;

-- Create index for faster lookups
CREATE INDEX idx_profiles_revenuecat_id ON profiles(revenuecat_id);

-- Add comment to column
COMMENT ON COLUMN profiles.revenuecat_id IS 'RevenueCat anonymous user ID for subscription tracking'; 