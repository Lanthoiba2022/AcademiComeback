/*
  # Fix database policies and functionality - Final Version

  1. Database Functions
    - Room code generation function
    - Update timestamp function  
    - User rank calculation function
    - User study statistics function

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

  5. Data Consistency
    - Fix array handling for achievements
    - Ensure proper default values
*/

-- Step 1: Drop all triggers first to remove dependencies
DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS update_rank_trigger ON profiles;

-- Step 2: Now drop functions safely
DROP FUNCTION IF EXISTS get_user_study_stats(uuid);
DROP FUNCTION IF EXISTS generate_room_code();
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS update_user_rank();

-- Step 3: Drop all existing problematic policies that cause recursion
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
DROP POLICY IF EXISTS "view_accessible_rooms_v2" ON rooms;
DROP POLICY IF EXISTS "view_all_room_members_v2" ON room_members;
DROP POLICY IF EXISTS "remove_members_v2" ON room_members;
DROP POLICY IF EXISTS "view_all_tasks_v2" ON tasks;
DROP POLICY IF EXISTS "create_tasks_v2" ON tasks;
DROP POLICY IF EXISTS "view_all_messages_v2" ON chat_messages;
DROP POLICY IF EXISTS "send_messages_v2" ON chat_messages;
DROP POLICY IF EXISTS "rooms_select_policy" ON rooms;
DROP POLICY IF EXISTS "room_members_select_policy" ON room_members;
DROP POLICY IF EXISTS "room_members_delete_policy" ON room_members;
DROP POLICY IF EXISTS "tasks_select_policy" ON tasks;
DROP POLICY IF EXISTS "tasks_insert_policy" ON tasks;
DROP POLICY IF EXISTS "chat_messages_select_policy" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert_policy" ON chat_messages;

-- Step 4: Create functions
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  code text;
  exists_check boolean;
  attempts integer := 0;
  max_attempts integer := 100;
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
    
    -- Prevent infinite loop
    attempts := attempts + 1;
    IF attempts >= max_attempts THEN
      -- Fallback to timestamp-based code
      code := upper(substring(md5(extract(epoch from now())::text || random()::text) from 1 for 6));
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

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
    'active_sessions', COUNT(*) FILTER (WHERE is_active = true)
  )
  INTO result
  FROM study_sessions
  WHERE user_id = user_uuid;
  
  RETURN result;
END;
$$;

-- Step 5: Recreate triggers
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rank_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.total_points IS DISTINCT FROM NEW.total_points)
  EXECUTE FUNCTION update_user_rank();

-- Step 6: Create simplified, non-recursive policies

-- Rooms policies
CREATE POLICY "rooms_select_final"
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
CREATE POLICY "room_members_select_final"
  ON room_members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "room_members_delete_final"
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
CREATE POLICY "tasks_select_final"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "tasks_insert_final"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Chat messages policies (simplified)
CREATE POLICY "chat_messages_select_final"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "chat_messages_insert_final"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() 
    OR user_id IS NULL
  );

-- Step 7: Add performance indexes conditionally
DO $$
BEGIN
  -- Rooms indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_rooms_admin_id_final') THEN
    CREATE INDEX idx_rooms_admin_id_final ON rooms(admin_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_rooms_code_final') THEN
    CREATE INDEX idx_rooms_code_final ON rooms(code);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_rooms_admin_private_final') THEN
    CREATE INDEX idx_rooms_admin_private_final ON rooms(admin_id, is_private);
  END IF;
  
  -- Room members indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_room_members_room_id_final') THEN
    CREATE INDEX idx_room_members_room_id_final ON room_members(room_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_room_members_user_id_final') THEN
    CREATE INDEX idx_room_members_user_id_final ON room_members(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_room_members_composite_final') THEN
    CREATE INDEX idx_room_members_composite_final ON room_members(room_id, user_id);
  END IF;
  
  -- Tasks indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_room_id_final') THEN
    CREATE INDEX idx_tasks_room_id_final ON tasks(room_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_assignee_id_final') THEN
    CREATE INDEX idx_tasks_assignee_id_final ON tasks(assignee_id);
  END IF;
  
  -- Chat messages indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_chat_messages_room_id_final') THEN
    CREATE INDEX idx_chat_messages_room_id_final ON chat_messages(room_id);
  END IF;
  
  -- Study sessions indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_study_sessions_room_id_final') THEN
    CREATE INDEX idx_study_sessions_room_id_final ON study_sessions(room_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_study_sessions_user_id_final') THEN
    CREATE INDEX idx_study_sessions_user_id_final ON study_sessions(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_study_sessions_user_focus_final') THEN
    CREATE INDEX idx_study_sessions_user_focus_final ON study_sessions(user_id, focus_time) WHERE focus_time > 0;
  END IF;
END $$;

-- Step 8: Update existing data to ensure consistency
-- Fix profiles data with proper array handling
UPDATE profiles SET rank = 'Beginner' WHERE rank IS NULL OR rank = '';
UPDATE profiles SET total_points = 0 WHERE total_points IS NULL;

-- Fix achievements array - properly handle NULL and empty arrays
UPDATE profiles 
SET achievements = '{}'::text[] 
WHERE achievements IS NULL OR array_length(achievements, 1) IS NULL;

-- Step 9: Ensure all rooms have proper codes
DO $$
DECLARE
  room_record RECORD;
  new_code text;
BEGIN
  FOR room_record IN SELECT id FROM rooms WHERE code IS NULL OR code = '' LOOP
    new_code := generate_room_code();
    UPDATE rooms SET code = new_code WHERE id = room_record.id;
  END LOOP;
END $$;

-- Step 10: Ensure all tables have proper updated_at values
UPDATE rooms SET updated_at = now() WHERE updated_at IS NULL;
UPDATE tasks SET updated_at = now() WHERE updated_at IS NULL;
UPDATE profiles SET updated_at = now() WHERE updated_at IS NULL;