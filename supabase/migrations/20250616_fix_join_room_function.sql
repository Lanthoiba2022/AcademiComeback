-- Migration: fix_join_room_function
-- This migration updates the `join_room_with_code` function to return the new member's profile info.

-- Drop the existing function first
DROP FUNCTION IF EXISTS join_room_with_code(text, uuid);

-- Recreate the function to return a detailed JSON object
CREATE OR REPLACE FUNCTION join_room_with_code(room_code text, user_uuid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_room_id uuid;
    room_max_members integer;
    current_member_count integer;
    is_user_already_member boolean;
    new_member_data json;
BEGIN
    -- Find the room by code
    SELECT r.id, r.max_members
    INTO target_room_id, room_max_members
    FROM rooms r
    WHERE r.code = room_code AND r.is_active = true;
    
    -- Check if room exists
    IF target_room_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Room not found or inactive');
    END IF;
    
    -- Check if user is already a member
    SELECT EXISTS(
        SELECT 1 
        FROM room_members rm 
        WHERE rm.room_id = target_room_id AND rm.user_id = user_uuid
    ) INTO is_user_already_member;
    
    IF is_user_already_member THEN
        -- If already a member, just return their member data
        SELECT json_build_object(
            'user_id', rm.user_id,
            'is_online', rm.is_online,
            'last_seen', rm.last_seen,
            'user', json_build_object(
                'id', p.id,
                'full_name', p.full_name,
                'avatar_url', p.avatar_url,
                'total_points', p.total_points,
                'rank', p.rank,
                'achievements', p.achievements,
                'created_at', p.created_at
            )
        )
        INTO new_member_data
        FROM room_members rm
        JOIN profiles p ON rm.user_id = p.id
        WHERE rm.room_id = target_room_id AND rm.user_id = user_uuid;
        
        RETURN json_build_object('success', true, 'message', 'Already a member', 'room_id', target_room_id, 'member', new_member_data);
    END IF;
    
    -- Check current member count
    SELECT COUNT(*)
    INTO current_member_count
    FROM room_members rm
    WHERE rm.room_id = target_room_id;
    
    -- Check if room is full
    IF current_member_count >= room_max_members THEN
        RETURN json_build_object('success', false, 'message', 'Room is full');
    END IF;
    
    -- Add user to room
    INSERT INTO room_members (room_id, user_id, is_online, role)
    VALUES (target_room_id, user_uuid, true, 'member')
    RETURNING (
        SELECT json_build_object(
            'user_id', rm.user_id,
            'is_online', rm.is_online,
            'last_seen', rm.last_seen,
            'user', json_build_object(
                'id', p.id,
                'full_name', p.full_name,
                'avatar_url', p.avatar_url,
                'total_points', p.total_points,
                'rank', p.rank,
                'achievements', p.achievements,
                'created_at', p.created_at
            )
        )
        FROM room_members rm
        JOIN profiles p ON rm.user_id = p.id
        WHERE rm.room_id = target_room_id AND rm.user_id = user_uuid
    ) INTO new_member_data;
    
    -- Return success
    RETURN json_build_object('success', true, 'message', 'Successfully joined room', 'room_id', target_room_id, 'member', new_member_data);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION join_room_with_code(text, uuid) TO authenticated;
