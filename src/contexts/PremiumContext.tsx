import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { CustomerInfo, Offerings } from '@revenuecat/purchases-js'
import { 
  initializeRevenueCat, 
  getCustomerInfo, 
  hasPremiumAccess, 
  isInTrialPeriod, 
  getTrialDaysRemaining,
  setupCustomerInfoListener,
  getOfferings,
  ENTITLEMENTS
} from '../lib/revenuecat'

interface PremiumContextType {
  // Premium status
  isPremium: boolean
  isTrialActive: boolean
  trialDaysRemaining: number
  
  // Customer info
  customerInfo: CustomerInfo | null
  
  // Offerings
  offerings: Offerings | null
  
  // Loading states
  isLoading: boolean
  isInitialized: boolean
  
  // Actions
  refreshCustomerInfo: () => Promise<void>
  initializePremium: (userId?: string) => Promise<void>
  refreshOfferings: () => Promise<void>
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined)

interface PremiumProviderProps {
  children: ReactNode
  userId?: string // Optional user ID for identified users
}

export const PremiumProvider: React.FC<PremiumProviderProps> = ({ 
  children, 
  userId 
}) => {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null)
  const [offerings, setOfferings] = useState<Offerings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  // Derived state
  const isPremium = hasPremiumAccess(customerInfo)
  const isTrialActive = isInTrialPeriod(customerInfo)
  const trialDaysRemaining = getTrialDaysRemaining(customerInfo)

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
    
    // Customer info
    customerInfo,
    
    // Offerings
    offerings,
    
    // Loading states
    isLoading,
    isInitialized,
    
    // Actions
    refreshCustomerInfo,
    initializePremium,
    refreshOfferings,
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