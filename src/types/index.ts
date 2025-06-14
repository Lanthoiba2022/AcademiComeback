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