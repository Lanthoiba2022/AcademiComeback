-- Migration: Update get_user_study_stats to include today and this week focus time

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
    'active_sessions', COUNT(*) FILTER (WHERE is_active = true),
    'today_focus_minutes', (
      SELECT COALESCE(SUM(focus_time), 0)
      FROM study_sessions
      WHERE user_id = user_uuid
        AND DATE(start_time AT TIME ZONE 'UTC') = CURRENT_DATE
    ),
    'this_week_focus_minutes', (
      SELECT COALESCE(SUM(focus_time), 0)
      FROM study_sessions
      WHERE user_id = user_uuid
        AND DATE_TRUNC('week', start_time AT TIME ZONE 'UTC') = DATE_TRUNC('week', CURRENT_DATE)
    ),
    'current_streak_days', 0, -- (Optional: implement streak logic if needed)
    'joined_rooms_count', (
      SELECT COUNT(DISTINCT room_id)
      FROM room_members
      WHERE user_id = user_uuid
    ),
    'total_tasks_count', (
      SELECT COUNT(*)
      FROM tasks t
      INNER JOIN room_members rm ON t.room_id = rm.room_id
      WHERE rm.user_id = user_uuid
    )
  )
  INTO result
  FROM study_sessions
  WHERE user_id = user_uuid;
  RETURN result;
END;
$$; 