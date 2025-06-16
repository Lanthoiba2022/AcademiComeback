import { usePremium } from '../../contexts/PremiumContext'
import { Crown, Clock, Zap, Star } from 'lucide-react'

interface PremiumStatusBadgeProps {
  showDetails?: boolean
  className?: string
}

export const PremiumStatusBadge = ({ showDetails = false, className = '' }: PremiumStatusBadgeProps) => {
  const { 
    isPremium, 
    isTrialActive, 
    trialDaysRemaining, 
    loading 
  } = usePremium()

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="w-20 h-6 bg-dark-700 rounded-full" />
      </div>
    )
  }

  if (isPremium) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <div className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full">
          <Crown className="w-4 h-4 text-white" />
          <span className="text-white font-medium text-sm">Premium</span>
        </div>
        
        {showDetails && (
          <div className="ml-3 text-sm text-dark-300">
            All features unlocked
          </div>
        )}
      </div>
    )
  }

  if (isTrialActive) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <div className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-accent-500 to-green-500 rounded-full">
          <Clock className="w-4 h-4 text-white" />
          <span className="text-white font-medium text-sm">Trial</span>
        </div>
        
        {showDetails && (
          <div className="ml-3 text-sm text-accent-400">
            {trialDaysRemaining} days remaining
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      <div className="flex items-center space-x-2 px-3 py-1 bg-dark-700 border border-dark-600 rounded-full">
        <Star className="w-4 h-4 text-dark-400" />
        <span className="text-dark-300 font-medium text-sm">Free</span>
      </div>
      
      {showDetails && (
        <div className="ml-3 text-sm text-dark-400">
          Limited features
        </div>
      )}
    </div>
  )
}