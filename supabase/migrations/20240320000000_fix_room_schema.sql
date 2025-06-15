-- Drop existing policies first
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public rooms are viewable by everyone" ON public.rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON public.rooms;
DROP POLICY IF EXISTS "Room admins can update their rooms" ON public.rooms;
DROP POLICY IF EXISTS "Room members are viewable by room members" ON public.room_members;
DROP POLICY IF EXISTS "Users can join rooms" ON public.room_members;
DROP POLICY IF EXISTS "Users can leave rooms" ON public.room_members;
DROP POLICY IF EXISTS "Tasks are viewable by room members" ON public.tasks;
DROP POLICY IF EXISTS "Room members can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Task creators and assignees can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Study sessions are viewable by room members" ON public.study_sessions;
DROP POLICY IF EXISTS "Users can create their own study sessions" ON public.study_sessions;
DROP POLICY IF EXISTS "Users can update their own study sessions" ON public.study_sessions;
DROP POLICY IF EXISTS "Chat messages are viewable by room members" ON public.chat_messages;
DROP POLICY IF EXISTS "Room members can send messages" ON public.chat_messages;

-- Drop existing triggers
DROP TRIGGER IF EXISTS handle_rooms_updated_at ON public.rooms;
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS handle_tasks_updated_at ON public.tasks;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.handle_updated_at();
DROP FUNCTION IF EXISTS public.generate_room_code();

-- Drop existing indexes
DROP INDEX IF EXISTS idx_rooms_admin_id;
DROP INDEX IF EXISTS idx_rooms_code;
DROP INDEX IF EXISTS idx_room_members_room_id;
DROP INDEX IF EXISTS idx_room_members_user_id;
DROP INDEX IF EXISTS idx_tasks_room_id;
DROP INDEX IF EXISTS idx_tasks_assignee_id;
DROP INDEX IF EXISTS idx_study_sessions_room_id;
DROP INDEX IF EXISTS idx_study_sessions_user_id;
DROP INDEX IF EXISTS idx_chat_messages_room_id;
DROP INDEX IF EXISTS idx_chat_messages_user_id;

-- Drop existing tables if they exist (in correct order)
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.study_sessions CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.room_members CASCADE;
DROP TABLE IF EXISTS public.rooms CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text,
  avatar_url text,
  total_points integer DEFAULT 0,
  rank text DEFAULT 'Beginner'::text,
  achievements text[] DEFAULT '{}'::text[],
  university text,
  major text,
  year text,
  location text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create rooms table
CREATE TABLE public.rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL,
  description text NOT NULL,
  tags text[] DEFAULT '{}'::text[],
  admin_id uuid NOT NULL,
  max_members integer DEFAULT 10,
  is_private boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT rooms_pkey PRIMARY KEY (id),
  CONSTRAINT rooms_code_key UNIQUE (code),
  CONSTRAINT rooms_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT rooms_max_members_check CHECK (max_members >= 2 AND max_members <= 50)
);

-- Create room_members table
CREATE TABLE public.room_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  joined_at timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),
  is_online boolean DEFAULT false,
  CONSTRAINT room_members_pkey PRIMARY KEY (id),
  CONSTRAINT room_members_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE,
  CONSTRAINT room_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT room_members_room_user_unique UNIQUE (room_id, user_id)
);

-- Create tasks table
CREATE TABLE public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  title text NOT NULL,
  description text DEFAULT ''::text,
  duration integer DEFAULT 30,
  assignee_id uuid NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'in-progress'::text, 'completed'::text])),
  order_index integer DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT tasks_pkey PRIMARY KEY (id),
  CONSTRAINT tasks_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE,
  CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT tasks_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Create study_sessions table
CREATE TABLE public.study_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  start_time timestamptz DEFAULT now(),
  end_time timestamptz,
  focus_time integer DEFAULT 0,
  completed_tasks integer DEFAULT 0,
  is_active boolean DEFAULT true,
  CONSTRAINT study_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT study_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT study_sessions_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  user_id uuid,
  message text NOT NULL,
  message_type text DEFAULT 'message'::text CHECK (message_type = ANY (ARRAY['message'::text, 'system'::text])),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE,
  CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX idx_rooms_admin_id ON public.rooms(admin_id);
CREATE INDEX idx_rooms_code ON public.rooms(code);
CREATE INDEX idx_room_members_room_id ON public.room_members(room_id);
CREATE INDEX idx_room_members_user_id ON public.room_members(user_id);
CREATE INDEX idx_tasks_room_id ON public.tasks(room_id);
CREATE INDEX idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX idx_study_sessions_room_id ON public.study_sessions(room_id);
CREATE INDEX idx_study_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX idx_chat_messages_room_id ON public.chat_messages(room_id);
CREATE INDEX idx_chat_messages_user_id ON public.chat_messages(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to generate unique room code
CREATE OR REPLACE FUNCTION public.generate_room_code()
RETURNS text AS $$
DECLARE
  new_code text;
  exists_check boolean;
BEGIN
  LOOP
    -- Generate a random 6-character code
    new_code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Check if code exists
    SELECT EXISTS(
      SELECT 1 
      FROM public.rooms 
      WHERE rooms.code = new_code
    ) INTO exists_check;
    
    -- If code doesn't exist, return it
    IF NOT exists_check THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select_policy"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "profiles_insert_policy"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Rooms policies
CREATE POLICY "rooms_select_policy"
  ON public.rooms
  FOR SELECT
  TO authenticated
  USING (
    NOT is_private 
    OR admin_id = auth.uid()
    OR id IN (
      SELECT room_id 
      FROM public.room_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "rooms_insert_policy"
  ON public.rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (admin_id = auth.uid());

CREATE POLICY "rooms_update_policy"
  ON public.rooms
  FOR UPDATE
  TO authenticated
  USING (admin_id = auth.uid())
  WITH CHECK (admin_id = auth.uid());

-- Room members policies
CREATE POLICY "room_members_select_policy"
  ON public.room_members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "room_members_insert_policy"
  ON public.room_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "room_members_update_policy"
  ON public.room_members
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "room_members_delete_policy"
  ON public.room_members
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR room_id IN (
      SELECT id 
      FROM public.rooms 
      WHERE admin_id = auth.uid()
    )
  );

-- Tasks policies
CREATE POLICY "Tasks are viewable by room members"
  ON public.tasks FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM public.room_members WHERE room_id = tasks.room_id
  ));

CREATE POLICY "Room members can create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM public.room_members WHERE room_id = tasks.room_id
  ));

CREATE POLICY "Task creators and assignees can update tasks"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = created_by OR auth.uid() = assignee_id);

-- Study sessions policies
CREATE POLICY "Study sessions are viewable by room members"
  ON public.study_sessions FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM public.room_members WHERE room_id = study_sessions.room_id
  ));

CREATE POLICY "Users can create their own study sessions"
  ON public.study_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study sessions"
  ON public.study_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Chat messages are viewable by room members"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM public.room_members WHERE room_id = chat_messages.room_id
  ));

CREATE POLICY "Room members can send messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM public.room_members WHERE room_id = chat_messages.room_id
  )); 