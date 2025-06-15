import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { 
  GamificationStats, 
  Achievement, 
  PointEarning, 
  Reward, 
  RedeemedReward,
  LeaderboardEntry 
} from '../types/gamification'
import { RANKS, ACHIEVEMENTS, REWARDS, getPointsForTaskCompletion, getPointsForQuizScore } from '../data/gamificationData'

export const useGamification = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<GamificationStats | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS)
  const [redeemedRewards, setRedeemedRewards] = useState<RedeemedReward[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [pendingNotification, setPendingNotification] = useState<{
    points: number
    reason: string
  } | null>(null)
  const [pendingAchievement, setPendingAchievement] = useState<Achievement | null>(null)

  // Initialize gamification data
  useEffect(() => {
    if (user) {
      loadGamificationData()
    }
  }, [user])

  const loadGamificationData = async () => {
    if (!user) return

    // In a real app, this would load from the database
    // For now, we'll use localStorage for persistence
    const savedStats = localStorage.getItem(`gamification_${user.id}`)
    const savedAchievements = localStorage.getItem(`achievements_${user.id}`)
    const savedRewards = localStorage.getItem(`redeemed_rewards_${user.id}`)

    if (savedStats) {
      setStats(JSON.parse(savedStats))
    } else {
      // Initialize new user stats
      const initialStats: GamificationStats = {
        totalPoints: 0,
        availablePoints: 0,
        lifetimePoints: 0,
        currentRank: RANKS[0],
        nextRank: RANKS[1],
        progressToNextRank: 0,
        achievements: [],
        recentEarnings: [],
        studyStreak: 0,
        tasksCompleted: 0,
        quizzesCompleted: 0,
        helpGiven: 0
      }
      setStats(initialStats)
      localStorage.setItem(`gamification_${user.id}`, JSON.stringify(initialStats))
    }

    if (savedAchievements) {
      setAchievements(JSON.parse(savedAchievements))
    }

    if (savedRewards) {
      setRedeemedRewards(JSON.parse(savedRewards))
    }

    // Load leaderboard (mock data for now)
    generateMockLeaderboard()
  }

  const generateMockLeaderboard = () => {
    const mockEntries: LeaderboardEntry[] = [
      {
        userId: 'user1',
        userName: 'Alex Chen',
        userAvatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
        rank: RANKS[3],
        totalPoints: 2850,
        weeklyPoints: 450,
        position: 1
      },
      {
        userId: 'user2',
        userName: 'Sarah Johnson',
        userAvatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
        rank: RANKS[2],
        totalPoints: 2100,
        weeklyPoints: 380,
        position: 2
      },
      {
        userId: 'user3',
        userName: 'Mike Rodriguez',
        rank: RANKS[2],
        totalPoints: 1950,
        weeklyPoints: 320,
        position: 3
      }
    ]

    // Add current user if they have stats
    if (user && stats) {
      const userEntry: LeaderboardEntry = {
        userId: user.id,
        userName: user.user_metadata?.full_name || 'You',
        userAvatar: user.user_metadata?.avatar_url,
        rank: stats.currentRank,
        totalPoints: stats.totalPoints,
        weeklyPoints: Math.floor(stats.totalPoints * 0.2), // Mock weekly points
        position: 4
      }
      mockEntries.push(userEntry)
    }

    setLeaderboard(mockEntries)
  }

  const awardPoints = useCallback((points: number, reason: string, type: PointEarning['type'], metadata?: any) => {
    if (!user || !stats) return

    const earning: PointEarning = {
      id: Date.now().toString(),
      type,
      points,
      description: reason,
      timestamp: new Date().toISOString(),
      metadata
    }

    const newStats = {
      ...stats,
      totalPoints: stats.totalPoints + points,
      availablePoints: stats.availablePoints + points,
      lifetimePoints: stats.lifetimePoints + points,
      recentEarnings: [earning, ...stats.recentEarnings.slice(0, 9)] // Keep last 10
    }

    // Update rank if necessary
    const newRank = RANKS.find(rank => 
      newStats.totalPoints >= rank.minPoints && newStats.totalPoints <= rank.maxPoints
    )
    if (newRank && newRank.id !== stats.currentRank.id) {
      newStats.currentRank = newRank
      const currentRankIndex = RANKS.findIndex(r => r.id === newRank.id)
      newStats.nextRank = RANKS[currentRankIndex + 1] || null
    }

    // Calculate progress to next rank
    if (newStats.nextRank) {
      const progress = ((newStats.totalPoints - newStats.currentRank.minPoints) / 
                       (newStats.nextRank.minPoints - newStats.currentRank.minPoints)) * 100
      newStats.progressToNextRank = Math.min(progress, 100)
    } else {
      newStats.progressToNextRank = 100
    }

    setStats(newStats)
    localStorage.setItem(`gamification_${user.id}`, JSON.stringify(newStats))

    // Show notification
    setPendingNotification({ points, reason })

    // Check for new achievements
    checkAchievements(newStats, earning)
  }, [user, stats])

  const checkAchievements = (newStats: GamificationStats, earning: PointEarning) => {
    if (!user) return

    const updatedAchievements = [...achievements]
    let hasNewAchievement = false

    updatedAchievements.forEach(achievement => {
      if (achievement.isUnlocked) return

      let shouldUnlock = false
      let newProgress = achievement.progress || 0

      switch (achievement.id) {
        case 'first_task':
          if (earning.type === 'task_complete') {
            shouldUnlock = true
          }
          break
        case 'task_master':
          if (earning.type === 'task_complete') {
            newProgress = newStats.tasksCompleted
            shouldUnlock = newProgress >= 50
          }
          break
        case 'first_quiz':
          if (earning.type === 'quiz_complete') {
            shouldUnlock = true
          }
          break
        case 'quiz_champion':
          if (earning.type === 'quiz_complete' && earning.metadata?.score >= 90) {
            newProgress = (achievement.progress || 0) + 1
            shouldUnlock = newProgress >= 5
          }
          break
        case 'perfect_score':
          if (earning.type === 'quiz_complete' && earning.metadata?.score === 100) {
            shouldUnlock = true
          }
          break
        case 'team_player':
          if (earning.type === 'help_given') {
            newProgress = newStats.helpGiven
            shouldUnlock = newProgress >= 5
          }
          break
        case 'study_streak_7':
          newProgress = newStats.studyStreak
          shouldUnlock = newProgress >= 7
          break
        case 'study_streak_30':
          newProgress = newStats.studyStreak
          shouldUnlock = newProgress >= 30
          break
      }

      achievement.progress = newProgress

      if (shouldUnlock && !achievement.isUnlocked) {
        achievement.isUnlocked = true
        achievement.unlockedAt = new Date().toISOString()
        hasNewAchievement = true
        setPendingAchievement(achievement)
        
        // Award achievement points
        setTimeout(() => {
          awardPoints(achievement.points, `Achievement: ${achievement.name}`, 'achievement')
        }, 1000)
      }
    })

    if (hasNewAchievement) {
      setAchievements(updatedAchievements)
      localStorage.setItem(`achievements_${user.id}`, JSON.stringify(updatedAchievements))
    }
  }

  const redeemReward = useCallback((rewardId: string) => {
    if (!user || !stats) return false

    const reward = REWARDS.find(r => r.id === rewardId)
    if (!reward || stats.availablePoints < reward.cost) return false

    const redemption: RedeemedReward = {
      id: Date.now().toString(),
      rewardId,
      reward,
      redeemedAt: new Date().toISOString(),
      pointsSpent: reward.cost
    }

    const newStats = {
      ...stats,
      availablePoints: stats.availablePoints - reward.cost
    }

    setStats(newStats)
    setRedeemedRewards(prev => [redemption, ...prev])
    
    localStorage.setItem(`gamification_${user.id}`, JSON.stringify(newStats))
    localStorage.setItem(`redeemed_rewards_${user.id}`, JSON.stringify([redemption, ...redeemedRewards]))

    return true
  }, [user, stats, redeemedRewards])

  // Convenience methods for common point awards
  const awardTaskCompletion = useCallback((duration: number) => {
    const points = getPointsForTaskCompletion(duration)
    awardPoints(points, `Completed ${duration}min task`, 'task_complete', { duration })
    
    if (stats) {
      const newStats = { ...stats, tasksCompleted: stats.tasksCompleted + 1 }
      setStats(newStats)
      localStorage.setItem(`gamification_${user?.id}`, JSON.stringify(newStats))
    }
  }, [awardPoints, stats, user])

  const awardQuizCompletion = useCallback((score: number) => {
    const points = getPointsForQuizScore(score)
    awardPoints(points, `Quiz completed (${score}%)`, 'quiz_complete', { score })
    
    if (stats) {
      const newStats = { ...stats, quizzesCompleted: stats.quizzesCompleted + 1 }
      setStats(newStats)
      localStorage.setItem(`gamification_${user?.id}`, JSON.stringify(newStats))
    }
  }, [awardPoints, stats, user])

  const awardDailyStreak = useCallback(() => {
    awardPoints(20, 'Daily study streak', 'daily_streak')
    
    if (stats) {
      const newStats = { ...stats, studyStreak: stats.studyStreak + 1 }
      setStats(newStats)
      localStorage.setItem(`gamification_${user?.id}`, JSON.stringify(newStats))
    }
  }, [awardPoints, stats, user])

  const awardHelpGiven = useCallback(() => {
    awardPoints(15, 'Helped a team member', 'help_given')
    
    if (stats) {
      const newStats = { ...stats, helpGiven: stats.helpGiven + 1 }
      setStats(newStats)
      localStorage.setItem(`gamification_${user?.id}`, JSON.stringify(newStats))
    }
  }, [awardPoints, stats, user])

  const awardStudyPlan = useCallback(() => {
    awardPoints(30, 'Created helpful study plan', 'study_plan')
  }, [awardPoints])

  return {
    stats,
    achievements,
    rewards: REWARDS,
    redeemedRewards,
    leaderboard,
    pendingNotification,
    pendingAchievement,
    awardPoints,
    awardTaskCompletion,
    awardQuizCompletion,
    awardDailyStreak,
    awardHelpGiven,
    awardStudyPlan,
    redeemReward,
    clearNotification: () => setPendingNotification(null),
    clearAchievement: () => setPendingAchievement(null)
  }
}