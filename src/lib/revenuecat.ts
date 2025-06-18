import { 
  Purchases,
  CustomerInfo, 
  Offerings, 
  Package,
  EntitlementInfo,
  LogLevel,
  ErrorCode,
  PurchasesError
} from '@revenuecat/purchases-js'
import { supabase } from './supabase'

// RevenueCat configuration
const REVENUECAT_PUBLIC_API_KEY = import.meta.env.VITE_REVENUECAT_PUBLIC_API_KEY || ''
const REVENUECAT_SANDBOX_API_KEY = import.meta.env.VITE_REVENUECAT_SANDBOX_API_KEY || ''
const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY || ''
const REVENUECAT_API_KEY_ANDROID = import.meta.env.VITE_REVENUECAT_API_KEY_ANDROID || ''

// Use sandbox key in development, public key in production
const getApiKey = () => {
  const key = import.meta.env.DEV ? REVENUECAT_SANDBOX_API_KEY : REVENUECAT_PUBLIC_API_KEY
  if (!key) {
    throw new Error('RevenueCat API key not found. Please check your environment variables.')
  }
  return key
}

// Get stored RevenueCat ID from Supabase
async function getStoredAnonymousId(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('revenuecat_id')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching RevenueCat ID:', error)
      return null
    }

    return data?.revenuecat_id || null
  } catch (error) {
    console.error('Error in getStoredAnonymousId:', error)
    return null
  }
}

// Store RevenueCat ID in Supabase
async function storeAnonymousId(userId: string, anonymousId: string): Promise<boolean> {
  try {
    // First check if the ID already exists
    const existingId = await getStoredAnonymousId(userId)
    if (existingId) {
      console.log('RevenueCat ID already exists for user:', existingId)
      return true
    }

    const { error } = await supabase
      .from('profiles')
      .update({ revenuecat_id: anonymousId })
      .eq('id', userId)

    if (error) {
      console.error('Error storing RevenueCat ID:', error)
      return false
    }

    console.log('Successfully stored RevenueCat ID:', anonymousId)
    return true
  } catch (error) {
    console.error('Error in storeAnonymousId:', error)
    return false
  }
}

// Premium entitlement identifiers (should match your RevenueCat dashboard)
export const ENTITLEMENTS = {
  PREMIUM: 'student_monthly', // This should match your entitlement identifier
} as const

export type EntitlementKey = keyof typeof ENTITLEMENTS

// Subscription product identifiers (should match your RevenueCat dashboard)
export const PRODUCTS = {
  STUDENT_MONTHLY: '$rc_monthly', // $9/month
  PRO_MONTHLY: 'pro_monthly_package', // $19/month
} as const

// Initialize RevenueCat
export async function initializeRevenueCat(): Promise<void> {
  try {
    const apiKey = getApiKey();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No user found, initializing RevenueCat anonymously');
      // Generate a temporary anonymous ID
      const tempId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await Purchases.configure(apiKey, tempId);
      return;
    }

    // Try to get existing RevenueCat ID from database
    const existingId = await getStoredAnonymousId(user.id);
    
    if (existingId) {
      console.log('Using existing RevenueCat ID:', existingId);
      await Purchases.configure(apiKey, existingId);
    } else {
      console.log('No existing RevenueCat ID found, generating new one');
      // Use the user's ID as the initial RevenueCat ID
      await Purchases.configure(apiKey, user.id);

      // Get the generated ID and store it
      const customerInfo = await Purchases.getSharedInstance().getCustomerInfo();
      if (customerInfo.originalAppUserId) {
        await storeAnonymousId(user.id, customerInfo.originalAppUserId);
      }
    }

    // Set log level to debug in development
    if (import.meta.env.DEV) {
      Purchases.setLogLevel(LogLevel.Debug);
    }
  } catch (error) {
    console.error('Error initializing RevenueCat:', error);
    throw error;
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
      expirationDate: customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM]?.expirationDate
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
export const purchasePackage = async (packageToPurchase: Package): Promise<{
  customerInfo: CustomerInfo | null
  success: boolean
  error?: string
}> => {
  try {
    console.log('💳 Attempting to purchase package:', packageToPurchase.identifier)
    
    // Configure purchase options
    const purchaseOptions = {
      rcPackage: packageToPurchase,
      // Add any additional purchase options here
      displayMode: 'modal' // This ensures the payment modal is shown
    }
    
    const { customerInfo } = await Purchases.getSharedInstance().purchase(purchaseOptions)
    
    // Get the current user ID from Supabase
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // Store the RevenueCat ID in the database after successful purchase
      await storeAnonymousId(user.id, customerInfo.originalAppUserId)
    }
    
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
          customerInfo: null, 
          success: false, 
          error: 'Purchase cancelled by user' 
        }
      }
    }
    
    return { 
      customerInfo: null, 
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
    (entitlement: EntitlementInfo) => 
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
    const customerInfo = await Purchases.getSharedInstance().getCustomerInfo()
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
    const customerInfo = await Purchases.getSharedInstance().getCustomerInfo()
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