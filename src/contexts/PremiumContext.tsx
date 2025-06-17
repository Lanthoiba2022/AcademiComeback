import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { CustomerInfo, Offerings, Package } from '@revenuecat/purchases-js'
import { 
  initializeRevenueCat, 
  getCustomerInfo, 
  hasPremiumAccess, 
  isInTrialPeriod, 
  getTrialDaysRemaining,
  setupCustomerInfoListener,
  getOfferings,
  purchasePackage,
  ENTITLEMENTS,
  PRODUCTS
} from '../lib/revenuecat'

export type SubscriptionLevel = 'free' | 'student' | 'pro'

export interface PremiumContextType {
  // Premium status
  isPremium: boolean
  isTrialActive: boolean
  trialDaysRemaining: number
  subscriptionLevel: SubscriptionLevel
  
  // Feature access
  hasAIFeatures: boolean
  hasAdvancedAnalytics: boolean
  hasCollaborationPlus: boolean
  hasNFTCredentials: boolean
  
  // Customer info
  customerInfo: CustomerInfo | null
  
  // Offerings
  offerings: Offerings | null
  
  // Loading states
  isLoading: boolean
  isInitialized: boolean
  
  // Purchase state
  purchasing: string | null
  
  // Actions
  refreshCustomerInfo: () => Promise<void>
  initializePremium: (userIdOverride?: string) => Promise<void>
  refreshOfferings: () => Promise<void>
  handleSuccessfulPayment: () => Promise<boolean>
  handlePurchase: (pkg: Package) => Promise<boolean>
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined)

interface PremiumProviderProps {
  children: ReactNode
  userId?: string // Optional user ID for identified users
}

// Helper function to determine subscription level
const getSubscriptionLevel = (customerInfo: CustomerInfo | null): SubscriptionLevel => {
  if (!customerInfo) return 'free'
  
  const premiumEntitlement = customerInfo.entitlements.active['premium']
  if (!premiumEntitlement) return 'free'
  
  // Check product identifier to determine level
  const productId = premiumEntitlement.productIdentifier
  if (productId.includes('pro')) return 'pro'
  if (productId.includes('student')) return 'student'
  
  return 'free'
}

// Helper function to check feature access based on subscription level
const hasFeatureAccess = (level: SubscriptionLevel, feature: string): boolean => {
  switch (feature) {
    case 'ai':
      return level !== 'free'
    case 'analytics':
      return level === 'pro'
    case 'collaboration':
      return level !== 'free'
    case 'nft':
      return level === 'pro'
    default:
      return level !== 'free'
  }
}

