import { useEffect, useState } from 'react'
import { Plus, Trophy, Star, Zap } from 'lucide-react'

interface PointsNotificationProps {
  points: number
  reason: string
  isVisible: boolean
  onComplete: () => void
}

export const PointsNotification = ({ points, reason, isVisible, onComplete }: PointsNotificationProps) => {
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true)
      const timer = setTimeout(() => {
        setShouldRender(false)
        setTimeout(onComplete, 300) // Wait for exit animation
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onComplete])

  if (!shouldRender) return null

  return (
    <div className={`
      fixed top-20 right-6 z-50 transform transition-all duration-500 ease-out
      ${isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}
    `}>
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 text-white px-6 py-4 rounded-xl shadow-2xl border border-primary-400/30 backdrop-blur-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold">+{points}</span>
              <Star className="w-5 h-5 text-yellow-300 animate-spin" />
            </div>
            <p className="text-sm opacity-90">{reason}</p>
          </div>
        </div>
        
        {/* Animated sparkles */}
        <div className="absolute -top-2 -right-2">
          <Zap className="w-4 h-4 text-yellow-300 animate-bounce" />
        </div>
        <div className="absolute -bottom-1 -left-1">
          <Trophy className="w-3 h-3 text-yellow-300 animate-pulse" />
        </div>
      </div>
    </div>
  )
}