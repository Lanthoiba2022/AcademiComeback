import { useState, useEffect } from 'react'
import { Sidebar } from '../components/dashboard/Sidebar'
import { AnalyticsDashboard } from '../components/analytics/AnalyticsDashboard'
import { StudyAnalytics } from '../types/analytics'

// Mock data generator
const generateMockAnalytics = (): StudyAnalytics => {
  const today = new Date()
  const dailyStats = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    return {
      date: date.toISOString().split('T')[0],
      focusTime: Math.floor(Math.random() * 180) + 30, // 30-210 minutes
      tasksCompleted: Math.floor(Math.random() * 8) + 1,
      quizzesCompleted: Math.floor(Math.random() * 3),
      pointsEarned: Math.floor(Math.random() * 150) + 25,
      sessionsCount: Math.floor(Math.random() * 4) + 1,
      averageSessionLength: Math.floor(Math.random() * 60) + 30,
      topTopics: ['javascript', 'mathematics', 'science'].slice(0, Math.floor(Math.random() * 3) + 1)
    }
  }).reverse()

  return {
    dailyStats,
    weeklyStats: [],
    monthlyStats: [],
    topicMastery: [
      {
        topic: 'javascript',
        masteryLevel: 85,
        timeSpent: 1200,
        tasksCompleted: 45,
        quizAverage: 88,
        lastStudied: today.toISOString(),
        trend: 'improving',
        nextMilestone: 'Complete 50 tasks'
      },
      {
        topic: 'mathematics',
        masteryLevel: 72,
        timeSpent: 980,
        tasksCompleted: 32,
        quizAverage: 75,
        lastStudied: today.toISOString(),
        trend: 'stable',
        nextMilestone: 'Achieve 80% mastery'
      },
      {
        topic: 'science',
        masteryLevel: 65,
        timeSpent: 750,
        tasksCompleted: 28,
        quizAverage: 70,
        lastStudied: today.toISOString(),
        trend: 'improving',
        nextMilestone: 'Complete 30 tasks'
      }
    ],
    quizPerformance: [
      {
        topic: 'javascript',
        totalQuizzes: 15,
        averageScore: 88,
        bestScore: 95,
        timeSpent: 450,
        difficultyBreakdown: {
          beginner: { count: 5, average: 92 },
          intermediate: { count: 8, average: 87 },
          advanced: { count: 2, average: 82 }
        },
        recentTrend: 'improving'
      },
      {
        topic: 'mathematics',
        totalQuizzes: 12,
        averageScore: 75,
        bestScore: 89,
        timeSpent: 380,
        difficultyBreakdown: {
          beginner: { count: 4, average: 85 },
          intermediate: { count: 6, average: 72 },
          advanced: { count: 2, average: 68 }
        },
        recentTrend: 'stable'
      }
    ],
    collaborationStats: {
      roomsJoined: 8,
      roomsCreated: 3,
      helpGiven: 15,
      helpReceived: 8,
      messagesExchanged: 245,
      favoriteCollaborators: ['Alice', 'Bob', 'Charlie'],
      teamworkScore: 85
    },
    goals: [
      {
        id: '1',
        title: 'Daily Focus Goal',
        description: 'Study for at least 2 hours every day',
        type: 'daily',
        target: 120,
        current: 95,
        unit: 'minutes',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        isCompleted: false,
        createdAt: today.toISOString()
      },
      {
        id: '2',
        title: 'Weekly Quiz Challenge',
        description: 'Complete 5 quizzes this week',
        type: 'weekly',
        target: 5,
        current: 3,
        unit: 'quizzes',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isCompleted: false,
        createdAt: today.toISOString()
      }
    ],
    streaks: {
      currentStreak: 7,
      longestStreak: 15,
      streakType: 'daily',
      lastStudyDate: today.toISOString(),
      streakHistory: []
    },
    insights: [
      {
        id: '1',
        type: 'productivity',
        title: 'Peak Performance Time',
        description: 'You study most effectively between 9 AM and 11 AM. Consider scheduling important tasks during this time.',
        actionable: true,
        priority: 'medium',
        createdAt: today.toISOString()
      },
      {
        id: '2',
        type: 'performance',
        title: 'JavaScript Mastery Progress',
        description: 'You\'re 85% of the way to JavaScript mastery! Complete 5 more tasks to reach the next milestone.',
        actionable: true,
        priority: 'high',
        createdAt: today.toISOString()
      },
      {
        id: '3',
        type: 'habit',
        title: 'Consistent Study Streak',
        description: 'Great job maintaining a 7-day study streak! Keep it up to reach your goal of 14 days.',
        actionable: false,
        priority: 'low',
        createdAt: today.toISOString()
      }
    ]
  }
}

export const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState<StudyAnalytics | null>(null)
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month')

  useEffect(() => {
    // In a real app, this would fetch from the API
    setAnalytics(generateMockAnalytics())
  }, [])

  if (!analytics) {
    return (
      <div className="min-h-screen bg-hero-gradient">
        <Sidebar />
        <div className="lg:ml-64 p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-500 border-t-transparent"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Sidebar />
      <div className="lg:ml-64 p-4 lg:p-8">
        <AnalyticsDashboard
          analytics={analytics}
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
        />
      </div>
    </div>
  )
}