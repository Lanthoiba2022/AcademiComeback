import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Trophy, Star, Zap, Sparkles } from 'lucide-react'
import { Achievement } from '../../types/gamification'

interface AchievementUnlockProps {
  achievement: Achievement | null
  isOpen: boolean
  onClose: () => void
}

export const AchievementUnlock = ({ achievement, isOpen, onClose }: AchievementUnlockProps) => {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isOpen && achievement) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, achievement])

  if (!achievement) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="text-center relative overflow-hidden">
        {/* Confetti Animation */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              >
                <Sparkles className="w-4 h-4 text-yellow-400" />
              </div>
            ))}
          </div>
        )}

        {/* Achievement Content */}
        <div className="relative z-10">
          <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse shadow-2xl">
            <Trophy className="w-12 h-12 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2 animate-slide-up">
            Achievement Unlocked!
          </h2>
          
          <div className="bg-dark-800/50 rounded-lg p-4 mb-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-xl font-semibold text-yellow-400 mb-2">{achievement.name}</h3>
            <p className="text-dark-300 mb-3">{achievement.description}</p>
            
            <div className="flex items-center justify-center space-x-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-lg font-bold text-white">+{achievement.points} points</span>
              <Star className="w-5 h-5 text-yellow-400" />
            </div>
          </div>

          <div className="flex items-center justify-center space-x-2 mb-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              achievement.category === 'study' ? 'bg-blue-500/20 text-blue-400' :
              achievement.category === 'social' ? 'bg-green-500/20 text-green-400' :
              achievement.category === 'streak' ? 'bg-red-500/20 text-red-400' :
              achievement.category === 'quiz' ? 'bg-purple-500/20 text-purple-400' :
              'bg-yellow-500/20 text-yellow-400'
            }`}>
              {achievement.category.toUpperCase()}
            </div>
          </div>

          <Button 
            onClick={onClose}
            className="animate-slide-up"
            style={{ animationDelay: '0.6s' }}
            icon={Zap}
          >
            Awesome!
          </Button>
        </div>
      </div>
    </Modal>
  )
}