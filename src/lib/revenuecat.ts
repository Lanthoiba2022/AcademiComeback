import Purchases, { 
  CustomerInfo, 
  Offerings, 
  PurchasesPackage,
  PurchasesEntitlementInfo,
  LOG_LEVEL 
} from '@revenuecat/purchases'

// RevenueCat configuration
const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY || ''

// Premium entitlement identifiers
export const ENTITLEMENTS = {
  PREMIUM: 'premium',
  AI_FEATURES: 'ai_features',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  COLLABORATION_PLUS: 'collaboration_plus',
  NFT_CREDENTIALS: 'nft_credentials'
} as const

export type EntitlementKey = keyof typeof ENTITLEMENTS

// Subscription product identifiers
export const PRODUCTS = {
  MONTHLY: 'studysync_premium_monthly',
  YEARLY: 'studysync_premium_yearly'
} as const

// Initialize RevenueCat
export const initializeRevenueCat = async (userId: string): Promise<void> => {
  try {
    if (!REVENUECAT_API_KEY) {
      console.warn('RevenueCat API key not found. Premium features will be disabled.')
      return
    }

    // Configure RevenueCat
    await Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      appUserID: userId,
      usesStoreKit2IfAvailable: false // Use StoreKit 1 for better web compatibility
    })

    // Set log level for debugging in development
    if (import.meta.env.DEV) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG)
    }

    console.log('✅ RevenueCat initialized successfully')
  } catch (error) {
    console.error('❌ Failed to initialize RevenueCat:', error)
    throw error
  }
}

// Get customer info with entitlements
export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
  try {
    const customerInfo = await Purchases.getCustomerInfo()
    console.log('📊 Customer info retrieved:', {
      originalAppUserId: customerInfo.originalAppUserId,
      activeSubscriptions: Object.keys(customerInfo.activeSubscriptions),
      entitlements: Object.keys(customerInfo.entitlements.active),
      latestExpirationDate: customerInfo.latestExpirationDate
    })
    return customerInfo
  } catch (error) {
    console.error('❌ Failed to get customer info:', error)
    return null
  }
}

// Get available offerings
export const getOfferings = async (): Promise<Offerings | null> => {
  try {
    const offerings = await Purchases.getOfferings()
    console.log('🛍️ Offerings retrieved:', {
      current: offerings.current?.identifier,
      all: Object.keys(offerings.all)
    })
    return offerings
  } catch (error) {
    console.error('❌ Failed to get offerings:', error)
    return null
  }
}

// Purchase a package
export const purchasePackage = async (packageToPurchase: PurchasesPackage): Promise<{
  customerInfo: CustomerInfo
  success: boolean
  error?: string
}> => {
  try {
    console.log('💳 Attempting to purchase package:', packageToPurchase.identifier)
    
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase)
    
    console.log('✅ Purchase successful:', {
      activeSubscriptions: Object.keys(customerInfo.activeSubscriptions),
      entitlements: Object.keys(customerInfo.entitlements.active)
    })
    
    return { customerInfo, success: true }
  } catch (error: any) {
    console.error('❌ Purchase failed:', error)
    
    // Handle specific error cases
    if (error.userCancelled) {
      return { customerInfo: error.customerInfo, success: false, error: 'Purchase cancelled by user' }
    }
    
    return { 
      customerInfo: error.customerInfo || null, 
      success: false, 
      error: error.message || 'Purchase failed' 
    }
  }
}

// Restore purchases
export const restorePurchases = async (): Promise<CustomerInfo | null> => {
  try {
    console.log('🔄 Restoring purchases...')
    const customerInfo = await Purchases.restorePurchases()
    
    console.log('✅ Purchases restored:', {
      activeSubscriptions: Object.keys(customerInfo.activeSubscriptions),
      entitlements: Object.keys(customerInfo.entitlements.active)
    })
    
    return customerInfo
  } catch (error) {
    console.error('❌ Failed to restore purchases:', error)
    return null
  }
}

// Check if user has specific entitlement
export const hasEntitlement = (customerInfo: CustomerInfo | null, entitlement: string): boolean => {
  if (!customerInfo) return false
  
  const entitlementInfo = customerInfo.entitlements.active[entitlement]
  return entitlementInfo?.isActive === true
}

// Check if user has premium access
export const hasPremiumAccess = (customerInfo: CustomerInfo | null): boolean => {
  return hasEntitlement(customerInfo, ENTITLEMENTS.PREMIUM)
}

// Get entitlement expiration date
export const getEntitlementExpirationDate = (
  customerInfo: CustomerInfo | null, 
  entitlement: string
): Date | null => {
  if (!customerInfo) return null
  
  const entitlementInfo = customerInfo.entitlements.active[entitlement]
  return entitlementInfo?.expirationDate || null
}

// Check if user is in trial period
export const isInTrialPeriod = (customerInfo: CustomerInfo | null): boolean => {
  if (!customerInfo) return false
  
  // Check if any active entitlement is in trial period
  return Object.values(customerInfo.entitlements.active).some(
    (entitlement: PurchasesEntitlementInfo) => entitlement.willRenew && entitlement.periodType === 'trial'
  )
}

// Get trial days remaining
export const getTrialDaysRemaining = (customerInfo: CustomerInfo | null): number => {
  if (!customerInfo || !isInTrialPeriod(customerInfo)) return 0
  
  const premiumEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM]
  if (!premiumEntitlement?.expirationDate) return 0
  
  const now = new Date()
  const expirationDate = new Date(premiumEntitlement.expirationDate)
  const diffTime = expirationDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.max(0, diffDays)
}

// Set up customer info listener for real-time updates
export const setupCustomerInfoListener = (
  callback: (customerInfo: CustomerInfo) => void
): (() => void) => {
  console.log('🔄 Setting up customer info listener...')
  
  const listener = Purchases.addCustomerInfoUpdateListener(callback)
  
  return () => {
    console.log('🔄 Removing customer info listener...')
    listener.remove()
  }
}

// Logout user from RevenueCat
export const logoutRevenueCat = async (): Promise<void> => {
  try {
    await Purchases.logOut()
    console.log('✅ RevenueCat logout successful')
  } catch (error) {
    console.error('❌ RevenueCat logout failed:', error)
  }
}