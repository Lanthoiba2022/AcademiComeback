import { ReactNode } from 'react'
import { usePremium } from '../../contexts/PremiumContext'
import { PremiumUpgradeModal } from './PremiumUpgradeModal'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Crown, Lock, Zap, Star } from 'lucide-react'

interface PremiumGateProps {
  children: ReactNode
  feature: 'ai' | 'analytics' | 'collaboration' | 'nft' | 'premium'
  fallback?: ReactNode
  showUpgradePrompt?: boolean
  className?: string
}

export const PremiumGate = ({ 
  children, 
  feature, 
  fallback, 
  showUpgradePrompt = true,
  className = ''
}: PremiumGateProps) => {
  const { 
    isPremium, 
    hasAIFeatures, 
    hasAdvancedAnalytics, 
    hasCollaborationPlus, 
    hasNFTCredentials,
    loading 
  } = usePremium()

  // Check if user has access to the specific feature
  const hasAccess = () => {
    switch (feature) {
      case 'ai':
        return hasAIFeatures
      case 'analytics':
        return hasAdvancedAnalytics
      case 'collaboration':
        return hasCollaborationPlus
      case 'nft':
        return hasNFTCredentials
      case 'premium':
        return isPremium
      default:
        return false
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-dark-700 rounded-lg h-32 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  // If user has access, render children
  if (hasAccess()) {
    return <>{children}</>
  }

  // If custom fallback is provided, use it
  if (fallback) {
    return <>{fallback}</>
  }

  // Default premium lock UI
  if (!showUpgradePrompt) {
    return null
  }

  return (
    <div className={className}>
      <PremiumLockCard feature={feature} />
    </div>
  )
}

interface PremiumLockCardProps {
  feature: 'ai' | 'analytics' | 'collaboration' | 'nft' | 'premium'
}

const PremiumLockCard = ({ feature }: PremiumLockCardProps) => {
  const { isTrialActive, trialDaysRemaining } = usePremium()

  const getFeatureInfo = () => {
    switch (feature) {
      case 'ai':
        return {
          title: 'AI-Powered Features',
          description: 'Unlock intelligent quiz generation, personalized study recommendations, and AI tutoring.',
          icon: Zap,
          color: 'text-purple-400'
        }
      case 'analytics':
        return {
          title: 'Advanced Analytics',
          description: 'Get detailed insights into your study patterns, progress tracking, and performance analytics.',
          icon: Star,
          color: 'text-blue-400'
        }
      case 'collaboration':
        return {
          title: 'Enhanced Collaboration',
          description: 'Access voice commands, AI avatars, audio messages, and advanced study room features.',
          icon: Crown,
          color: 'text-green-400'
        }
      case 'nft':
        return {
          title: 'Study Credentials NFTs',
          description: 'Mint and showcase your achievements as blockchain-verified NFT credentials.',
          icon: Star,
          color: 'text-yellow-400'
        }
      default:
        return {
          title: 'Premium Features',
          description: 'Unlock all premium features and take your studying to the next level.',
          icon: Crown,
          color: 'text-primary-400'
        }
    }
  }

  const featureInfo = getFeatureInfo()
  const Icon = featureInfo.icon

  return (
    <Card className="text-center relative overflow-hidden">
      {/* Premium gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-secondary-500/10 to-accent-500/10" />
      
      <div className="relative z-10 p-8">
        {/* Lock icon with premium styling */}
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-primary-500/30">
            <Lock className="w-8 h-8 text-primary-400" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <Crown className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Feature info */}
        <div className="mb-6">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Icon className={`w-5 h-5 ${featureInfo.color}`} />
            <h3 className="text-xl font-semibold text-white">{featureInfo.title}</h3>
          </div>
          <p className="text-dark-300 leading-relaxed">{featureInfo.description}</p>
        </div>

        {/* Trial info */}
        {isTrialActive && (
          <div className="mb-6 p-3 bg-accent-500/20 border border-accent-500/30 rounded-lg">
            <p className="text-accent-400 text-sm font-medium">
              🎉 Free Trial Active - {trialDaysRemaining} days remaining
            </p>
          </div>
        )}

        {/* Upgrade button */}
        <PremiumUpgradeModal
          trigger={
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 hover:shadow-lg hover:shadow-primary-500/25 transform hover:scale-105 transition-all duration-200"
            >
              <Crown className="w-5 h-5 mr-2" />
              {isTrialActive ? 'Continue with Premium' : 'Upgrade to Premium'}
            </Button>
          }
        />

        {/* Benefits list */}
        <div className="mt-6 text-left">
          <p className="text-sm font-medium text-white mb-3">Premium includes:</p>
          <ul className="space-y-2 text-sm text-dark-300">
            <li className="flex items-center">
              <div className="w-1.5 h-1.5 bg-primary-400 rounded-full mr-3" />
              Unlimited AI-powered features
            </li>
            <li className="flex items-center">
              <div className="w-1.5 h-1.5 bg-secondary-400 rounded-full mr-3" />
              Advanced study analytics
            </li>
            <li className="flex items-center">
              <div className="w-1.5 h-1.5 bg-accent-400 rounded-full mr-3" />
              Enhanced collaboration tools
            </li>
            <li className="flex items-center">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-3" />
              NFT study credentials
            </li>
          </ul>
        </div>
      </div>
    </Card>
  )
}