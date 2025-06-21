import { useState, ReactNode } from 'react'
import { Crown, X } from 'lucide-react'
import { usePremium } from '../../contexts/PremiumContext'
import { PremiumUpgradeModal } from './PremiumUpgradeModal'

interface PremiumFeatureTooltipProps {
  children: ReactNode
  feature: 'ai' | 'analytics' | 'collaboration' | 'nft' | 'premium'
  title: string
  description: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export const PremiumFeatureTooltip = ({ 
  children, 
  feature, 
  title, 
  description,
  position = 'top'
}: PremiumFeatureTooltipProps) => {
  const [isVisible, setIsVisible] = useState(false)
  
  const { 
    isPremium, 
    hasAIFeatures, 
    hasAdvancedAnalytics, 
    hasCollaborationPlus, 
    hasNFTCredentials 
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

  // Don't show tooltip if user has access
  if (hasAccess()) {
    return <>{children}</>
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2'
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2'
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2'
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'
    }
  }

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-dark-800'
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-dark-800'
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-dark-800'
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-dark-800'
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-dark-800'
    }
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <>
          {/* Mobile: fixed, centered, no arrow */}
          <div className="sm:hidden fixed inset-0 z-[9999] flex items-center justify-center px-2">
            <div className="bg-dark-800 border border-dark-600 rounded-lg p-4 shadow-xl max-w-xs w-full mt-12 relative">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Crown className="w-4 h-4 text-primary-400" />
                  <span className="text-primary-400 text-sm font-medium">Premium Feature</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsVisible(false)
                  }}
                  className="text-dark-400 hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              {/* Content */}
              <h4 className="text-white font-medium mb-1">{title}</h4>
              <p className="text-dark-300 text-sm mb-3">{description}</p>
              {/* Upgrade button */}
              <PremiumUpgradeModal
                trigger={
                  <button className="w-full px-3 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-200">
                    Upgrade Now
                  </button>
                }
              />
            </div>
          </div>
          {/* Desktop: original absolute tooltip with arrow */}
          <div className={`hidden sm:block absolute z-50 ${getPositionClasses()}`}>
            <div className="bg-dark-800 border border-dark-600 rounded-lg p-4 shadow-xl max-w-xs">
              {/* Arrow */}
              <div className={`absolute w-0 h-0 border-4 ${getArrowClasses()}`} />
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Crown className="w-4 h-4 text-primary-400" />
                  <span className="text-primary-400 text-sm font-medium">Premium Feature</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsVisible(false)
                  }}
                  className="text-dark-400 hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              {/* Content */}
              <h4 className="text-white font-medium mb-1">{title}</h4>
              <p className="text-dark-300 text-sm mb-3">{description}</p>
              {/* Upgrade button */}
              <PremiumUpgradeModal
                trigger={
                  <button className="w-full px-3 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-200">
                    Upgrade Now
                  </button>
                }
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}