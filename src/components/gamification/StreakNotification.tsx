import React, { useEffect, useState } from 'react'
import { Flame, X } from 'lucide-react'

interface StreakNotificationProps {
  currentStreak: number
  previousStreak: number
  isVisible: boolean
  onComplete: () => void
}

export const StreakNotification: React.FC<StreakNotificationProps> = ({
  currentStreak,
  previousStreak,
  isVisible,
  onComplete
}) => {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      const timer = setTimeout(() => {
        setIsAnimating(false)
        onComplete()
      }, 4000) // Show for 4 seconds

      return () => clearTimeout(timer)
    }
  }, [isVisible, onComplete])

  const isStreakIncreased = currentStreak > previousStreak
  const isStreakMaintained = currentStreak > 0 && currentStreak === previousStreak

  if (!isVisible || !isAnimating) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm animate-slide-down">
      <div className="bg-gradient-to-r from-accent-500 to-primary-500 rounded-lg shadow-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-full">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">
                {isStreakIncreased 
                  ? `🔥 ${currentStreak} Day Streak!` 
                  : isStreakMaintained 
                    ? `🔥 Streak Maintained!` 
                    : '🔥 Study Streak'
                }
              </h4>
              <p className="text-xs opacity-90">
                {isStreakIncreased 
                  ? `Congratulations! You've extended your streak to ${currentStreak} days!`
                  : isStreakMaintained 
                    ? `Great job! You've maintained your ${currentStreak} day streak!`
                    : `Keep going! You're on a ${currentStreak} day streak!`
                }
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsAnimating(false)
              onComplete()
            }}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
} 