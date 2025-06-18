/*
  # Add phone_number to profiles table

  1. Changes
    - Add `phone_number` column to profiles table (text, optional)
  
  2. Purpose
    - Allow users to store their phone number in their profile
    - Phone number will be displayed and editable in the Settings page
    - Both email and phone number will be saved to the database
*/

-- Add phone_number column to profiles table
ALTER TABLE profiles 
ADD COLUMN phone_number text;

-- Add comment for documentation
COMMENT ON COLUMN profiles.phone_number IS 'User phone number for contact purposes'; 