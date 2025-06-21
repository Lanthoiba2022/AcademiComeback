-- Add columns if they don't exist
ALTER TABLE study_sessions 
ADD COLUMN IF NOT EXISTS focus_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create separate indexes
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id 
ON study_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_study_sessions_created_at 
ON study_sessions(created_at);

-- Index for focus minutes queries
CREATE INDEX IF NOT EXISTS idx_study_sessions_focus 
ON study_sessions(user_id, created_at, focus_minutes);



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
    COALESCE(SUM(focus_minutes), 0)::INTEGER as total_minutes,
    COUNT(*)::BIGINT as session_count
  FROM study_sessions
  WHERE user_id = p_user_id
    AND created_at >= p_start_date
    AND created_at <= p_end_date
    AND focus_minutes IS NOT NULL
  GROUP BY created_at::date
  ORDER BY study_date;
END;
$$ LANGUAGE plpgsql STABLE;
