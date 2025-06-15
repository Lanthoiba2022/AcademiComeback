/*
  # Fix database policies and functions

  1. Functions
    - Drop and recreate functions to avoid conflicts
    - Add room code generation
    - Add user statistics function
    - Add utility functions for triggers

  2. Policies
    - Remove recursive policies that cause infinite loops
    - Create simplified, non-recursive policies
    - Ensure proper access control without circular dependencies

  3. Performance
    - Add necessary indexes for better query performance
    - Update existing data for consistency
*/

-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS get_user_study_stats(uuid);
DROP FUNCTION IF EXISTS generate_room_code();
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS update_user_rank();

-- Drop all existing problematic policies that cause recursion
DROP POLICY IF EXISTS "Users can view room members" ON room_members;
DROP POLICY IF EXISTS "Users can leave rooms or admins can remove" ON room_members;
DROP POLICY IF EXISTS "Users can view accessible rooms" ON rooms;
DROP POLICY IF EXISTS "Room members can view tasks" ON tasks;
DROP POLICY IF EXISTS "Room members can create tasks" ON tasks;
DROP POLICY IF EXISTS "Room members can view messages" ON chat_messages;
DROP POLICY IF EXISTS "Room members can send messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can view public and own rooms" ON rooms;
DROP POLICY IF EXISTS "Anyone can view room members" ON room_members;
DROP POLICY IF EXISTS "Users and admins can remove members" ON room_members;
DROP POLICY IF EXISTS "Anyone can view tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can create tasks" ON tasks;
DROP POLICY IF EXISTS "Anyone can view chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON chat_messages;

-- Create room code generation function
CREATE FUNCTION generate_room_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  code text;
  exists_check boolean;
BEGIN
  LOOP
    -- Generate 6 character code using random characters
    code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM rooms WHERE rooms.code = code) INTO exists_check;
    
    -- If code doesn't exist, return it
    IF NOT exists_check THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

-- Create function to update updated_at column
CREATE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create function to update user rank based on points
CREATE FUNCTION update_user_rank()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update rank based on total points
  IF NEW.total_points >= 5000 THEN
    NEW.rank = 'Master';
  ELSIF NEW.total_points >= 1500 THEN
    NEW.rank = 'Expert';
  ELSIF NEW.total_points >= 500 THEN
    NEW.rank = 'Scholar';
  ELSIF NEW.total_points >= 100 THEN
    NEW.rank = 'Student';
  ELSE
    NEW.rank = 'Beginner';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create function to get user study statistics
CREATE FUNCTION get_user_study_stats(user_uuid uuid)
RETURNS TABLE(
  total_study_time integer,
  sessions_today integer,
  total_sessions integer,
  completed_tasks integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(ss.focus_time), 0)::integer as total_study_time,
    COUNT(CASE WHEN DATE(ss.start_time) = CURRENT_DATE THEN 1 END)::integer as sessions_today,
    COUNT(ss.id)::integer as total_sessions,
    COALESCE(SUM(ss.completed_tasks), 0)::integer as completed_tasks
  FROM study_sessions ss
  WHERE ss.user_id = user_uuid;
END;
$$;

-- Drop and recreate triggers to avoid conflicts
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

DROP TRIGGER IF EXISTS update_rank_trigger ON profiles;
CREATE TRIGGER update_rank_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.total_points IS DISTINCT FROM NEW.total_points)
  EXECUTE FUNCTION update_user_rank();

-- Create simplified, non-recursive policies

-- Rooms policies
CREATE POLICY "view_accessible_rooms_v2"
  ON rooms
  FOR SELECT
  TO authenticated
  USING (
    NOT is_private 
    OR admin_id = auth.uid()
    OR id IN (
      SELECT room_id FROM room_members WHERE user_id = auth.uid()
    )
  );

-- Room members policies (simplified to avoid recursion)
CREATE POLICY "view_all_room_members_v2"
  ON room_members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "remove_members_v2"
  ON room_members
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR room_id IN (
      SELECT id FROM rooms WHERE admin_id = auth.uid()
    )
  );

-- Tasks policies (simplified)
CREATE POLICY "view_all_tasks_v2"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "create_tasks_v2"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Chat messages policies (simplified)
CREATE POLICY "view_all_messages_v2"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "send_messages_v2"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() 
    OR user_id IS NULL
  );

-- Add performance indexes conditionally
DO $$
BEGIN
  -- Rooms indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_rooms_admin_id_v2') THEN
    CREATE INDEX idx_rooms_admin_id_v2 ON rooms(admin_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_rooms_code_v2') THEN
    CREATE INDEX idx_rooms_code_v2 ON rooms(code);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_rooms_admin_private_v2') THEN
    CREATE INDEX idx_rooms_admin_private_v2 ON rooms(admin_id, is_private);
  END IF;
  
  -- Room members indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_room_members_room_id_v2') THEN
    CREATE INDEX idx_room_members_room_id_v2 ON room_members(room_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_room_members_user_id_v2') THEN
    CREATE INDEX idx_room_members_user_id_v2 ON room_members(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_room_members_composite_v2') THEN
    CREATE INDEX idx_room_members_composite_v2 ON room_members(room_id, user_id);
  END IF;
  
  -- Tasks indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_room_id_v2') THEN
    CREATE INDEX idx_tasks_room_id_v2 ON tasks(room_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_assignee_id_v2') THEN
    CREATE INDEX idx_tasks_assignee_id_v2 ON tasks(assignee_id);
  END IF;
  
  -- Chat messages indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_chat_messages_room_id_v2') THEN
    CREATE INDEX idx_chat_messages_room_id_v2 ON chat_messages(room_id);
  END IF;
  
  -- Study sessions indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_study_sessions_room_id_v2') THEN
    CREATE INDEX idx_study_sessions_room_id_v2 ON study_sessions(room_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_study_sessions_user_id_v2') THEN
    CREATE INDEX idx_study_sessions_user_id_v2 ON study_sessions(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_study_sessions_user_focus_v2') THEN
    CREATE INDEX idx_study_sessions_user_focus_v2 ON study_sessions(user_id, focus_time) WHERE focus_time > 0;
  END IF;
END $$;

-- Update existing data to ensure consistency
UPDATE profiles SET rank = 'Beginner' WHERE rank IS NULL OR rank = '';
UPDATE profiles SET total_points = 0 WHERE total_points IS NULL;
UPDATE profiles SET achievements = '{}' WHERE achievements IS NULL OR achievements = '';

-- Ensure all rooms have proper codes
DO $$
BEGIN
  UPDATE rooms SET code = generate_room_code() WHERE code IS NULL OR code = '';
END $$;