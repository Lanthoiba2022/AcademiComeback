import { 
  Purchases,
  CustomerInfo, 
  Offerings, 
  PurchasesPackage,
  PurchasesEntitlementInfo,
  LogLevel,
  ErrorCode,
  PurchasesError
} from '@revenuecat/purchases-js'

// RevenueCat configuration
const REVENUECAT_PUBLIC_API_KEY = import.meta.env.VITE_REVENUECAT_PUBLIC_API_KEY || ''
const REVENUECAT_SANDBOX_API_KEY = import.meta.env.VITE_REVENUECAT_SANDBOX_API_KEY || ''

// Use sandbox key in development, public key in production
const getApiKey = () => {
  return import.meta.env.DEV ? REVENUECAT_SANDBOX_API_KEY : REVENUECAT_PUBLIC_API_KEY
}

// Premium entitlement identifiers (should match your RevenueCat dashboard)
export const ENTITLEMENTS = {
  PREMIUM: 'student_monthly', // This should match your entitlement identifier
} as const

export type EntitlementKey = keyof typeof ENTITLEMENTS

// Subscription product identifiers (should match your RevenueCat dashboard)
export const PRODUCTS = {
  STUDENT_MONTHLY: 'subscription_student_monthly_9', // $9/month
  PRO_MONTHLY: 'subscription_pro_monthly_19', // $19/month
} as const

// Initialize RevenueCat
export const initializeRevenueCat = async (userId?: string): Promise<void> => {
  try {
    const apiKey = getApiKey()
    
    if (!apiKey) {
      console.warn('RevenueCat API key not found. Premium features will be disabled.')
      return
    }

    // Generate anonymous user ID if none provided
    const appUserId = userId || Purchases.generateRevenueCatAnonymousAppUserId()

    // Configure RevenueCat with the correct API key
    const purchases = Purchases.configure(apiKey, appUserId)

    // Set log level for debugging in development
    if (import.meta.env.DEV) {
      Purchases.setLogLevel(LogLevel.Debug)
    }

    console.log('✅ RevenueCat initialized successfully with user ID:', appUserId)
    return Promise.resolve()
  } catch (error) {
    console.error('❌ Failed to initialize RevenueCat:', error)
    throw error
  }
}

// Get customer info with entitlements
export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
  try {
    const customerInfo = await Purchases.getSharedInstance().getCustomerInfo()
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
export const getOfferings = async (currency?: string): Promise<Offerings | null> => {
  try {
    const options = currency ? { currency } : undefined
    const offerings = await Purchases.getSharedInstance().getOfferings(options)
    
    console.log('🛍️ Offerings retrieved:', {
      current: offerings.current?.identifier,
      all: Object.keys(offerings.all),
      packages: offerings.current?.availablePackages.length || 0
    })
    return offerings
  } catch (error) {
    console.error('❌ Failed to get offerings:', error)
    return null
  }
}

// Purchase a package
export const purchasePackage = async (packageToPurchase: PurchasesPackage): Promise<{
  customerInfo: CustomerInfo | null
  success: boolean
  error?: string
}> => {
  try {
    console.log('💳 Attempting to purchase package:', packageToPurchase.identifier)
    
    const { customerInfo } = await Purchases.getSharedInstance().purchase({
      rcPackage: packageToPurchase,
    })
    
    console.log('✅ Purchase successful:', {
      activeSubscriptions: Object.keys(customerInfo.activeSubscriptions),
      entitlements: Object.keys(customerInfo.entitlements.active)
    })
    
    return { customerInfo, success: true }
  } catch (error: any) {
    console.error('❌ Purchase failed:', error)
    
    // Handle specific error cases
    if (error instanceof PurchasesError) {
      if (error.errorCode === ErrorCode.UserCancelledError) {
        return { 
          customerInfo: error.customerInfo || null, 
          success: false, 
          error: 'Purchase cancelled by user' 
        }
      }
    }
    
    return { 
      customerInfo: error.customerInfo || null, 
      success: false, 
      error: error.message || 'Purchase failed' 
    }
  }
}

// Restore purchases (Note: Web SDK doesn't have traditional restore functionality like mobile)
export const restorePurchases = async (): Promise<CustomerInfo | null> => {
  try {
    console.log('🔄 Getting current customer info (Web SDK restore equivalent)...')
    
    // For Web SDK, we just refresh the customer info
    const customerInfo = await Purchases.getSharedInstance().getCustomerInfo()
    
    console.log('✅ Customer info refreshed:', {
      activeSubscriptions: Object.keys(customerInfo.activeSubscriptions),
      entitlements: Object.keys(customerInfo.entitlements.active)
    })
    
    return customerInfo
  } catch (error) {
    console.error('❌ Failed to refresh customer info:', error)
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
    (entitlement: PurchasesEntitlementInfo) => 
      entitlement.willRenew && entitlement.periodType === 'trial'
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

// Set up customer info polling for real-time updates (Web SDK alternative to listeners)
export const setupCustomerInfoListener = (
  callback: (customerInfo: CustomerInfo) => void
): (() => void) => {
  console.log('🔄 Setting up customer info polling...')
  
  let isPolling = true
  let lastCustomerInfo: CustomerInfo | null = null
  
  const pollInterval = setInterval(async () => {
    if (!isPolling) return
    
    try {
      const currentCustomerInfo = await getCustomerInfo()
      
      // Only call callback if customer info has changed
      if (currentCustomerInfo && 
          JSON.stringify(currentCustomerInfo) !== JSON.stringify(lastCustomerInfo)) {
        lastCustomerInfo = currentCustomerInfo
        callback(currentCustomerInfo)
      }
    } catch (error) {
      console.error('❌ Error polling customer info:', error)
    }
  }, 5000) // Poll every 5 seconds
  
  return () => {
    console.log('🔄 Stopping customer info polling...')
    isPolling = false
    clearInterval(pollInterval)
  }
}

// Login user to RevenueCat (for identified users)
export const loginRevenueCat = async (appUserId: string): Promise<CustomerInfo | null> => {
  try {
    const { customerInfo } = await Purchases.getSharedInstance().logIn(appUserId)
    console.log('✅ RevenueCat login successful for user:', appUserId)
    return customerInfo
  } catch (error) {
    console.error('❌ RevenueCat login failed:', error)
    return null
  }
}

// Logout user from RevenueCat
export const logoutRevenueCat = async (): Promise<CustomerInfo | null> => {
  try {
    const { customerInfo } = await Purchases.getSharedInstance().logOut()
    console.log('✅ RevenueCat logout successful')
    return customerInfo
  } catch (error) {
    console.error('❌ RevenueCat logout failed:', error)
    return null
  }
}

// Check if RevenueCat is properly configured
export const isRevenueCatConfigured = (): boolean => {
  try {
    Purchases.getSharedInstance()
    return true
  } catch {
    return false
  }
}