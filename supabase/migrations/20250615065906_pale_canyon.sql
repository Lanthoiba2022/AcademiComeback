/*
  # Fix ambiguous column reference in join_room_with_code function

  1. Database Functions
    - Update `join_room_with_code` function to properly qualify column references
    - Fix ambiguous `room_id` column reference by specifying table names
    - Ensure the function works correctly for joining rooms with room codes

  2. Changes Made
    - Fully qualify all column references with their respective table names
    - Maintain the same function signature and behavior
    - Fix the SQL ambiguity that was causing join room failures
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS join_room_with_code(text);

-- Create the corrected join_room_with_code function
CREATE OR REPLACE FUNCTION join_room_with_code(room_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_room_id uuid;
  current_user_id uuid;
  member_count integer;
  max_members_allowed integer;
  result json;
BEGIN
  -- Get the current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  -- Find the room by code
  SELECT rooms.id, rooms.max_members 
  INTO target_room_id, max_members_allowed
  FROM rooms 
  WHERE rooms.code = room_code AND rooms.is_active = true;

  IF target_room_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Room not found or inactive');
  END IF;

  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM room_members 
    WHERE room_members.room_id = target_room_id 
    AND room_members.user_id = current_user_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Already a member of this room');
  END IF;

  -- Check current member count
  SELECT COUNT(*) INTO member_count
  FROM room_members 
  WHERE room_members.room_id = target_room_id;

  IF member_count >= max_members_allowed THEN
    RETURN json_build_object('success', false, 'error', 'Room is full');
  END IF;

  -- Add user to room
  INSERT INTO room_members (room_id, user_id, joined_at, last_seen, is_online)
  VALUES (target_room_id, current_user_id, now(), now(), true);

  -- Return success with room info
  SELECT json_build_object(
    'success', true,
    'room_id', rooms.id,
    'room_name', rooms.name,
    'room_description', rooms.description
  ) INTO result
  FROM rooms 
  WHERE rooms.id = target_room_id;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION join_room_with_code(text) TO authenticated;