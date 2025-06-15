export interface GamificationStats {
  totalPoints: number
  availablePoints: number
  lifetimePoints: number
  currentRank: Rank
  nextRank: Rank | null
  progressToNextRank: number
  achievements: Achievement[]
  recentEarnings: PointEarning[]
  studyStreak: number
  tasksCompleted: number
  quizzesCompleted: number
  helpGiven: number
}

export interface Rank {
  id: string
  name: string
  minPoints: number
  maxPoints: number
  color: string
  icon: string
  perks: string[]
  badge: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'study' | 'social' | 'streak' | 'quiz' | 'special'
  points: number
  unlockedAt?: string
  progress?: number
  maxProgress?: number
  isUnlocked: boolean
}

export interface PointEarning {
  id: string
  type: 'task_complete' | 'quiz_complete' | 'daily_streak' | 'help_given' | 'study_plan' | 'achievement'
  points: number
  description: string
  timestamp: string
  metadata?: any
}

export interface Reward {
  id: string
  name: string
  description: string
  cost: number
  icon: string
  category: 'snacks' | 'treats' | 'special'
  isAvailable: boolean
}

export interface RedeemedReward {
  id: string
  rewardId: string
  reward: Reward
  redeemedAt: string
  pointsSpent: number
}

export interface LeaderboardEntry {
  userId: string
  userName: string
  userAvatar?: string
  rank: Rank
  totalPoints: number
  weeklyPoints: number
  position: number
}