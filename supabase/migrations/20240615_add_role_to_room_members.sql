-- Add 'role' column to room_members
ALTER TABLE room_members ADD COLUMN role text DEFAULT 'member';

-- Set the admin as 'admin' for each room
UPDATE room_members
SET role = 'admin'
FROM rooms
WHERE room_members.room_id = rooms.id
  AND room_members.user_id = rooms.admin_id;

-- Ensure all other members are 'member'
UPDATE room_members
SET role = 'member'
WHERE role IS NULL OR role <> 'admin';

-- Add a check constraint for valid roles
ALTER TABLE room_members ADD CONSTRAINT room_members_role_check CHECK (role IN ('admin', 'member'));
