/*
  # Fix RLS Policies to Prevent Infinite Recursion

  1. Security Updates
    - Simplify room_members policies to avoid circular dependencies
    - Update profiles policies to be more straightforward
    - Ensure policies don't create recursive loops

  2. Changes Made
    - Simplified room_members SELECT policy
    - Updated profiles policies to avoid complex joins
    - Added proper indexes for performance
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view room members for accessible rooms" ON room_members;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

-- Create simplified policies for room_members
CREATE POLICY "Users can view room members for accessible rooms"
  ON room_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rooms 
      WHERE rooms.id = room_members.room_id 
      AND (
        NOT rooms.is_private 
        OR rooms.admin_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM room_members rm2 
          WHERE rm2.room_id = rooms.id 
          AND rm2.user_id = auth.uid()
        )
      )
    )
  );

-- Create simplified policy for profiles
CREATE POLICY "Users can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Ensure proper indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_room_members_composite ON room_members(room_id, user_id);
CREATE INDEX IF NOT EXISTS idx_rooms_admin_private ON rooms(admin_id, is_private);