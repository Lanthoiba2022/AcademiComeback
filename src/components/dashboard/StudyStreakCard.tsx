import React from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Flame, Calendar, Clock, TrendingUp, Target, RefreshCw } from 'lucide-react'
import { StreakStats } from '../../hooks/useStudyStreak'

interface StudyStreakCardProps {
  streakStats: StreakStats
  todayMinutes: number
  totalVisitDays?: number
  loading?: boolean
  error?: string | null
  onViewHeatmap: () => void
  onRefresh?: () => void
}

export const StudyStreakCard: React.FC<StudyStreakCardProps> = ({
  streakStats,
  todayMinutes,
  totalVisitDays,
  loading,
  error,
  onViewHeatmap,
  onRefresh
}) => {
  // Cap today's minutes at 30 for display purposes when goal is achieved
  const displayMinutes = Math.min(todayMinutes, 30)
  const todayProgress = Math.min((todayMinutes / 30) * 100, 100)
  const isStreakActive = todayMinutes >= 30
  
  // Debug log to verify values
  console.log('StudyStreakCard - todayMinutes:', todayMinutes, 'displayMinutes:', displayMinutes, 'isStreakActive:', isStreakActive)
  
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-accent-500/10" />
      
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-xl ${isStreakActive ? 'bg-accent-500' : 'bg-dark-800'}`}>
              <Flame className={`w-6 h-6 ${isStreakActive ? 'text-white' : 'text-dark-400'}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Study Streak</h3>
              <p className="text-sm text-dark-300">Keep the momentum going!</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
                className="text-primary-400 hover:text-primary-300"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewHeatmap}
              className="text-primary-400 hover:text-primary-300"
            >
              View Heatmap
            </Button>
          </div>
        </div>

        {error ? (
          <div className="text-center py-8">
            <div className="text-red-400 mb-2">⚠️</div>
            <p className="text-sm text-red-400 mb-4">{error}</p>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
              >
                Retry
              </Button>
            )}
          </div>
        ) : loading ? (
          <div className="space-y-4">
            <div className="animate-pulse bg-dark-800 h-4 rounded w-3/4" />
            <div className="animate-pulse bg-dark-800 h-4 rounded w-1/2" />
            <div className="animate-pulse bg-dark-800 h-4 rounded w-2/3" />
          </div>
        ) : (
          <>
            {/* Current Streak Display */}
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-white mb-2">
                {streakStats.currentStreak}
                <span className="text-lg text-dark-300 ml-1">days</span>
              </div>
              <p className="text-sm text-dark-400">Current streak</p>
            </div>

            {/* Today's Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-dark-300">Today's progress</span>
                <span className="text-sm text-white">{displayMinutes}/30 min</span>
              </div>
              <div className="w-full bg-dark-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isStreakActive 
                      ? 'bg-gradient-to-r from-accent-500 to-primary-500' 
                      : 'bg-gradient-to-r from-dark-600 to-dark-500'
                  }`}
                  style={{ width: `${todayProgress}%` }}
                />
              </div>
              <p className="text-xs text-dark-400 mt-1">
                {isStreakActive ? 'Streak maintained!' : `${30 - todayMinutes} min to maintain streak`}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="flex flex-row justify-between gap-2 sm:grid sm:grid-cols-3 sm:gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center w-8 h-8 bg-dark-800 rounded-lg mx-auto mb-2">
                  <Target className="w-4 h-4 text-primary-400" />
                </div>
                <p className="text-lg font-semibold text-white">{streakStats.longestStreak}</p>
                <p className="text-xs text-dark-400">Longest Streak</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-8 h-8 bg-dark-800 rounded-lg mx-auto mb-2">
                  <Calendar className="w-4 h-4 text-secondary-400" />
                </div>
                <p className="text-lg font-semibold text-white">{totalVisitDays || streakStats.totalStudyDays}</p>
                <p className="text-xs text-dark-400">Total days</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-8 h-8 bg-dark-800 rounded-lg mx-auto mb-2">
                  <Clock className="w-4 h-4 text-accent-400" />
                </div>
                <p className="text-lg font-semibold text-white">{streakStats.averageMinutesPerDay}</p>
                <p className="text-xs text-dark-400">Avg min</p>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}
