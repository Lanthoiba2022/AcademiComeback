import { usePremium } from '../../contexts/PremiumContext'
import { Crown, GraduationCap, Sparkles } from 'lucide-react'

export const SubscriptionBadge = () => {
  const { subscriptionLevel } = usePremium()

  const getBadgeInfo = () => {
    switch (subscriptionLevel) {
      case 'pro':
        return {
          icon: Crown,
          label: 'Pro',
          className: 'bg-gradient-to-r from-primary-500 to-secondary-500'
        }
      case 'student':
        return {
          icon: GraduationCap,
          label: 'Student',
          className: 'bg-gradient-to-r from-blue-500 to-purple-500'
        }
      default:
        return {
          icon: Sparkles,
          label: 'Free',
          className: 'bg-gradient-to-r from-dark-600 to-dark-700'
        }
    }
  }

  const badgeInfo = getBadgeInfo()
  const Icon = badgeInfo.icon

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white ${badgeInfo.className}`}>
      <Icon className="w-4 h-4 mr-1.5" />
      {badgeInfo.label}
    </div>
  )
} 