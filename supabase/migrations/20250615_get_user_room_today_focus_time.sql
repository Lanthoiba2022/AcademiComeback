 -- Migration: get_user_room_today_focus_time
-- Returns today's focus time (in minutes) for a user in a specific room

CREATE OR REPLACE FUNCTION get_user_room_today_focus_time(user_uuid uuid, room_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  total_minutes integer;
BEGIN
  SELECT COALESCE(SUM(focus_time), 0)
  INTO total_minutes
  FROM study_sessions
  WHERE user_id = user_uuid
    AND room_id = room_uuid
    AND DATE(start_time AT TIME ZONE 'UTC') = CURRENT_DATE;
  RETURN total_minutes;
END;
$$;
