/*
  # Fix Private Room Join Issues

  1. Security Updates
    - Update room policies to allow joining private rooms with valid codes
    - Add proper RLS policies for room access
    - Ensure users can join rooms they have codes for

  2. Functions
    - Add function to validate room join permissions
    - Update room member policies
*/

-- Drop existing policies that might be blocking private room joins
DROP POLICY IF EXISTS "rooms_select_policy" ON rooms;
DROP POLICY IF EXISTS "room_members_insert_policy" ON room_members;

-- Create updated room select policy that allows viewing rooms by code
CREATE POLICY "rooms_select_policy" ON rooms
  FOR SELECT
  TO authenticated
  USING (
    -- Allow if room is public
    (NOT is_private) 
    OR 
    -- Allow if user is admin
    (admin_id = auth.uid()) 
    OR 
    -- Allow if user is already a member
    (id IN (
      SELECT room_id 
      FROM room_members 
      WHERE user_id = auth.uid()
    ))
    -- Note: We'll handle code-based access in the application layer
  );

-- Create updated room member insert policy
CREATE POLICY "room_members_insert_policy" ON room_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User can only add themselves
    user_id = auth.uid()
    AND
    -- Room must exist and be active
    room_id IN (
      SELECT id 
      FROM rooms 
      WHERE is_active = true
    )
  );

-- Add function to check if user can join room with code
CREATE OR REPLACE FUNCTION can_join_room_with_code(room_code TEXT, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  room_record RECORD;
  is_member BOOLEAN;
BEGIN
  -- Get room details
  SELECT id, is_active, max_members, admin_id
  INTO room_record
  FROM rooms
  WHERE code = UPPER(room_code);
  
  -- Room must exist and be active
  IF room_record.id IS NULL OR NOT room_record.is_active THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user is already a member
  SELECT EXISTS(
    SELECT 1 
    FROM room_members 
    WHERE room_id = room_record.id AND user_id = user_uuid
  ) INTO is_member;
  
  -- If already a member, allow
  IF is_member THEN
    RETURN TRUE;
  END IF;
  
  -- Check if room has space
  IF (
    SELECT COUNT(*) 
    FROM room_members 
    WHERE room_id = room_record.id
  ) >= room_record.max_members THEN
    RETURN FALSE;
  END IF;
  
  -- If we have a valid code and room has space, allow join
  RETURN TRUE;
END;
$$;

-- Add function to join room with code validation
CREATE OR REPLACE FUNCTION join_room_with_code(room_code TEXT, user_uuid UUID)
RETURNS TABLE(
  success BOOLEAN,
  room_id UUID,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  room_record RECORD;
  member_count INTEGER;
  is_already_member BOOLEAN;
BEGIN
  -- Validate inputs
  IF room_code IS NULL OR user_uuid IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Invalid parameters';
    RETURN;
  END IF;
  
  -- Get room details
  SELECT id, name, is_active, max_members, is_private
  INTO room_record
  FROM rooms
  WHERE code = UPPER(room_code);
  
  -- Check if room exists
  IF room_record.id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Room not found';
    RETURN;
  END IF;
  
  -- Check if room is active
  IF NOT room_record.is_active THEN
    RETURN QUERY SELECT FALSE, room_record.id, 'Room is not active';
    RETURN;
  END IF;
  
  -- Check if user is already a member
  SELECT EXISTS(
    SELECT 1 
    FROM room_members 
    WHERE room_id = room_record.id AND user_id = user_uuid
  ) INTO is_already_member;
  
  IF is_already_member THEN
    RETURN QUERY SELECT TRUE, room_record.id, 'Already a member';
    RETURN;
  END IF;
  
  -- Check room capacity
  SELECT COUNT(*)
  INTO member_count
  FROM room_members
  WHERE room_id = room_record.id;
  
  IF member_count >= room_record.max_members THEN
    RETURN QUERY SELECT FALSE, room_record.id, 'Room is full';
    RETURN;
  END IF;
  
  -- Add user to room
  INSERT INTO room_members (room_id, user_id, is_online)
  VALUES (room_record.id, user_uuid, true);
  
  RETURN QUERY SELECT TRUE, room_record.id, 'Successfully joined room';
  RETURN;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, room_record.id, 'Failed to join room: ' || SQLERRM;
    RETURN;
END;
$$;

-- Update the get_room_details_for_join function to be more permissive
CREATE OR REPLACE FUNCTION get_room_details_for_join(room_code TEXT)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  is_private BOOLEAN,
  is_active BOOLEAN,
  member_count BIGINT,
  max_members INTEGER,
  can_join BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  room_record RECORD;
  current_members BIGINT;
  user_is_member BOOLEAN;
BEGIN
  -- Get room details
  SELECT r.id, r.name, r.description, r.is_private, r.is_active, r.max_members
  INTO room_record
  FROM rooms r
  WHERE r.code = UPPER(room_code);
  
  -- Return empty if room not found
  IF room_record.id IS NULL THEN
    RETURN;
  END IF;
  
  -- Get current member count
  SELECT COUNT(*)
  INTO current_members
  FROM room_members
  WHERE room_id = room_record.id;
  
  -- Check if current user is already a member
  SELECT EXISTS(
    SELECT 1 
    FROM room_members 
    WHERE room_id = room_record.id AND user_id = auth.uid()
  ) INTO user_is_member;
  
  -- Determine if user can join
  RETURN QUERY SELECT 
    room_record.id,
    room_record.name,
    room_record.description,
    room_record.is_private,
    room_record.is_active,
    current_members,
    room_record.max_members,
    (
      room_record.is_active AND 
      (user_is_member OR current_members < room_record.max_members)
    ) as can_join;
END;
$$;