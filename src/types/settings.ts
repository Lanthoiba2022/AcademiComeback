export interface UserSettings {
  userId: string
  theme: ThemeSettings
  notifications: NotificationSettings
  privacy: PrivacySettings
  study: StudySettings
  accessibility: AccessibilitySettings
  account: AccountSettings
  updatedAt: string
}

export interface ThemeSettings {
  mode: 'light' | 'dark' | 'auto'
  primaryColor: string
  accentColor: string
  fontSize: 'small' | 'medium' | 'large'
  reducedMotion: boolean
  highContrast: boolean
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private'
  showOnlineStatus: boolean
  showStudyStats: boolean
  allowDirectMessages: boolean
  showInLeaderboard: boolean
  dataSharing: boolean
}

export interface StudySettings {
  defaultSessionLength: number
  breakReminders: boolean
  focusMode: boolean
  autoStartTimer: boolean
  soundEffects: boolean
  backgroundMusic: boolean
  pomodoroSettings: {
    workDuration: number
    shortBreak: number
    longBreak: number
    cyclesBeforeLongBreak: number
  }
  goals: {
    dailyFocusTime: number
    weeklyQuizzes: number
    monthlyPoints: number
  }
}

export interface AccessibilitySettings {
  screenReader: boolean
  keyboardNavigation: boolean
  highContrast: boolean
  largeText: boolean
  reducedMotion: boolean
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'
  voiceCommands: boolean
}

export interface AccountSettings {
  twoFactorAuth: boolean
  sessionTimeout: number
  dataRetention: number
  exportData: boolean
  deleteAccount: boolean
}