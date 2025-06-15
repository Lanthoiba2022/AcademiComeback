/*
  # Add Real-Time Study Platform Functions

  1. Database Functions
    - `generate_room_code()` - Generate unique 6-character room codes
    - `get_user_study_stats()` - Get comprehensive user study statistics
    - `get_room_total_study_time()` - Get total study time for a room
    - `update_user_rank()` - Auto-update user rank based on points

  2. Triggers
    - Auto-update user rank when points change
    - Update room activity timestamps
    - Track study session changes

  3. Real-time Setup
    - Enable realtime for all tables
    - Add proper indexes for performance
*/

-- Generate unique room code function
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  code text;
  attempts int := 0;
  max_attempts int := 100;
BEGIN
  LOOP
    -- Generate 6-character code with letters and numbers
    code := upper(
      chr(65 + floor(random() * 26)::int) ||
      chr(65 + floor(random() * 26)::int) ||
      floor(random() * 10)::text ||
      floor(random() * 10)::text ||
      chr(65 + floor(random() * 26)::int) ||
      floor(random() * 10)::text
    );
    
    -- Check if code already exists
    IF NOT EXISTS (SELECT 1 FROM rooms WHERE code = code) THEN
      RETURN code;
    END IF;
    
    attempts := attempts + 1;
    IF attempts >= max_attempts THEN
      -- Fallback: use timestamp-based code
      code := 'R' || extract(epoch from now())::bigint::text;
      code := upper(right(code, 6));
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

-- Get comprehensive user study statistics
CREATE OR REPLACE FUNCTION get_user_study_stats(user_uuid uuid)
RETURNS TABLE(
  total_focus_minutes bigint,
  total_sessions bigint,
  completed_tasks bigint,
  active_sessions bigint,
  today_focus_minutes bigint,
  this_week_focus_minutes bigint,
  current_streak_days bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(s.focus_time), 0)::bigint as total_focus_minutes,
    COUNT(s.id)::bigint as total_sessions,
    COALESCE(SUM(s.completed_tasks), 0)::bigint as completed_tasks,
    COUNT(CASE WHEN s.is_active THEN 1 END)::bigint as active_sessions,
    COALESCE(SUM(CASE 
      WHEN DATE(s.start_time AT TIME ZONE 'UTC') = CURRENT_DATE 
      THEN s.focus_time 
      ELSE 0 
    END), 0)::bigint as today_focus_minutes,
    COALESCE(SUM(CASE 
      WHEN s.start_time >= DATE_TRUNC('week', CURRENT_DATE AT TIME ZONE 'UTC') 
      THEN s.focus_time 
      ELSE 0 
    END), 0)::bigint as this_week_focus_minutes,
    -- Simple streak calculation (consecutive days with study sessions)
    COALESCE((
      SELECT COUNT(*)
      FROM (
        SELECT DISTINCT DATE(start_time AT TIME ZONE 'UTC') as study_date
        FROM study_sessions 
        WHERE user_id = user_uuid 
          AND focus_time > 0
        ORDER BY study_date DESC
      ) consecutive_days
      WHERE study_date >= CURRENT_DATE - INTERVAL '30 days'
    ), 0)::bigint as current_streak_days
  FROM study_sessions s
  WHERE s.user_id = user_uuid;
END;
$$;

-- Get total study time for a room
CREATE OR REPLACE FUNCTION get_room_total_study_time(room_uuid uuid)
RETURNS bigint
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN COALESCE((
    SELECT SUM(focus_time)
    FROM study_sessions
    WHERE room_id = room_uuid
  ), 0);
END;
$$;

-- Update user rank based on total points
CREATE OR REPLACE FUNCTION update_user_rank()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  new_rank text;
BEGIN
  -- Determine rank based on total points
  IF NEW.total_points >= 5000 THEN
    new_rank := 'Master';
  ELSIF NEW.total_points >= 1500 THEN
    new_rank := 'Expert';
  ELSIF NEW.total_points >= 500 THEN
    new_rank := 'Scholar';
  ELSIF NEW.total_points >= 100 THEN
    new_rank := 'Student';
  ELSE
    new_rank := 'Beginner';
  END IF;
  
  -- Update rank if it changed
  IF NEW.rank != new_rank THEN
    NEW.rank := new_rank;
    NEW.updated_at := now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update updated_at column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS update_rank_trigger ON profiles;
CREATE TRIGGER update_rank_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.total_points IS DISTINCT FROM NEW.total_points)
  EXECUTE FUNCTION update_user_rank();

DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date ON study_sessions(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_study_sessions_room_active ON study_sessions(room_id, is_active);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_time ON chat_messages(room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_room_status ON tasks(room_id, status);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_members;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE study_sessions;

-- Add RLS policies for realtime access
CREATE POLICY "Enable realtime for authenticated users" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable realtime for authenticated users" ON rooms
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable realtime for authenticated users" ON room_members
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable realtime for authenticated users" ON tasks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable realtime for authenticated users" ON chat_messages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable realtime for authenticated users" ON study_sessions
  FOR SELECT USING (auth.role() = 'authenticated');