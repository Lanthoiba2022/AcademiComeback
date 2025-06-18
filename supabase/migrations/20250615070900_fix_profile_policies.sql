/*
  # Fix profile policies for updated structure

  1. Changes
    - Drop and recreate profile policies to ensure they work with new columns
    - Ensure users can update their own profile including full_name, phone_number, etc.
  
  2. Purpose
    - Fix any issues with profile updates after adding email and phone_number columns
    - Ensure full_name can be updated properly
*/

-- Drop existing profile policies
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Recreate profile policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Grant necessary permissions
GRANT ALL ON profiles TO authenticated; 