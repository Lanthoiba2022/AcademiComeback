export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  totalPoints: number
  rank: string
  achievements: string[]
  createdAt: string
  university?: string
  major?: string
  year?: string
  location?: string
  bio?: string
}

export interface Room {
  id: string
  name: string
  code: string
  description: string
  tags: string[]
  members: User[]
  adminId: string
  maxMembers: number
  isPrivate: boolean
  isActive: boolean
  createdAt: string
  lastActivity: string
}

export interface RoomFilters {
  search: string
  tags: string[]
  isActive?: boolean
  maxMembers?: number
}

export interface Task {
  id: string
  title: string
  description: string
  duration: number // in minutes
  assigneeId: string
  status: TaskStatus
  priority: TaskPriority
  createdAt: string
  order: number
  roomId: string
  createdBy: string
  creatorName: string
}

export interface ChatMessage {
  id: string
  userId: string | null
  userName: string
  userAvatar?: string
  message: string
  timestamp: string
  type: 'message' | 'system'
  roomId: string
}

export interface StudySession {
  id: string
  roomId: string
  startTime: string
  endTime?: string
  participants: User[]
  totalFocusTime: number // in minutes
  completedTasks: number
  isActive: boolean
}

// Database types for Supabase
export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  total_points: number
  rank: string
  achievements: string[]
  university: string | null
  major: string | null
  year: string | null
  location: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export interface RoomData {
  id: string
  name: string
  code: string
  description: string
  tags: string[]
  admin_id: string
  max_members: number
  is_private: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  admin?: Profile
  members?: Array<{
    user: Profile
    is_online: boolean
    last_seen: string
  }>
}

export interface TaskData {
  id: string
  room_id: string
  title: string
  description: string
  duration: number
  assignee_id: string
  status: 'pending' | 'in-progress' | 'completed'
  order_index: number
  created_by: string
  created_at: string
  updated_at: string
  assignee?: Profile
  creator?: Profile
}

export interface ChatMessageData {
  id: string
  room_id: string
  user_id: string | null
  message: string
  message_type: 'message' | 'system'
  created_at: string
  user?: Profile
}

export interface StudySessionData {
  id: string
  room_id: string
  user_id: string
  start_time: string
  end_time: string | null
  focus_time: number
  completed_tasks: number
  is_active: boolean
}

export type TaskStatus = 'Todo' | 'In Progress' | 'In Review' | 'Completed';
export type TaskPriority = 'High' | 'Medium' | 'Low';

export interface TaskUserStatus {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  status: TaskStatus;
  updatedAt: string; // YYYY-MM-DD HH:MM:SS
}

export interface TaskActivityLog {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string; // YYYY-MM-DD HH:MM:SS
}