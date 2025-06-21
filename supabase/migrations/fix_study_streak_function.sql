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
    created_at::date as study_date,
    COALESCE(SUM(focus_time), 0)::INTEGER as total_minutes,
    COUNT(*)::BIGINT as session_count
  FROM study_sessions
  WHERE user_id = p_user_id
    AND created_at >= p_start_date
    AND created_at <= p_end_date
    AND focus_time IS NOT NULL
  GROUP BY created_at::date
  ORDER BY study_date;
END;
$$ LANGUAGE plpgsql STABLE; 