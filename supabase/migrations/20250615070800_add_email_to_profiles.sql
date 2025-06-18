/*
  # Add email to profiles table

  1. Changes
    - Add `email` column to profiles table (text, optional)
  
  2. Purpose
    - Store email in profiles table for consistency
    - Allow users to update their email through the settings page
    - Both email and phone number will be saved to the database
*/

-- Add email column to profiles table
ALTER TABLE profiles 
ADD COLUMN email text;

-- Add comment for documentation
COMMENT ON COLUMN profiles.email IS 'User email address for contact purposes';

-- Update existing profiles with email from auth.users
UPDATE profiles 
SET email = auth.users.email 
FROM auth.users 
WHERE profiles.id = auth.users.id; 