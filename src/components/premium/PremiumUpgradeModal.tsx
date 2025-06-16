import { useState, ReactNode, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { usePremium } from '../../contexts/PremiumContext'
import { purchasePackage, restorePurchases, isRevenueCatConfigured } from '../../lib/revenuecat'
import { 
  Crown, Check, Zap, Star, Users, Award, Loader, 
  RefreshCw, AlertCircle, Sparkles 
} from 'lucide-react'
import type { Package } from '@revenuecat/purchases-js'

interface PremiumUpgradeModalProps {
  trigger: ReactNode
  isOpen?: boolean
  onClose?: () => void
}

export const PremiumUpgradeModal = ({ 
  trigger, 
  isOpen: controlledIsOpen, 
  onClose: controlledOnClose 
}: PremiumUpgradeModalProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const { 
    isPremium, 
    isTrialActive, 
    trialDaysRemaining, 
    refreshCustomerInfo,
    offerings,
    refreshOfferings,
    isLoading
  } = usePremium()

  const modalIsOpen = controlledIsOpen !== undefined ? controlledIsOpen : isOpen
  const handleClose = controlledOnClose || (() => setIsOpen(false))

  // Check if RevenueCat is configured
  useEffect(() => {
    if (!isRevenueCatConfigured()) {
      setError('RevenueCat is not properly configured. Please check your API keys.')
    }
  }, [])

  // Load offerings when modal opens
  const handleOpen = async () => {
    if (controlledIsOpen === undefined) {
      setIsOpen(true)
    }
    
    if (isRevenueCatConfigured()) {
      await refreshOfferings()
    }
  }

  // Handle purchase
  const handlePurchase = async (pkg: Package) => {
    try {
      setPurchasing(pkg.identifier)
      setError(null)
      
      const { success, error: purchaseError } = await purchasePackage(pkg)
      
      if (success) {
        await refreshCustomerInfo()
        handleClose()
      } else {
        setError(purchaseError || 'Purchase failed. Please try again.')
      }
    } catch (err) {
      console.error('Purchase error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setPurchasing(null)
    }
  }

  // Handle restore purchases
  const handleRestorePurchases = async () => {
    try {
      setError(null)
      await restorePurchases()
      await refreshCustomerInfo()
    } catch (err) {
      console.error('Restore error:', err)
      setError('Failed to restore purchases. Please try again.')
    }
  }

  const premiumFeatures = [
    {
      icon: Zap,
      title: 'AI-Powered Study Tools',
      description: 'Intelligent quiz generation, personalized recommendations, and AI tutoring',
      color: 'text-purple-400'
    },
    {
      icon: Star,
      title: 'Advanced Analytics',
      description: 'Detailed progress tracking, performance insights, and study pattern analysis',
      color: 'text-blue-400'
    },
    {
      icon: Users,
      title: 'Enhanced Collaboration',
      description: 'Voice commands, AI avatars, audio messages, and premium study rooms',
      color: 'text-green-400'
    },
    {
      icon: Award,
      title: 'NFT Study Credentials',
      description: 'Mint blockchain-verified certificates for your achievements',
      color: 'text-yellow-400'
    }
  ]

  const getPackagePrice = (pkg: Package): string => {
    // For Web Billing, access price from webBillingProduct
    if (pkg.webBillingProduct) {
      return pkg.webBillingProduct.currentPrice?.formattedPrice || 
             `${pkg.webBillingProduct.currentPrice?.currency} ${pkg.webBillingProduct.currentPrice?.amountMicros / 1000000}`
    }
    // Fallback for regular products
    return 'Price not available'
  }

  const getPackageSavings = (pkg: Package): string | null => {
    // Calculate savings for yearly plan
    if (pkg.identifier.includes('yearly') || pkg.identifier.includes('annual')) {
      return 'Save 25%'
    }
    return null
  }

  const getPackageName = (pkg: Package): string => {
    // Extract package name from identifier or use display name
    if (pkg.identifier.includes('monthly')) return 'Monthly'
    if (pkg.identifier.includes('yearly') || pkg.identifier.includes('annual')) return 'Yearly'
    return 'Subscription'
  }

  return (
    <>
      <div onClick={handleOpen}>{trigger}</div>
      
      <Modal
        isOpen={modalIsOpen}
        onClose={handleClose}
        size="lg"
      >
        <div className="p-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Upgrade to Premium
            </h2>
            <p className="text-dark-300">
              Unlock all premium features and take your studying to the next level
            </p>
          </div>

          <div className="space-y-6">
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center">
                <AlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Loading state */}
            {isLoading && !offerings && (
              <div className="text-center py-12">
                <Loader className="w-8 h-8 text-primary-400 mx-auto mb-4 animate-spin" />
                <p className="text-white">Loading subscription plans...</p>
              </div>
            )}

            {/* Subscription plans */}
            {offerings?.current && offerings.current.availablePackages.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white text-center mb-6">
                  Choose Your Plan
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {offerings.current.availablePackages.map((pkg) => {
                    const isYearly = pkg.identifier.includes('yearly') || pkg.identifier.includes('annual')
                    const savings = getPackageSavings(pkg)
                    const isPurchasing = purchasing === pkg.identifier
                    const packageName = getPackageName(pkg)
                    
                    return (
                      <Card 
                        key={pkg.identifier}
                        className={`relative ${isYearly ? 'ring-2 ring-primary-500 scale-105' : ''}`}
                      >
                        {/* Popular badge for yearly */}
                        {isYearly && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                              Most Popular
                            </div>
                          </div>
                        )}

                        <div className="p-6">
                          <h4 className="text-lg font-semibold text-white mb-2">
                            {packageName}
                          </h4>
                          
                          <div className="mb-4">
                            <div className="text-3xl font-bold text-white">
                              {getPackagePrice(pkg)}
                            </div>
                            <div className="text-dark-400 text-sm">
                              per {isYearly ? 'year' : 'month'}
                            </div>
                            {savings && (
                              <div className="text-green-400 text-sm font-medium mt-1">
                                {savings}
                              </div>
                            )}
                          </div>

                          <Button
                            onClick={() => handlePurchase(pkg)}
                            disabled={isPurchasing || isLoading}
                            className={`w-full ${isYearly ? 'bg-gradient-to-r from-primary-500 to-secondary-500' : ''}`}
                            loading={isPurchasing}
                          >
                            {isPurchasing ? 'Processing...' : 'Subscribe Now'}
                          </Button>

                          {isYearly && (
                            <p className="text-xs text-dark-400 mt-2">
                              Billed annually, cancel anytime
                            </p>
                          )}
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Features list */}
            <div>
              <h3 className="text-xl font-semibold text-white text-center mb-6">
                What's Included
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {premiumFeatures.map((feature, index) => {
                  const Icon = feature.icon
                  return (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full bg-dark-800 flex items-center justify-center flex-shrink-0 ${feature.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium mb-1">{feature.title}</h4>
                        <p className="text-dark-300 text-sm">{feature.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-dark-700">
              <Button
                variant="ghost"
                onClick={handleRestorePurchases}
                disabled={isLoading}
                icon={RefreshCw}
                size="sm"
              >
                Restore Purchases
              </Button>
              
              <div className="text-center">
                <p className="text-xs text-dark-400 mb-2">
                  Secure payments powered by Stripe
                </p>
                <p className="text-xs text-dark-500">
                  Powered by RevenueCat
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}