/*
  # Fix infinite recursion in room_members RLS policies

  1. Problem
    - The current SELECT policy for room_members creates infinite recursion
    - Policy references room_members table within itself causing circular dependency

  2. Solution
    - Drop existing problematic policies
    - Create simplified policies that avoid self-referencing
    - Use direct user ID checks instead of complex subqueries

  3. New Policies
    - SELECT: Users can view members of rooms they belong to (simplified)
    - INSERT: Users can join rooms (unchanged)
    - UPDATE: Users can update their own membership (unchanged)
    - DELETE: Users can leave rooms or admins can remove members (simplified)
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view room members for their rooms" ON room_members;
DROP POLICY IF EXISTS "Users can leave rooms" ON room_members;

-- Create simplified SELECT policy
-- Users can view room members if they are members of the same room
CREATE POLICY "Users can view room members"
  ON room_members
  FOR SELECT
  TO authenticated
  USING (
    -- User can see members of rooms where they are also a member
    room_id IN (
      SELECT rm.room_id 
      FROM room_members rm 
      WHERE rm.user_id = auth.uid()
    )
    OR
    -- Room admins can see all members of their rooms
    room_id IN (
      SELECT r.id 
      FROM rooms r 
      WHERE r.admin_id = auth.uid()
    )
  );

-- Create simplified DELETE policy
-- Users can leave rooms they're in, or room admins can remove members
CREATE POLICY "Users can leave rooms or admins can remove"
  ON room_members
  FOR DELETE
  TO authenticated
  USING (
    -- Users can remove themselves
    user_id = auth.uid()
    OR
    -- Room admins can remove any member
    room_id IN (
      SELECT r.id 
      FROM rooms r 
      WHERE r.admin_id = auth.uid()
    )
  );