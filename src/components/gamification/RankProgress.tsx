import { Crown, Star, Trophy, Award, Zap } from 'lucide-react'
import { Rank } from '../../types/gamification'

interface RankProgressProps {
  currentRank: Rank
  nextRank: Rank | null
  currentPoints: number
  progressPercentage: number
  showDetails?: boolean
}

const getRankIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    Trophy, Star, Award, Crown, Zap
  }
  return icons[iconName] || Trophy
}

export const RankProgress = ({ 
  currentRank, 
  nextRank, 
  currentPoints, 
  progressPercentage,
  showDetails = true 
}: RankProgressProps) => {
  const CurrentIcon = getRankIcon(currentRank.icon)
  const NextIcon = nextRank ? getRankIcon(nextRank.icon) : null

  return (
    <div className="bg-card-gradient backdrop-blur-xl border border-dark-700/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-full bg-dark-800 flex items-center justify-center ${currentRank.color}`}>
            <CurrentIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{currentRank.name}</h3>
            <p className="text-sm text-dark-300">{currentPoints.toLocaleString()} points</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl">{currentRank.badge}</div>
        </div>
      </div>

      {nextRank && (
        <>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-dark-300">Progress to {nextRank.name}</span>
              <span className="text-sm text-primary-400 font-medium">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            
            <div className="relative">
              <div className="w-full bg-dark-700 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${progressPercentage}%` }}
                >
                  {/* Animated shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                </div>
              </div>
              
              {/* Next rank indicator */}
              <div className="absolute right-0 -top-8 flex items-center space-x-2">
                {NextIcon && (
                  <div className={`w-8 h-8 rounded-full bg-dark-800 flex items-center justify-center ${nextRank.color} opacity-60`}>
                    <NextIcon className="w-4 h-4" />
                  </div>
                )}
                <span className="text-xs text-dark-400">{nextRank.name}</span>
              </div>
            </div>
            
            <div className="flex justify-between text-xs text-dark-400 mt-2">
              <span>{currentRank.minPoints}</span>
              <span>{nextRank.minPoints} points needed</span>
            </div>
          </div>

          {showDetails && (
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-white mb-2">Current Perks</h4>
                <div className="space-y-1">
                  {currentRank.perks.map((perk, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Star className="w-3 h-3 text-accent-400" />
                      <span className="text-xs text-dark-300">{perk}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-white mb-2">Next Rank Perks</h4>
                <div className="space-y-1">
                  {nextRank.perks.slice(0, 2).map((perk, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Star className="w-3 h-3 text-primary-400 opacity-60" />
                      <span className="text-xs text-dark-400">{perk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {!nextRank && (
        <div className="text-center py-4">
          <Crown className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <p className="text-sm text-yellow-400 font-medium">Maximum Rank Achieved!</p>
          <p className="text-xs text-dark-400">You've reached the highest level</p>
        </div>
      )}
    </div>
  )
}