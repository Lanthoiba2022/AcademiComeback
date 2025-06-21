import { useState } from 'react'
import { Card } from '../ui/Card'
import { Target, Users, BookOpen, Clock, Award, Star, Brain, Flame, Heart, Trophy, Lock } from 'lucide-react'
import { Achievement } from '../../types/gamification'

interface AchievementsListProps {
  achievements: Achievement[]
  onAchievementClick?: (achievement: Achievement) => void
}

const getAchievementIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    Target, Users, BookOpen, Clock, Award, Star, Brain, Flame, Heart, Trophy
  }
  return icons[iconName] || Trophy
}

export const AchievementsList = ({ achievements, onAchievementClick }: AchievementsListProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = [
    { id: 'all', name: 'All', icon: Trophy },
    { id: 'study', name: 'Study', icon: BookOpen },
    { id: 'social', name: 'Social', icon: Users },
    { id: 'streak', name: 'Streaks', icon: Flame },
    { id: 'quiz', name: 'Quizzes', icon: Brain },
    { id: 'special', name: 'Special', icon: Star }
  ]

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(achievement => achievement.category === selectedCategory)

  const unlockedCount = achievements.filter(a => a.isUnlocked).length
  const totalPoints = achievements.filter(a => a.isUnlocked).reduce((sum, a) => sum + a.points, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Achievements</h2>
          <p className="text-dark-300">
            {unlockedCount} of {achievements.length} unlocked • {totalPoints.toLocaleString()} points earned
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl mb-1">🏆</div>
          <p className="text-sm text-dark-400">
            {Math.round((unlockedCount / achievements.length) * 100)}% Complete
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-dark-700 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full transition-all duration-1000"
          style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
        />
      </div>

      {/* Category Filter */}
      <div className="flex space-x-2 overflow-x-auto pb-2 custom-scrollbar">
        {categories.map((category) => {
          const Icon = category.icon
          const categoryCount = category.id === 'all' 
            ? achievements.length 
            : achievements.filter(a => a.category === category.id).length
          
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap
                ${selectedCategory === category.id
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{category.name}</span>
              <span className="text-xs opacity-60">({categoryCount})</span>
            </button>
          )
        })}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((achievement, index) => {
          const Icon = getAchievementIcon(achievement.icon)
          const progress = achievement.progress || 0
          const maxProgress = achievement.maxProgress || 1
          const progressPercentage = (progress / maxProgress) * 100
          
          return (
            <Card 
              key={achievement.id}
              className={`
                cursor-pointer transition-all duration-200 animate-slide-up
                ${achievement.isUnlocked 
                  ? 'hover:scale-105 border-accent-500/30 bg-gradient-to-br from-accent-500/10 to-primary-500/10' 
                  : 'hover:scale-102 opacity-75'
                }
              `}
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => onAchievementClick?.(achievement)}
            >
              <div className="flex items-start space-x-4">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0
                  ${achievement.isUnlocked 
                    ? 'bg-gradient-to-br from-accent-500 to-primary-500 text-white' 
                    : 'bg-dark-700 text-dark-500'
                  }
                `}>
                  {achievement.isUnlocked ? (
                    <Icon className="w-6 h-6" />
                  ) : (
                    <Lock className="w-6 h-6" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-semibold ${achievement.isUnlocked ? 'text-white' : 'text-dark-400'}`}>
                      {achievement.name}
                    </h3>
                    {achievement.isUnlocked && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-medium text-yellow-400">+{achievement.points}</span>
                      </div>
                    )}
                  </div>
                  
                  <p className={`text-sm mb-3 ${achievement.isUnlocked ? 'text-dark-300' : 'text-dark-500'}`}>
                    {achievement.description}
                  </p>
                  
                  {/* Progress Bar for incomplete achievements */}
                  {!achievement.isUnlocked && achievement.maxProgress && achievement.maxProgress > 1 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-dark-400">
                        <span>Progress</span>
                        <span>{progress}/{maxProgress}</span>
                      </div>
                      <div className="w-full bg-dark-700 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-primary-500 to-accent-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Category Badge */}
                  <div className={`
                    inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2
                    ${achievement.category === 'study' ? 'bg-blue-500/20 text-blue-400' :
                      achievement.category === 'social' ? 'bg-green-500/20 text-green-400' :
                      achievement.category === 'streak' ? 'bg-red-500/20 text-red-400' :
                      achievement.category === 'quiz' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }
                  `}>
                    {achievement.category.toUpperCase()}
                  </div>
                  
                  {achievement.isUnlocked && achievement.unlockedAt && (
                    <p className="text-xs text-dark-500 mt-2">
                      Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-dark-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Achievements Found</h3>
          <p className="text-dark-300">Try a different category filter</p>
        </div>
      )}
    </div>
  )
}