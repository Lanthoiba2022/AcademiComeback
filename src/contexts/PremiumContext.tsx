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
  handleSuccessfulPayment: (customerInfo: CustomerInfo) => Promise<boolean>
  handlePurchase: (pkg: Package) => Promise<boolean>
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined)

interface PremiumProviderProps {
  children: ReactNode
  userId?: string // Optional user ID for identified users
}

// Helper function to determine subscription level
const getSubscriptionLevel = (info: CustomerInfo | null): SubscriptionLevel => {
  if (!info) return 'free'
  
  // Check active entitlements first
  const entitlements = Object.keys(info.entitlements.active)
  console.log('Active entitlements:', entitlements)
  
  if (entitlements.includes('pro')) {
    return 'pro'
  }
  if (entitlements.includes('student')) {
    return 'student'
  }
  
  // If no entitlements, check active subscriptions
  const activeSubscriptions = Array.from(info.activeSubscriptions)
  console.log('Active subscriptions:', activeSubscriptions)
  
  if (activeSubscriptions.includes('pro_monthly_package')) {
    return 'pro'
  }
  if (activeSubscriptions.includes('$rc_monthly')) {
    return 'student'
  }
  
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
  const [error, setError] = useState<string | null>(null)

  // Derived state
  const isPremium = hasPremiumAccess(customerInfo)
  const isTrialActive = isInTrialPeriod(customerInfo)
  const trialDaysRemaining = getTrialDaysRemaining(customerInfo)

  // Feature access based on subscription level
  const hasAIFeatures = hasFeatureAccess(subscriptionLevel, 'ai')
  const hasAdvancedAnalytics = hasFeatureAccess(subscriptionLevel, 'analytics')
  const hasCollaborationPlus = hasFeatureAccess(subscriptionLevel, 'collaboration')
  const hasNFTCredentials = hasFeatureAccess(subscriptionLevel, 'nft')

  // Helper function to verify payment success
  const verifyPaymentSuccess = async (info: CustomerInfo | null): Promise<boolean> => {
    if (!info) return false

    // Log the full customer info for debugging
    console.log('Customer info for verification:', info)

    // Check if user has an active subscription
    const hasActiveSubscription = info.activeSubscriptions.size > 0
    if (!hasActiveSubscription) {
      console.error('No active subscription found')
      return false
    }

    console.log('Payment verified successfully:', {
      activeSubscriptions: Array.from(info.activeSubscriptions),
      entitlements: Object.keys(info.entitlements.active)
    })

    return true
  }

  // Handle successful payment
  const handleSuccessfulPayment = async (customerInfo: CustomerInfo) => {
    try {
      // Update customer info
      setCustomerInfo(customerInfo)
      // Determine new subscription level from the active entitlements
      const entitlements = Object.keys(customerInfo.entitlements.active)
      let newLevel: SubscriptionLevel = 'free'
      if (entitlements.includes('pro')) {
        newLevel = 'pro'
      } else if (entitlements.includes('student')) {
        newLevel = 'student'
      }
      setSubscriptionLevel(newLevel)
      // Verify the payment was successful
      const isPaymentVerified = await verifyPaymentSuccess(customerInfo)
      if (!isPaymentVerified) {
        throw new Error('Payment verification failed')
      }
      console.log('✅ Payment verified and subscription level updated:', {
        subscriptionLevel: newLevel,
        entitlements: Object.keys(customerInfo.entitlements.active),
        expirationDate: null
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
      setError(null)
      
      // Initialize RevenueCat with user ID
      const finalUserId = userIdOverride || userId
      await initializeRevenueCat(finalUserId)
      
      // Load initial customer info and offerings
      const [initialCustomerInfo, initialOfferings] = await Promise.all([
        getCustomerInfo(),
        getOfferings()
      ])
      
      if (initialCustomerInfo) {
        setCustomerInfo(initialCustomerInfo)
        const newLevel = getSubscriptionLevel(initialCustomerInfo)
        setSubscriptionLevel(newLevel)
      }
      
      setOfferings(initialOfferings)
      setIsInitialized(true)
      console.log('✅ Premium context initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize premium context:', error)
      setError(error instanceof Error ? error.message : 'Failed to initialize premium features')
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

  // Update subscription level when customer info changes
  useEffect(() => {
    if (customerInfo) {
      const newLevel = getSubscriptionLevel(customerInfo)
      console.log('Updating subscription level:', { 
        current: subscriptionLevel, 
        new: newLevel,
        entitlements: Object.keys(customerInfo.entitlements.active),
        activeSubscriptions: Array.from(customerInfo.activeSubscriptions)
      })
      setSubscriptionLevel(newLevel)
    }
  }, [customerInfo])

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

    return () => {
      removeListener()
    }
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
        
        const { customerInfo: newCustomerInfo, success, error } = await purchasePackage(pkg)
        
        if (success && newCustomerInfo) {
          // Update customer info
          setCustomerInfo(newCustomerInfo)
          
          // Determine new subscription level from the package
          const newLevel = getSubscriptionLevel(newCustomerInfo)
          setSubscriptionLevel(newLevel)
          
          // Verify the purchase was successful
          const isPaymentVerified = await verifyPaymentSuccess(newCustomerInfo)
          if (!isPaymentVerified) {
            console.error('❌ Payment verification failed')
            return false
          }

          // Handle successful payment
          await handleSuccessfulPayment(newCustomerInfo)
          
          console.log('✅ Purchase successful:', {
            package: pkg.identifier,
            newLevel,
            entitlements: Object.keys(newCustomerInfo.entitlements.active)
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

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error initializing premium features: {error}
      </div>
    )
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