export const PremiumProvider: React.FC<PremiumProviderProps> = ({ 
  children, 
  userId 
}) => {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null)
  const [offerings, setOfferings] = useState<Offerings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [subscriptionLevel, setSubscriptionLevel] = useState<SubscriptionLevel>('free')

  // Derived state
  const isPremium = hasPremiumAccess(customerInfo)
  const isTrialActive = isInTrialPeriod(customerInfo)
  const trialDaysRemaining = getTrialDaysRemaining(customerInfo)

  // Feature access based on subscription level
  const hasAIFeatures = hasFeatureAccess(subscriptionLevel, 'ai')
  const hasAdvancedAnalytics = hasFeatureAccess(subscriptionLevel, 'analytics')
  const hasCollaborationPlus = hasFeatureAccess(subscriptionLevel, 'collaboration')
  const hasNFTCredentials = hasFeatureAccess(subscriptionLevel, 'nft')

  // Helper function to determine subscription level from package
  const getSubscriptionLevelFromPackage = (pkg: Package): SubscriptionLevel => {
    const identifier = pkg.identifier.toLowerCase()
    if (identifier.includes('pro') || identifier.includes('19')) {
      return 'pro'
    } else if (identifier.includes('student') || identifier.includes('9')) {
      return 'student'
    }
    return 'free'
  }

  // Helper function to verify payment success
  const verifyPaymentSuccess = async (customerInfo: CustomerInfo | null): Promise<boolean> => {
    if (!customerInfo) return false

    // Log the full customer info for debugging
    console.log('Customer info for verification:', customerInfo)

    // Check if user has an active subscription
    const hasActiveSubscription = customerInfo.activeSubscriptions.size > 0
    if (!hasActiveSubscription) {
      console.error('No active subscription found')
      return false
    }

    console.log('Payment verified successfully:', {
      activeSubscriptions: Array.from(customerInfo.activeSubscriptions),
      entitlements: Object.keys(customerInfo.entitlements.active)
    })

    return true
  }

  // Handle successful payment
  const handleSuccessfulPayment = async () => {
    try {
      // Refresh customer info to ensure we have the latest data
      const latestCustomerInfo = await getCustomerInfo()
      if (!latestCustomerInfo) {
        throw new Error('Failed to verify payment status')
      }

      // Verify the payment was successful
      const isPaymentVerified = await verifyPaymentSuccess(latestCustomerInfo)
      if (!isPaymentVerified) {
        throw new Error('Payment verification failed')
      }

      // Update customer info and subscription level
      setCustomerInfo(latestCustomerInfo)
      
      // Determine new subscription level from the active entitlement
      const premiumEntitlement = latestCustomerInfo.entitlements.active[ENTITLEMENTS.PREMIUM]
      if (premiumEntitlement) {
        const productId = premiumEntitlement.productIdentifier.toLowerCase()
        const newLevel = productId.includes('pro') || productId.includes('19') 
          ? 'pro' 
          : productId.includes('student') || productId.includes('9')
            ? 'student'
            : 'free'
        setSubscriptionLevel(newLevel)
      }

      console.log('✅ Payment verified and subscription level updated:', {
        subscriptionLevel,
        entitlements: Object.keys(latestCustomerInfo.entitlements.active),
        expirationDate: premiumEntitlement?.expirationDate
      })

      return true
    } catch (error) {
      console.error('❌ Failed to handle successful payment:', error)
      throw error
    }
  }

  // Initialize RevenueCat and load customer info
  const initializePremium = async (userIdOverride?: string) => {
    try {
      setIsLoading(true)
      
      // Initialize RevenueCat with user ID
      const finalUserId = userIdOverride || userId
      await initializeRevenueCat(finalUserId)
      
      // Load initial customer info and offerings
      const [initialCustomerInfo, initialOfferings] = await Promise.all([
        getCustomerInfo(),
        getOfferings()
      ])
      
      setCustomerInfo(initialCustomerInfo)
      setOfferings(initialOfferings)
      
      setIsInitialized(true)
      console.log('✅ Premium context initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize premium context:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh customer info
  const refreshCustomerInfo = async () => {
    try {
      const updatedCustomerInfo = await getCustomerInfo()
      setCustomerInfo(updatedCustomerInfo)
      console.log('✅ Customer info refreshed')
    } catch (error) {
      console.error('❌ Failed to refresh customer info:', error)
    }
  }

  // Refresh offerings
  const refreshOfferings = async () => {
    try {
      const updatedOfferings = await getOfferings()
      setOfferings(updatedOfferings)
      console.log('✅ Offerings refreshed')
    } catch (error) {
      console.error('❌ Failed to refresh offerings:', error)
    }
  }

  // Initialize on mount
  useEffect(() => {
    initializePremium()
  }, [userId])

  // Set up customer info listener for real-time updates
  useEffect(() => {
    if (!isInitialized) return

    const removeListener = setupCustomerInfoListener((updatedCustomerInfo) => {
      console.log('🔔 Customer info updated:', updatedCustomerInfo)
      setCustomerInfo(updatedCustomerInfo)
    })

    return removeListener
  }, [isInitialized])

  // Log premium status changes
  useEffect(() => {
    if (isInitialized) {
      console.log('Premium status:', {
        isPremium,
        isTrialActive,
        trialDaysRemaining,
        hasActiveEntitlements: customerInfo ? Object.keys(customerInfo.entitlements.active).length > 0 : false,
        hasOfferings: offerings !== null
      })
    }
  }, [isPremium, isTrialActive, trialDaysRemaining, isInitialized, offerings])

  const value: PremiumContextType = {
    // Premium status
    isPremium,
    isTrialActive,
    trialDaysRemaining,
    subscriptionLevel,
    
    // Feature access
    hasAIFeatures,
    hasAdvancedAnalytics,
    hasCollaborationPlus,
    hasNFTCredentials,
    
    // Customer info
    customerInfo,
    
    // Offerings
    offerings,
    
    // Loading states
    isLoading,
    isInitialized,
    
    // Purchase state
    purchasing,
    
    // Actions
    refreshCustomerInfo,
    initializePremium,
    refreshOfferings,
    handleSuccessfulPayment,
    handlePurchase: async (pkg: Package): Promise<boolean> => {
      try {
        setPurchasing(pkg.identifier)
        
        const { customerInfo, success, error } = await purchasePackage(pkg)
        
        if (success && customerInfo) {
          // Update customer info and subscription level
          setCustomerInfo(customerInfo)
          const newLevel = getSubscriptionLevelFromPackage(pkg)
          setSubscriptionLevel(newLevel)
          
          console.log('✅ Purchase successful:', {
            package: pkg.identifier,
            newLevel,
            entitlements: Object.keys(customerInfo.entitlements.active)
          })
          
          return true
        } else {
          console.error('❌ Purchase failed:', error)
          return false
        }
      } catch (error) {
        console.error('❌ Purchase error:', error)
        return false
      } finally {
        setPurchasing(null)
      }
    },
  }

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  )
}

// Hook to use premium context
export const usePremium = (): PremiumContextType => {
  const context = useContext(PremiumContext)
  if (context === undefined) {
    throw new Error('usePremium must be used within a PremiumProvider')
  }
  return context
}

// Helper hook for checking specific entitlements
export const useEntitlement = (entitlementKey: keyof typeof ENTITLEMENTS) => {
  const { customerInfo } = usePremium()
  
  const hasEntitlement = customerInfo 
    ? ENTITLEMENTS[entitlementKey] in customerInfo.entitlements.active
    : false
    
  const entitlementInfo = customerInfo?.entitlements.active[ENTITLEMENTS[entitlementKey]] || null
  
  return {
    hasEntitlement,
    entitlementInfo,
    isActive: entitlementInfo?.isActive || false,
    willRenew: entitlementInfo?.willRenew || false,
    expirationDate: entitlementInfo?.expirationDate || null,
  }
}