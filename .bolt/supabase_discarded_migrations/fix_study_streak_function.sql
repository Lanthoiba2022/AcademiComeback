-- Fix study streak function to use correct column name
CREATE OR REPLACE FUNCTION get_study_streak_data(
  p_user_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
  study_date DATE,
  total_minutes INTEGER,
  session_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    start_time::date as study_date,
    COALESCE(SUM(focus_time), 0)::INTEGER as total_minutes,
    COUNT(*)::BIGINT as session_count
  FROM study_sessions
  WHERE user_id = p_user_id
    AND start_time >= p_start_date
    AND start_time <= p_end_date
    AND focus_time IS NOT NULL
  GROUP BY start_time::date
  ORDER BY study_date;
END;
$$ LANGUAGE plpgsql STABLE; 