/*
  # StudySync Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, references auth.users)
      - `full_name` (text)
      - `avatar_url` (text, optional)
      - `total_points` (integer, default 0)
      - `rank` (text, default 'Beginner')
      - `achievements` (text array, default empty)
      - `university` (text, optional)
      - `major` (text, optional)
      - `year` (text, optional)
      - `location` (text, optional)
      - `bio` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `rooms`
      - `id` (uuid, primary key)
      - `name` (text)
      - `code` (text, unique, 6 characters)
      - `description` (text)
      - `tags` (text array)
      - `admin_id` (uuid, references profiles)
      - `max_members` (integer, default 10)
      - `is_private` (boolean, default false)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `room_members`
      - `id` (uuid, primary key)
      - `room_id` (uuid, references rooms)
      - `user_id` (uuid, references profiles)
      - `joined_at` (timestamp)
      - `last_seen` (timestamp)
      - `is_online` (boolean, default false)

    - `tasks`
      - `id` (uuid, primary key)
      - `room_id` (uuid, references rooms)
      - `title` (text)
      - `description` (text, optional)
      - `duration` (integer, minutes)
      - `assignee_id` (uuid, references profiles)
      - `status` (text, check constraint)
      - `order_index` (integer)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `chat_messages`
      - `id` (uuid, primary key)
      - `room_id` (uuid, references rooms)
      - `user_id` (uuid, references profiles)
      - `message` (text)
      - `message_type` (text, default 'message')
      - `created_at` (timestamp)

    - `study_sessions`
      - `id` (uuid, primary key)
      - `room_id` (uuid, references rooms)
      - `user_id` (uuid, references profiles)
      - `start_time` (timestamp)
      - `end_time` (timestamp, optional)
      - `focus_time` (integer, minutes, default 0)
      - `completed_tasks` (integer, default 0)
      - `is_active` (boolean, default true)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for room members to access room data
    - Add policies for public room discovery

  3. Functions
    - Function to generate unique room codes
    - Function to update user points and rank
    - Function to handle room member management
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  avatar_url text,
  total_points integer DEFAULT 0,
  rank text DEFAULT 'Beginner',
  achievements text[] DEFAULT '{}',
  university text,
  major text,
  year text,
  location text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  description text NOT NULL,
  tags text[] DEFAULT '{}',
  admin_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  max_members integer DEFAULT 10,
  is_private boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create room_members table
CREATE TABLE IF NOT EXISTS room_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),
  is_online boolean DEFAULT false,
  UNIQUE(room_id, user_id)
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  duration integer DEFAULT 30,
  assignee_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed')),
  order_index integer DEFAULT 0,
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  message_type text DEFAULT 'message' CHECK (message_type IN ('message', 'system')),
  created_at timestamptz DEFAULT now()
);

-- Create study_sessions table
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  start_time timestamptz DEFAULT now(),
  end_time timestamptz,
  focus_time integer DEFAULT 0,
  completed_tasks integer DEFAULT 0,
  is_active boolean DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Rooms policies
CREATE POLICY "Users can view public rooms"
  ON rooms FOR SELECT
  TO authenticated
  USING (NOT is_private OR admin_id = auth.uid() OR EXISTS (
    SELECT 1 FROM room_members 
    WHERE room_id = rooms.id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create rooms"
  ON rooms FOR INSERT
  TO authenticated
  WITH CHECK (admin_id = auth.uid());

CREATE POLICY "Room admins can update rooms"
  ON rooms FOR UPDATE
  TO authenticated
  USING (admin_id = auth.uid());

CREATE POLICY "Room admins can delete rooms"
  ON rooms FOR DELETE
  TO authenticated
  USING (admin_id = auth.uid());

-- Room members policies
CREATE POLICY "Users can view room members for accessible rooms"
  ON room_members FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM rooms 
    WHERE rooms.id = room_id 
    AND (NOT is_private OR admin_id = auth.uid() OR EXISTS (
      SELECT 1 FROM room_members rm2 
      WHERE rm2.room_id = rooms.id AND rm2.user_id = auth.uid()
    ))
  ));

CREATE POLICY "Users can join rooms"
  ON room_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave rooms"
  ON room_members FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM rooms 
    WHERE rooms.id = room_id AND admin_id = auth.uid()
  ));

CREATE POLICY "Users can update their membership status"
  ON room_members FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Tasks policies
CREATE POLICY "Room members can view tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM room_members 
    WHERE room_id = tasks.room_id AND user_id = auth.uid()
  ));

CREATE POLICY "Room members can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM room_members 
    WHERE room_id = tasks.room_id AND user_id = auth.uid()
  ) AND created_by = auth.uid());

CREATE POLICY "Task creators and assignees can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR assignee_id = auth.uid() OR EXISTS (
    SELECT 1 FROM rooms 
    WHERE rooms.id = room_id AND admin_id = auth.uid()
  ));

CREATE POLICY "Task creators and room admins can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM rooms 
    WHERE rooms.id = room_id AND admin_id = auth.uid()
  ));

-- Chat messages policies
CREATE POLICY "Room members can view messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM room_members 
    WHERE room_id = chat_messages.room_id AND user_id = auth.uid()
  ));

CREATE POLICY "Room members can send messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM room_members 
    WHERE room_id = chat_messages.room_id AND user_id = auth.uid()
  ) AND (user_id = auth.uid() OR user_id IS NULL));

-- Study sessions policies
CREATE POLICY "Users can view their own sessions"
  ON study_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own sessions"
  ON study_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sessions"
  ON study_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Function to generate unique room code
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  
  -- Check if code already exists
  WHILE EXISTS (SELECT 1 FROM rooms WHERE code = result) LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to update user rank based on points
CREATE OR REPLACE FUNCTION update_user_rank()
RETURNS trigger AS $$
BEGIN
  NEW.rank := CASE
    WHEN NEW.total_points >= 5000 THEN 'Master'
    WHEN NEW.total_points >= 1500 THEN 'Expert'
    WHEN NEW.total_points >= 500 THEN 'Scholar'
    WHEN NEW.total_points >= 100 THEN 'Student'
    ELSE 'Beginner'
  END;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update rank when points change
CREATE TRIGGER update_rank_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.total_points IS DISTINCT FROM NEW.total_points)
  EXECUTE FUNCTION update_user_rank();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_admin_id ON rooms(admin_id);
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_room_id ON tasks(room_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_room_id ON study_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);