export interface ChatMessage {
  id: string
  roomId: string
  userId: string
  userName: string
  userAvatar?: string
  message: string
  timestamp: string
  type: 'message' | 'system' | 'file' | 'image' | 'audio' | 'video'
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'error'
  replyTo?: {
    id: string
    userName: string
    message: string
  }
  reactions: MessageReaction[]
  mentions: string[]
  attachments?: ChatAttachment[]
  isEdited: boolean
  editedAt?: string
  encrypted: boolean
}

export interface MessageReaction {
  emoji: string
  userId: string
  userName: string
  timestamp: string
}

export interface ChatAttachment {
  id: string
  name: string
  url: string
  type: 'image' | 'file' | 'audio' | 'video'
  size: number
  mimeType: string
  thumbnail?: string
}

export interface ChatRoom {
  id: string
  name: string
  description: string
  type: 'public' | 'private' | 'direct'
  members: ChatMember[]
  admins: string[]
  moderators: string[]
  bannedUsers: string[]
  maxMembers: number
  isActive: boolean
  createdAt: string
  lastActivity: string
  settings: RoomSettings
}

export interface ChatMember {
  id: string
  name: string
  avatar?: string
  role: 'admin' | 'moderator' | 'member'
  status: 'online' | 'offline' | 'away' | 'busy'
  lastSeen: string
  isTyping: boolean
  joinedAt: string
  totalMessages: number
  totalReactions: number
}

export interface RoomSettings {
  allowFileSharing: boolean
  allowEmojis: boolean
  allowMentions: boolean
  allowReactions: boolean
  allowThreads: boolean
  maxMessageLength: number
  rateLimitPerMinute: number
  profanityFilter: boolean
  encryptionEnabled: boolean
  pushNotifications: boolean
  soundNotifications: boolean
  theme: 'light' | 'dark' | 'auto'
}

export interface TypingIndicator {
  userId: string
  userName: string
  timestamp: string
  isTyping: boolean
}

export interface ChatNotification {
  id: string
  type: 'message' | 'mention' | 'reaction' | 'system'
  title: string
  body: string
  data?: any
  timestamp: string
  read: boolean
}

export interface ChatSearchResult {
  message: ChatMessage
  highlight: string
  context: string
}

export interface ChatStats {
  totalMessages: number
  totalReactions: number
  totalFiles: number
  activeMembers: number
  averageResponseTime: number
  peakActivityTime: string
}

export interface ChatExport {
  roomId: string
  startDate: string
  endDate: string
  format: 'json' | 'csv' | 'txt'
  includeMetadata: boolean
  includeAttachments: boolean
}

export interface ChatFilter {
  search: string
  dateRange: {
    start: string
    end: string
  }
  messageType: string[]
  userId?: string
  hasReactions: boolean
  hasAttachments: boolean
  isEdited: boolean
}

export interface ChatThread {
  id: string
  parentMessageId: string
  messages: ChatMessage[]
  participants: string[]
  createdAt: string
  lastActivity: string
}

export interface UserPresence {
  userId: string
  status: 'online' | 'offline' | 'away' | 'busy'
  lastSeen: string
  currentRoom?: string
  customStatus?: string
}

export interface ChatError {
  code: string
  message: string
  details?: any
  timestamp: string
}

export interface ChatConnection {
  id: string
  status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting'
  lastConnected: string
  reconnectAttempts: number
  maxReconnectAttempts: number
}

export interface ChatRateLimit {
  userId: string
  messageCount: number
  lastMessageTime: string
  isLimited: boolean
  resetTime: string
}

export interface ChatModeration {
  userId: string
  action: 'warn' | 'mute' | 'kick' | 'ban'
  reason: string
  moderatorId: string
  duration?: number // in minutes, 0 for permanent
  timestamp: string
  expiresAt?: string
}

export interface ChatAnalytics {
  roomId: string
  period: 'day' | 'week' | 'month' | 'year'
  metrics: {
    messagesSent: number
    reactionsGiven: number
    filesShared: number
    activeUsers: number
    averageSessionLength: number
    peakActivityHour: number
  }
  topUsers: Array<{
    userId: string
    userName: string
    messagesSent: number
    reactionsGiven: number
  }>
  popularEmojis: Array<{
    emoji: string
    count: number
  }>
} 