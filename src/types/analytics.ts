export interface StudyAnalytics {
  dailyStats: DailyStudyStats[]
  weeklyStats: WeeklyStudyStats[]
  monthlyStats: MonthlyStudyStats[]
  topicMastery: TopicMasteryData[]
  quizPerformance: QuizPerformanceData[]
  collaborationStats: CollaborationStats
  goals: StudyGoal[]
  streaks: StreakData
  insights: StudyInsight[]
}

export interface DailyStudyStats {
  date: string
  focusTime: number // minutes
  tasksCompleted: number
  quizzesCompleted: number
  pointsEarned: number
  sessionsCount: number
  averageSessionLength: number
  topTopics: string[]
}

export interface WeeklyStudyStats {
  weekStart: string
  weekEnd: string
  totalFocusTime: number
  totalTasks: number
  totalQuizzes: number
  averageScore: number
  mostProductiveDay: string
  topTopics: string[]
  weeklyGoalProgress: number
}

export interface MonthlyStudyStats {
  month: string
  year: number
  totalFocusTime: number
  totalTasks: number
  totalQuizzes: number
  averageScore: number
  rankProgress: number
  achievementsUnlocked: number
  topTopics: string[]
}

export interface TopicMasteryData {
  topic: string
  masteryLevel: number // 0-100
  timeSpent: number
  tasksCompleted: number
  quizAverage: number
  lastStudied: string
  trend: 'improving' | 'stable' | 'declining'
  nextMilestone: string
}

export interface QuizPerformanceData {
  topic: string
  totalQuizzes: number
  averageScore: number
  bestScore: number
  timeSpent: number
  difficultyBreakdown: {
    beginner: { count: number; average: number }
    intermediate: { count: number; average: number }
    advanced: { count: number; average: number }
  }
  recentTrend: 'improving' | 'stable' | 'declining'
}

export interface CollaborationStats {
  roomsJoined: number
  roomsCreated: number
  helpGiven: number
  helpReceived: number
  messagesExchanged: number
  favoriteCollaborators: string[]
  teamworkScore: number
}

export interface StudyGoal {
  id: string
  title: string
  description: string
  type: 'daily' | 'weekly' | 'monthly' | 'custom'
  target: number
  current: number
  unit: 'minutes' | 'tasks' | 'quizzes' | 'points'
  deadline: string
  isCompleted: boolean
  createdAt: string
}

export interface StreakData {
  currentStreak: number
  longestStreak: number
  streakType: 'daily' | 'weekly'
  lastStudyDate: string
  streakHistory: { date: string; maintained: boolean }[]
}

export interface StudyInsight {
  id: string
  type: 'productivity' | 'performance' | 'habit' | 'recommendation'
  title: string
  description: string
  actionable: boolean
  priority: 'low' | 'medium' | 'high'
  createdAt: string
}