/*
  # Fix database policies and functionality

  1. Database Functions
    - Room code generation function
    - Update timestamp function  
    - User rank calculation function

  2. Triggers
    - Auto-update timestamps
    - Auto-calculate user ranks

  3. Policies
    - Fix recursive policies causing infinite loops
    - Simplify room access policies
    - Enable proper data access

  4. Performance
    - Add necessary indexes
    - Optimize query performance
*/

-- Drop all existing problematic policies that cause recursion
DROP POLICY IF EXISTS "Users can view room members" ON room_members;
DROP POLICY IF EXISTS "Users can leave rooms or admins can remove" ON room_members;
DROP POLICY IF EXISTS "Users can view accessible rooms" ON rooms;
DROP POLICY IF EXISTS "Room members can view tasks" ON tasks;
DROP POLICY IF EXISTS "Room members can create tasks" ON tasks;
DROP POLICY IF EXISTS "Room members can view messages" ON chat_messages;
DROP POLICY IF EXISTS "Room members can send messages" ON chat_messages;

-- Create room code generation function
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  code text;
  exists_check boolean;
BEGIN
  LOOP
    -- Generate 6 character code
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
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create function to update user rank based on points
CREATE OR REPLACE FUNCTION update_user_rank()
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
CREATE OR REPLACE FUNCTION get_user_study_stats(user_uuid uuid)
RETURNS TABLE(
  total_study_time integer,
  sessions_today integer,
  total_sessions integer,
  completed_tasks integer
)
LANGUAGE plpgsql
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

-- Create triggers (drop first to avoid conflicts)
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

-- Update existing rank trigger to avoid conflicts
DROP TRIGGER IF EXISTS update_rank_trigger ON profiles;
CREATE TRIGGER update_rank_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.total_points IS DISTINCT FROM NEW.total_points)
  EXECUTE FUNCTION update_user_rank();

-- Recreate policies with proper names to avoid conflicts

-- Rooms policies (recreate with new names)
DROP POLICY IF EXISTS "Users can view public and own rooms" ON rooms;
CREATE POLICY "Users can view public and own rooms"
  ON rooms
  FOR SELECT
  TO authenticated
  USING (
    NOT is_private 
    OR admin_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM room_members rm 
      WHERE rm.room_id = rooms.id 
      AND rm.user_id = auth.uid()
    )
  );

-- Room members policies (simplified to avoid recursion)
DROP POLICY IF EXISTS "Anyone can view room members" ON room_members;
CREATE POLICY "Anyone can view room members"
  ON room_members
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users and admins can remove members" ON room_members;
CREATE POLICY "Users and admins can remove members"
  ON room_members
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM rooms r 
      WHERE r.id = room_members.room_id 
      AND r.admin_id = auth.uid()
    )
  );

-- Tasks policies (simplified)
DROP POLICY IF EXISTS "Anyone can view tasks" ON tasks;
CREATE POLICY "Anyone can view tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create tasks" ON tasks;
CREATE POLICY "Authenticated users can create tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Chat messages policies (simplified)
DROP POLICY IF EXISTS "Anyone can view chat messages" ON chat_messages;
CREATE POLICY "Anyone can view chat messages"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can send messages" ON chat_messages;
CREATE POLICY "Authenticated users can send messages"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() 
    OR user_id IS NULL
  );

-- Add performance indexes (only if they don't exist)
DO $$
BEGIN
  -- Rooms indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_rooms_admin_id') THEN
    CREATE INDEX idx_rooms_admin_id ON rooms(admin_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_rooms_code') THEN
    CREATE INDEX idx_rooms_code ON rooms(code);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_rooms_admin_private') THEN
    CREATE INDEX idx_rooms_admin_private ON rooms(admin_id, is_private);
  END IF;
  
  -- Room members indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_room_members_room_id') THEN
    CREATE INDEX idx_room_members_room_id ON room_members(room_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_room_members_user_id') THEN
    CREATE INDEX idx_room_members_user_id ON room_members(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_room_members_composite') THEN
    CREATE INDEX idx_room_members_composite ON room_members(room_id, user_id);
  END IF;
  
  -- Tasks indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_room_id') THEN
    CREATE INDEX idx_tasks_room_id ON tasks(room_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_assignee_id') THEN
    CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
  END IF;
  
  -- Chat messages indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_chat_messages_room_id') THEN
    CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
  END IF;
  
  -- Study sessions indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_study_sessions_room_id') THEN
    CREATE INDEX idx_study_sessions_room_id ON study_sessions(room_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_study_sessions_user_id') THEN
    CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_study_sessions_user_focus') THEN
    CREATE INDEX idx_study_sessions_user_focus ON study_sessions(user_id, focus_time) WHERE focus_time > 0;
  END IF;
END $$;

-- Update existing data to ensure consistency
UPDATE profiles SET rank = 'Beginner' WHERE rank IS NULL;
UPDATE profiles SET total_points = 0 WHERE total_points IS NULL;
UPDATE profiles SET achievements = '{}' WHERE achievements IS NULL;

-- Ensure all rooms have proper codes
UPDATE rooms SET code = generate_room_code() WHERE code IS NULL OR code = '';