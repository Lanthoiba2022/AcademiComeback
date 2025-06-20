-- Enable realtime for all necessary tables
BEGIN;

-- Drop existing publication if it exists
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Create the realtime publication
CREATE PUBLICATION supabase_realtime;

-- Add all tables that need real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE task_user_status;
ALTER PUBLICATION supabase_realtime ADD TABLE task_activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE room_members;
ALTER PUBLICATION supabase_realtime ADD TABLE study_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

COMMIT;

-- Enable Row Level Security and create policies
ALTER TABLE task_user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_user_status
CREATE POLICY "Users can view task status in their rooms" ON task_user_status
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN room_members rm ON t.room_id = rm.room_id
    WHERE t.id = task_user_status.task_id 
    AND rm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own task status" ON task_user_status
FOR ALL USING (user_id = auth.uid());

-- RLS policies for task_activity_log
CREATE POLICY "Users can view activity in their rooms" ON task_activity_log
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN room_members rm ON t.room_id = rm.room_id
    WHERE t.id = task_activity_log.task_id 
    AND rm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert activity logs" ON task_activity_log
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Add unique constraint for task_user_status
ALTER TABLE task_user_status ADD CONSTRAINT task_user_status_unique 
UNIQUE (task_id, user_id);
