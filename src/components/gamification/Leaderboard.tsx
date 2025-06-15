import { useState } from 'react'
import { Card } from '../ui/Card'
import { Trophy, Crown, Star, TrendingUp, User } from 'lucide-react'
import { LeaderboardEntry } from '../../types/gamification'

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  currentUserId: string
  timeframe: 'weekly' | 'monthly' | 'alltime'
  onTimeframeChange: (timeframe: 'weekly' | 'monthly' | 'alltime') => void
}

export const Leaderboard = ({ entries, currentUserId, timeframe, onTimeframeChange }: LeaderboardProps) => {
  const timeframes = [
    { id: 'weekly', name: 'This Week', icon: TrendingUp },
    { id: 'monthly', name: 'This Month', icon: Star },
    { id: 'alltime', name: 'All Time', icon: Trophy }
  ]

  const getPositionIcon = (position: number) => {
    if (position === 1) return <Crown className="w-5 h-5 text-yellow-400" />
    if (position === 2) return <Trophy className="w-5 h-5 text-gray-400" />
    if (position === 3) return <Trophy className="w-5 h-5 text-amber-600" />
    return <span className="text-lg font-bold text-dark-400">#{position}</span>
  }

  const getPositionColor = (position: number) => {
    if (position === 1) return 'border-yellow-500/30 bg-yellow-500/10'
    if (position === 2) return 'border-gray-400/30 bg-gray-400/10'
    if (position === 3) return 'border-amber-600/30 bg-amber-600/10'
    return 'border-dark-600'
  }

  const currentUserEntry = entries.find(entry => entry.userId === currentUserId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Leaderboard</h2>
          <p className="text-dark-300">See how you rank against other students</p>
        </div>
        <div className="text-4xl">🏆</div>
      </div>

      {/* Timeframe Filter */}
      <div className="flex space-x-2">
        {timeframes.map((tf) => {
          const Icon = tf.icon
          return (
            <button
              key={tf.id}
              onClick={() => onTimeframeChange(tf.id as any)}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                ${timeframe === tf.id
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{tf.name}</span>
            </button>
          )
        })}
      </div>

      {/* Current User Position */}
      {currentUserEntry && currentUserEntry.position > 3 && (
        <Card className="border-primary-500/30 bg-primary-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
                <span className="text-sm font-bold text-white">#{currentUserEntry.position}</span>
              </div>
              <div className="flex items-center space-x-3">
                {currentUserEntry.userAvatar ? (
                  <img
                    src={currentUserEntry.userAvatar}
                    alt={currentUserEntry.userName}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-white">{currentUserEntry.userName} (You)</p>
                  <p className="text-sm text-primary-300">{currentUserEntry.rank.name}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-white">
                {timeframe === 'weekly' ? currentUserEntry.weeklyPoints : currentUserEntry.totalPoints}
              </p>
              <p className="text-sm text-dark-300">points</p>
            </div>
          </div>
        </Card>
      )}

      {/* Top Entries */}
      <div className="space-y-3">
        {entries.slice(0, 10).map((entry, index) => {
          const isCurrentUser = entry.userId === currentUserId
          
          return (
            <Card 
              key={entry.userId}
              className={`
                transition-all duration-200 animate-slide-up
                ${getPositionColor(entry.position)}
                ${isCurrentUser ? 'ring-2 ring-primary-500' : ''}
              `}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 flex items-center justify-center">
                    {getPositionIcon(entry.position)}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {entry.userAvatar ? (
                      <img
                        src={entry.userAvatar}
                        alt={entry.userName}
                        className="w-12 h-12 rounded-full border-2 border-dark-600"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center border-2 border-dark-600">
                        <User className="w-6 h-6 text-white" />
                      </div>
                    )}
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold text-white">
                          {entry.userName}
                          {isCurrentUser && <span className="text-primary-400"> (You)</span>}
                        </p>
                        {entry.position <= 3 && (
                          <div className="text-lg">
                            {entry.position === 1 ? '🥇' : entry.position === 2 ? '🥈' : '🥉'}
                          </div>
                        )}
                      </div>
                      <p className={`text-sm ${entry.rank.color}`}>{entry.rank.name}</p>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-xl font-bold text-white">
                    {(timeframe === 'weekly' ? entry.weeklyPoints : entry.totalPoints).toLocaleString()}
                  </p>
                  <p className="text-sm text-dark-300">points</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {entries.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-dark-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Leaderboard Data</h3>
          <p className="text-dark-300">Start studying to appear on the leaderboard!</p>
        </div>
      )}
    </div>
  )
}