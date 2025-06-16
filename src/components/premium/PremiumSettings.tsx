import { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { usePremium } from '../../contexts/PremiumContext'
import { PremiumUpgradeModal } from './PremiumUpgradeModal'
import { PremiumStatusBadge } from './PremiumStatusBadge'
import { 
  Crown, Calendar, CreditCard, Download, RefreshCw, 
  AlertCircle, CheckCircle, ExternalLink, Settings,
  Zap, Star, Users, Award
} from 'lucide-react'

export const PremiumSettings = () => {
  const [loading, setLoading] = useState(false)
  
  const { 
    customerInfo,
    isPremium, 
    isTrialActive, 
    trialDaysRemaining,
    hasAIFeatures,
    hasAdvancedAnalytics,
    hasCollaborationPlus,
    hasNFTCredentials,
    refreshCustomerInfo 
  } = usePremium()

  const handleRefresh = async () => {
    setLoading(true)
    await refreshCustomerInfo()
    setLoading(false)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getSubscriptionStatus = () => {
    if (!customerInfo) return 'Unknown'
    
    if (isPremium) {
      if (isTrialActive) {
        return `Trial (${trialDaysRemaining} days remaining)`
      }
      return 'Active Premium'
    }
    
    return 'Free Plan'
  }

  const getNextBillingDate = () => {
    if (!customerInfo || !isPremium) return null
    
    const premiumEntitlement = customerInfo.entitlements.active['premium']
    return premiumEntitlement?.expirationDate || null
  }

  const features = [
    {
      id: 'ai',
      name: 'AI-Powered Features',
      description: 'Intelligent quiz generation and personalized recommendations',
      icon: Zap,
      hasAccess: hasAIFeatures,
      color: 'text-purple-400'
    },
    {
      id: 'analytics',
      name: 'Advanced Analytics',
      description: 'Detailed progress tracking and performance insights',
      icon: Star,
      hasAccess: hasAdvancedAnalytics,
      color: 'text-blue-400'
    },
    {
      id: 'collaboration',
      name: 'Enhanced Collaboration',
      description: 'Voice commands, AI avatars, and premium study rooms',
      icon: Users,
      hasAccess: hasCollaborationPlus,
      color: 'text-green-400'
    },
    {
      id: 'nft',
      name: 'NFT Study Credentials',
      description: 'Blockchain-verified certificates for achievements',
      icon: Award,
      hasAccess: hasNFTCredentials,
      color: 'text-yellow-400'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Premium Settings</h2>
          <p className="text-dark-300">Manage your subscription and premium features</p>
        </div>
        
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          icon={RefreshCw}
          loading={loading}
        >
          Refresh Status
        </Button>
      </div>

      {/* Subscription Status */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Subscription Status</h3>
          <PremiumStatusBadge />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-dark-400">Current Plan</label>
                <p className="text-white font-medium">{getSubscriptionStatus()}</p>
              </div>
              
              {getNextBillingDate() && (
                <div>
                  <label className="text-sm text-dark-400">
                    {isTrialActive ? 'Trial Ends' : 'Next Billing'}
                  </label>
                  <p className="text-white font-medium">
                    {formatDate(getNextBillingDate())}
                  </p>
                </div>
              )}

              {customerInfo?.originalAppUserId && (
                <div>
                  <label className="text-sm text-dark-400">Customer ID</label>
                  <p className="text-white font-mono text-sm">
                    {customerInfo.originalAppUserId}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-center">
            {!isPremium ? (
              <PremiumUpgradeModal
                trigger={
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-primary-500 to-secondary-500"
                    icon={Crown}
                  >
                    Upgrade to Premium
                  </Button>
                }
              />
            ) : (
              <div className="space-y-2">
                <div className="flex items-center text-green-400">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Premium Active</span>
                </div>
                <p className="text-dark-300 text-sm">
                  You have access to all premium features
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Feature Access */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-4">Feature Access</h3>
        
        <div className="space-y-4">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.id} className="flex items-center justify-between p-4 bg-dark-800/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center ${feature.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{feature.name}</h4>
                    <p className="text-dark-300 text-sm">{feature.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  {feature.hasAccess ? (
                    <div className="flex items-center text-green-400">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span className="text-sm font-medium">Enabled</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-dark-400">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      <span className="text-sm">Locked</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Billing & Support */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Billing</h3>
          
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              icon={CreditCard}
            >
              Manage Billing
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              icon={Download}
            >
              Download Receipts
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              icon={Calendar}
            >
              Billing History
            </Button>
          </div>
          
          <p className="text-xs text-dark-400 mt-4">
            Billing is managed securely through RevenueCat
          </p>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Support</h3>
          
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              icon={ExternalLink}
            >
              Contact Support
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              icon={Settings}
            >
              Privacy Settings
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start text-red-400 hover:text-red-300"
              icon={AlertCircle}
            >
              Cancel Subscription
            </Button>
          </div>
          
          <p className="text-xs text-dark-400 mt-4">
            Need help? We're here to assist you 24/7
          </p>
        </Card>
      </div>

      {/* Trial Information */}
      {isTrialActive && (
        <Card className="border-accent-500/30 bg-accent-500/10">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-full bg-accent-500/20 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-accent-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">Free Trial Active</h3>
              <p className="text-accent-300 mb-3">
                You have {trialDaysRemaining} days remaining in your free trial. 
                Enjoy full access to all premium features!
              </p>
              <PremiumUpgradeModal
                trigger={
                  <Button 
                    size="sm"
                    className="bg-gradient-to-r from-accent-500 to-green-500"
                  >
                    Subscribe Now
                  </Button>
                }
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}