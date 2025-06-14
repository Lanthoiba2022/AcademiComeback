export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  totalPoints: number
  rank: string
  achievements: string[]
  createdAt: string
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
  status: 'pending' | 'in-progress' | 'completed'
  createdAt: string
  order: number
}

export interface ChatMessage {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  message: string
  timestamp: string
  type: 'message' | 'system'
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