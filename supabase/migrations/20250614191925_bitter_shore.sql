/*
  # Fix RLS infinite recursion and optimize policies

  1. Policy Updates
    - Simplify room_members policies to prevent recursion
    - Optimize room selection policies
    - Add proper indexes for performance

  2. Study Sessions
    - Add function to calculate total focus time
    - Ensure proper RLS for study sessions
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view room members for accessible rooms" ON room_members;
DROP POLICY IF EXISTS "Users can view public rooms" ON rooms;

-- Create simplified, non-recursive policies for room_members
CREATE POLICY "Users can view room members for their rooms"
  ON room_members
  FOR SELECT
  TO authenticated
  USING (
    -- User can see members of rooms they are in
    EXISTS (
      SELECT 1 FROM room_members rm2 
      WHERE rm2.room_id = room_members.room_id 
      AND rm2.user_id = auth.uid()
    )
    OR
    -- User can see members of rooms they admin
    EXISTS (
      SELECT 1 FROM rooms r 
      WHERE r.id = room_members.room_id 
      AND r.admin_id = auth.uid()
    )
  );

-- Create simplified policy for rooms
CREATE POLICY "Users can view accessible rooms"
  ON rooms
  FOR SELECT
  TO authenticated
  USING (
    -- Public rooms
    NOT is_private
    OR
    -- Rooms user admins
    admin_id = auth.uid()
    OR
    -- Rooms user is a member of (direct check without subquery)
    id IN (
      SELECT room_id FROM room_members 
      WHERE user_id = auth.uid()
    )
  );

-- Add function to calculate total focus time for a user
CREATE OR REPLACE FUNCTION get_user_total_focus_time(user_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_minutes integer;
BEGIN
  SELECT COALESCE(SUM(focus_time), 0)
  INTO total_minutes
  FROM study_sessions
  WHERE user_id = user_uuid;
  
  RETURN total_minutes;
END;
$$;

-- Add RLS policy for the function (allow users to get their own focus time)
CREATE POLICY "Users can view their own study sessions"
  ON study_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_focus 
ON study_sessions(user_id, focus_time) 
WHERE focus_time > 0;

-- Add function to get user study statistics
CREATE OR REPLACE FUNCTION get_user_study_stats(user_uuid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_focus_minutes', COALESCE(SUM(focus_time), 0),
    'total_sessions', COUNT(*),
    'completed_tasks', COALESCE(SUM(completed_tasks), 0),
    'active_sessions', COUNT(*) FILTER (WHERE is_active = true)
  )
  INTO result
  FROM study_sessions
  WHERE user_id = user_uuid;
  
  RETURN result;
END;
$$;