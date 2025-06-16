import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { CustomerInfo } from '@revenuecat/purchases'
import { useAuth } from './AuthContext'
import {
  initializeRevenueCat,
  getCustomerInfo,
  setupCustomerInfoListener,
  logoutRevenueCat,
  hasPremiumAccess,
  hasEntitlement,
  isInTrialPeriod,
  getTrialDaysRemaining,
  ENTITLEMENTS
} from '../lib/revenuecat'

interface PremiumContextType {
  customerInfo: CustomerInfo | null
  loading: boolean
  error: string | null
  isPremium: boolean
  isTrialActive: boolean
  trialDaysRemaining: number
  hasAIFeatures: boolean
  hasAdvancedAnalytics: boolean
  hasCollaborationPlus: boolean
  hasNFTCredentials: boolean
  refreshCustomerInfo: () => Promise<void>
  checkEntitlement: (entitlement: string) => boolean
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined)

export const usePremium = () => {
  const context = useContext(PremiumContext)
  if (context === undefined) {
    throw new Error('usePremium must be used within a PremiumProvider')
  }
  return context
}

interface PremiumProviderProps {
  children: ReactNode
}

export const PremiumProvider = ({ children }: PremiumProviderProps) => {
  const { user } = useAuth()
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize RevenueCat when user logs in
  useEffect(() => {
    const initializePremium = async () => {
      if (!user) {
        setCustomerInfo(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Initialize RevenueCat with user ID
        await initializeRevenueCat(user.id)

        // Get initial customer info
        const info = await getCustomerInfo()
        setCustomerInfo(info)

        console.log('✅ Premium context initialized for user:', user.id)
      } catch (err) {
        console.error('❌ Failed to initialize premium context:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize premium features')
      } finally {
        setLoading(false)
      }
    }

    initializePremium()
  }, [user])

  // Set up real-time customer info listener
  useEffect(() => {
    if (!user || !customerInfo) return

    console.log('🔄 Setting up real-time premium updates...')

    const removeListener = setupCustomerInfoListener((updatedCustomerInfo) => {
      console.log('📡 Real-time customer info update received')
      setCustomerInfo(updatedCustomerInfo)
      
      // Log entitlement changes
      const activeEntitlements = Object.keys(updatedCustomerInfo.entitlements.active)
      console.log('🎯 Active entitlements updated:', activeEntitlements)
    })

    return removeListener
  }, [user, customerInfo])

  // Cleanup on logout
  useEffect(() => {
    if (!user) {
      const cleanup = async () => {
        try {
          await logoutRevenueCat()
          setCustomerInfo(null)
          setError(null)
        } catch (err) {
          console.error('❌ Failed to cleanup RevenueCat:', err)
        }
      }
      cleanup()
    }
  }, [user])

  // Refresh customer info manually
  const refreshCustomerInfo = async () => {
    try {
      setLoading(true)
      const info = await getCustomerInfo()
      setCustomerInfo(info)
    } catch (err) {
      console.error('❌ Failed to refresh customer info:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh premium status')
    } finally {
      setLoading(false)
    }
  }

  // Check specific entitlement
  const checkEntitlement = (entitlement: string): boolean => {
    return hasEntitlement(customerInfo, entitlement)
  }

  // Computed premium status
  const isPremium = hasPremiumAccess(customerInfo)
  const isTrialActive = isInTrialPeriod(customerInfo)
  const trialDaysRemaining = getTrialDaysRemaining(customerInfo)

  // Feature-specific entitlements
  const hasAIFeatures = checkEntitlement(ENTITLEMENTS.AI_FEATURES) || isPremium
  const hasAdvancedAnalytics = checkEntitlement(ENTITLEMENTS.ADVANCED_ANALYTICS) || isPremium
  const hasCollaborationPlus = checkEntitlement(ENTITLEMENTS.COLLABORATION_PLUS) || isPremium
  const hasNFTCredentials = checkEntitlement(ENTITLEMENTS.NFT_CREDENTIALS) || isPremium

  const value: PremiumContextType = {
    customerInfo,
    loading,
    error,
    isPremium,
    isTrialActive,
    trialDaysRemaining,
    hasAIFeatures,
    hasAdvancedAnalytics,
    hasCollaborationPlus,
    hasNFTCredentials,
    refreshCustomerInfo,
    checkEntitlement
  }

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  )
}