-- Enable RLS for tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Allow only task creators or room admins to DELETE tasks
CREATE POLICY "Admins or creators can delete tasks"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM room_members
      WHERE room_id = tasks.room_id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- Allow only task creators or room admins to UPDATE tasks
CREATE POLICY "Admins or creators can update tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM room_members
      WHERE room_id = tasks.room_id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- Allow any room member to SELECT tasks in their room
CREATE POLICY "Room members can select tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM room_members
      WHERE room_id = tasks.room_id
        AND user_id = auth.uid()
    )
  );

-- Allow any room member to INSERT tasks
CREATE POLICY "Room members can insert tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM room_members
      WHERE room_id = tasks.room_id
        AND user_id = auth.uid()
    )
  );

-- Enable RLS for user_task_status
ALTER TABLE user_task_status ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own task status
CREATE POLICY "Users can manage their own task status"
  ON user_task_status
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid()); 