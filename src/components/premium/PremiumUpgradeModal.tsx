import { useState, ReactNode } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { usePremium } from '../../contexts/PremiumContext'
import { getOfferings, purchasePackage, restorePurchases } from '../../lib/revenuecat'
import { 
  Crown, Check, Zap, Star, Users, Award, Loader, 
  RefreshCw, AlertCircle, Sparkles 
} from 'lucide-react'
import { Offerings, PurchasesPackage } from '@revenuecat/purchases'

interface PremiumUpgradeModalProps {
  trigger: ReactNode
  isOpen?: boolean
  onClose?: () => void
}

export const PremiumUpgradeModal = ({ trigger, isOpen: controlledIsOpen, onClose: controlledOnClose }: PremiumUpgradeModalProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [offerings, setOfferings] = useState<Offerings | null>(null)
  const [loading, setLoading] = useState(false)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const { 
    isPremium, 
    isTrialActive, 
    trialDaysRemaining, 
    refreshCustomerInfo 
  } = usePremium()

  const modalIsOpen = controlledIsOpen !== undefined ? controlledIsOpen : isOpen
  const handleClose = controlledOnClose || (() => setIsOpen(false))

  // Load offerings when modal opens
  const handleOpen = async () => {
    if (controlledIsOpen === undefined) {
      setIsOpen(true)
    }
    
    if (!offerings) {
      await loadOfferings()
    }
  }

  const loadOfferings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const fetchedOfferings = await getOfferings()
      setOfferings(fetchedOfferings)
      
      if (!fetchedOfferings?.current) {
        setError('No subscription plans available at the moment. Please try again later.')
      }
    } catch (err) {
      console.error('Failed to load offerings:', err)
      setError('Failed to load subscription plans. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (packageToPurchase: PurchasesPackage) => {
    try {
      setPurchasing(packageToPurchase.identifier)
      setError(null)
      
      const result = await purchasePackage(packageToPurchase)
      
      if (result.success) {
        // Refresh customer info to get latest entitlements
        await refreshCustomerInfo()
        
        // Show success and close modal
        handleClose()
        
        // You could show a success toast here
        console.log('✅ Purchase successful!')
      } else {
        setError(result.error || 'Purchase failed. Please try again.')
      }
    } catch (err) {
      console.error('Purchase error:', err)
      setError('Purchase failed. Please try again.')
    } finally {
      setPurchasing(null)
    }
  }

  const handleRestorePurchases = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const customerInfo = await restorePurchases()
      
      if (customerInfo) {
        await refreshCustomerInfo()
        
        if (Object.keys(customerInfo.entitlements.active).length > 0) {
          handleClose()
          console.log('✅ Purchases restored successfully!')
        } else {
          setError('No active purchases found to restore.')
        }
      } else {
        setError('Failed to restore purchases. Please try again.')
      }
    } catch (err) {
      console.error('Restore purchases error:', err)
      setError('Failed to restore purchases. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // If user is already premium, don't show the modal
  if (isPremium) {
    return <>{trigger}</>
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

  const getPackagePrice = (pkg: PurchasesPackage): string => {
    // Format price from RevenueCat package
    return pkg.product.priceString || `$${pkg.product.price}`
  }

  const getPackageSavings = (pkg: PurchasesPackage): string | null => {
    // Calculate savings for yearly plan
    if (pkg.identifier.includes('yearly') || pkg.identifier.includes('annual')) {
      return 'Save 25%'
    }
    return null
  }

  return (
    <>
      <div onClick={handleOpen} className="cursor-pointer">
        {trigger}
      </div>

      <Modal
        isOpen={modalIsOpen}
        onClose={handleClose}
        title=""
        size="xl"
      >
        <div className="relative overflow-hidden">
          {/* Premium gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-secondary-500/10 to-accent-500/10" />
          
          <div className="relative z-10 p-6">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/25">
                <Crown className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-2">
                Upgrade to Premium
              </h2>
              
              <p className="text-dark-300 text-lg">
                Unlock the full potential of StudySync
              </p>

              {/* Trial status */}
              {isTrialActive && (
                <div className="mt-4 inline-flex items-center px-4 py-2 bg-accent-500/20 border border-accent-500/30 rounded-full">
                  <Sparkles className="w-4 h-4 text-accent-400 mr-2" />
                  <span className="text-accent-400 font-medium">
                    {trialDaysRemaining} days left in your free trial
                  </span>
                </div>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center">
                <AlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Loading state */}
            {loading && !offerings && (
              <div className="text-center py-12">
                <Loader className="w-8 h-8 text-primary-400 mx-auto mb-4 animate-spin" />
                <p className="text-white">Loading subscription plans...</p>
              </div>
            )}

            {/* Subscription plans */}
            {offerings?.current && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white text-center mb-6">
                  Choose Your Plan
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {offerings.current.availablePackages.map((pkg) => {
                    const isYearly = pkg.identifier.includes('yearly') || pkg.identifier.includes('annual')
                    const savings = getPackageSavings(pkg)
                    const isPurchasing = purchasing === pkg.identifier
                    
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

                        <div className="p-6 text-center">
                          <h4 className="text-lg font-semibold text-white mb-2">
                            {isYearly ? 'Yearly' : 'Monthly'}
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
                            disabled={isPurchasing || loading}
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
            <div className="mb-8">
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
                disabled={loading}
                icon={RefreshCw}
                size="sm"
              >
                Restore Purchases
              </Button>
              
              <div className="text-center">
                <p className="text-xs text-dark-400 mb-2">
                  14-day free trial • Cancel anytime • Secure payments
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