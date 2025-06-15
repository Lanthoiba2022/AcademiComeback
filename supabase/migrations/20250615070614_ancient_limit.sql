/*
  # Add missing get_room_total_study_time function

  1. New Functions
    - `get_room_total_study_time(room_uuid)` - Returns total focus time for a room in minutes
  
  2. Purpose
    - This function calculates the sum of all focus_time from study_sessions for a given room
    - Returns the result as an integer representing total minutes of study time
    - Used by the frontend to display room statistics
*/

CREATE OR REPLACE FUNCTION public.get_room_total_study_time(room_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_time integer;
BEGIN
    SELECT COALESCE(SUM(focus_time), 0)
    INTO total_time
    FROM public.study_sessions
    WHERE room_id = room_uuid;

    RETURN total_time;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_room_total_study_time(uuid) TO authenticated;