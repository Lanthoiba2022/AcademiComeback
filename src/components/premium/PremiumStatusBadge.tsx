import { usePremium } from '../../contexts/PremiumContext'
import { Crown, GraduationCap, Sparkles, Clock, Star } from 'lucide-react'

interface PremiumStatusBadgeProps {
  showDetails?: boolean
  className?: string
}

export const PremiumStatusBadge = ({ showDetails = false, className = '' }: PremiumStatusBadgeProps) => {
  const { 
    isPremium, 
    isTrialActive, 
    trialDaysRemaining,
    subscriptionLevel,
    isLoading
  } = usePremium()

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="w-20 h-6 bg-dark-700 rounded-full" />
      </div>
    )
  }

  const getBadgeInfo = () => {
    switch (subscriptionLevel) {
      case 'pro':
        return {
          icon: Crown,
          label: 'Pro',
          className: 'bg-gradient-to-r from-primary-500 to-secondary-500',
          details: 'All features unlocked',
          iconColor: 'text-white',
          textColor: 'text-white'
        }
      case 'student':
        return {
          icon: GraduationCap,
          label: 'Student',
          className: 'bg-gradient-to-r from-blue-500 to-purple-500',
          details: 'Student features unlocked',
          iconColor: 'text-white',
          textColor: 'text-white'
        }
      default:
        return {
          icon: Sparkles,
          label: 'Free',
          className: 'bg-gradient-to-r from-dark-600 to-dark-700',
          details: 'Limited features',
          iconColor: 'text-dark-400',
          textColor: 'text-dark-300'
        }
    }
  }

  const badgeInfo = getBadgeInfo()
  const Icon = badgeInfo.icon

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div className={`flex items-center space-x-2 px-4 py-1.5 rounded-full ${badgeInfo.className} shadow-lg transition-all duration-300 hover:shadow-xl`}>
        <Icon className={`w-4 h-4 ${badgeInfo.iconColor}`} />
        <span className={`font-medium text-sm ${badgeInfo.textColor}`}>{badgeInfo.label}</span>
      </div>
      
      {showDetails && (
        <div className="mt-2 text-xs text-dark-300 text-center max-w-[140px] leading-tight">
          {badgeInfo.details}
        </div>
      )}
    </div>
  )
}