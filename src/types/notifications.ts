export interface Notification {
  id: string
  type: 'achievement' | 'room_activity' | 'quiz_complete' | 'reminder' | 'system' | 'social'
  title: string
  message: string
  icon?: string
  userId: string
  isRead: boolean
  priority: 'low' | 'medium' | 'high'
  actionUrl?: string
  actionText?: string
  metadata?: any
  createdAt: string
  expiresAt?: string
}

export interface NotificationSettings {
  userId: string
  emailNotifications: {
    achievements: boolean
    roomActivity: boolean
    quizReminders: boolean
    weeklyDigest: boolean
    systemUpdates: boolean
  }
  pushNotifications: {
    achievements: boolean
    roomActivity: boolean
    quizReminders: boolean
    studyReminders: boolean
    socialActivity: boolean
  }
  inAppNotifications: {
    achievements: boolean
    roomActivity: boolean
    quizComplete: boolean
    studyReminders: boolean
    socialActivity: boolean
  }
  quietHours: {
    enabled: boolean
    startTime: string
    endTime: string
  }
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly'
}