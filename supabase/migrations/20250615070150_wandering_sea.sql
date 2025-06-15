/*
  # Fix ambiguous column reference in join_room_with_code function

  1. Database Function Updates
    - Update `join_room_with_code` function to properly qualify column references
    - Fix ambiguous `room_id` column reference by using table aliases
    - Ensure all column references are properly qualified in JOIN operations

  2. Changes Made
    - Add proper table aliases in the function
    - Qualify all column references with their respective table names
    - Maintain existing function behavior while fixing the ambiguity
*/

-- Drop the existing function first
DROP FUNCTION IF EXISTS join_room_with_code(text, uuid);

-- Recreate the function with proper column qualification
CREATE OR REPLACE FUNCTION join_room_with_code(room_code text, user_uuid uuid)
RETURNS TABLE(success boolean, message text, room_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_room_id uuid;
    room_max_members integer;
    current_member_count integer;
    is_user_already_member boolean;
BEGIN
    -- Find the room by code
    SELECT r.id, r.max_members
    INTO target_room_id, room_max_members
    FROM rooms r
    WHERE r.code = room_code AND r.is_active = true;
    
    -- Check if room exists
    IF target_room_id IS NULL THEN
        RETURN QUERY SELECT false, 'Room not found or inactive'::text, NULL::uuid;
        RETURN;
    END IF;
    
    -- Check if user is already a member
    SELECT EXISTS(
        SELECT 1 
        FROM room_members rm 
        WHERE rm.room_id = target_room_id AND rm.user_id = user_uuid
    ) INTO is_user_already_member;
    
    IF is_user_already_member THEN
        RETURN QUERY SELECT true, 'Already a member'::text, target_room_id;
        RETURN;
    END IF;
    
    -- Check current member count
    SELECT COUNT(*)
    INTO current_member_count
    FROM room_members rm
    WHERE rm.room_id = target_room_id;
    
    -- Check if room is full
    IF current_member_count >= room_max_members THEN
        RETURN QUERY SELECT false, 'Room is full'::text, NULL::uuid;
        RETURN;
    END IF;
    
    -- Add user to room
    INSERT INTO room_members (room_id, user_id, is_online)
    VALUES (target_room_id, user_uuid, true);
    
    -- Return success
    RETURN QUERY SELECT true, 'Successfully joined room'::text, target_room_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT false, ('Error: ' || SQLERRM)::text, NULL::uuid;
END;
$$;