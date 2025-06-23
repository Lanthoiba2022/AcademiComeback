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

// Use sandbox key in development, public key in production
const getApiKey = () => {
  const key = REVENUECAT_SANDBOX_API_KEY;
  if (!key) {
    throw new Error('RevenueCat SANDBOX API key not found. Please check your environment variables.')
  }
  return key;
}

// **CORRECTED ENTITLEMENTS - Match your RevenueCat dashboard**
export const ENTITLEMENTS = {
  STUDENT: 'student', // This matches your entitlement identifier
  PRO: 'pro', // This matches your pro entitlement identifier
} as const

export type EntitlementKey = keyof typeof ENTITLEMENTS

// **CORRECTED PRODUCTS - Match your RevenueCat dashboard**
export const PRODUCTS = {
  STUDENT_MONTHLY: 'student_monthly', // This matches your product identifier
  PRO_MONTHLY: 'pro_monthly', // This matches your product identifier
} as const

// Get stored RevenueCat ID from Supabase
async function getStoredRevenueCatId(userId: string): Promise<string | null> {
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
    console.error('Error in getStoredRevenueCatId:', error)
    return null
  }
}

// Store RevenueCat ID in Supabase
async function storeRevenueCatId(userId: string, revenueCatId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ revenuecat_id: revenueCatId })
      .eq('id', userId)

    if (error) {
      console.error('Error storing RevenueCat ID:', error)
      return false
    }

    console.log('Successfully stored RevenueCat ID:', revenueCatId)
    return true
  } catch (error) {
    console.error('Error in storeRevenueCatId:', error)
    return false
  }
}

let isConfigured = false;

// **CORRECTED Initialize RevenueCat**
export async function initializeRevenueCat(userIdOverride?: string): Promise<void> {
  if (isConfigured) return;
  try {
    const apiKey = getApiKey();
    let userId = userIdOverride;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found, cannot initialize RevenueCat');
        return;
      }
      userId = user.id;
    }
    let revenueCatUserId = await getStoredRevenueCatId(userId);
    if (!revenueCatUserId) {
      revenueCatUserId = userId;
      await storeRevenueCatId(userId, revenueCatUserId);
    }
    await Purchases.configure(apiKey, revenueCatUserId);
    if (import.meta.env.DEV) {
      Purchases.setLogLevel(LogLevel.Debug);
    }
    isConfigured = true;
    console.log('✅ RevenueCat initialized successfully for user:', revenueCatUserId);
  } catch (error) {
    console.error('❌ Error initializing RevenueCat:', error);
    throw error;
  }
}

// Get customer info with entitlements
export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
  if (!isConfigured) {
    console.warn('RevenueCat not configured, skipping getCustomerInfo');
    return null;
  }
  try {
    const customerInfo = await Purchases.getSharedInstance().getCustomerInfo()
    console.log('📊 Customer info retrieved:', {
      originalAppUserId: customerInfo.originalAppUserId,
      activeSubscriptions: Object.keys(customerInfo.activeSubscriptions),
      entitlements: Object.keys(customerInfo.entitlements.active),
      allEntitlements: customerInfo.entitlements
    })
    return customerInfo
  } catch (error) {
    console.error('❌ Failed to get customer info:', error)
    return null
  }
}

// Get available offerings
export const getOfferings = async (): Promise<Offerings | null> => {
  if (!isConfigured) {
    console.warn('RevenueCat not configured, skipping getOfferings');
    return null;
  }
  try {
    const offerings = await Purchases.getSharedInstance().getOfferings()
    console.log('🛍️ Offerings retrieved:', {
      current: offerings.current?.identifier,
      all: Object.keys(offerings.all),
      packages: offerings.current?.availablePackages.map(pkg => ({
        identifier: pkg.identifier,
        rcBillingProduct: pkg.rcBillingProduct
      })) || []
    })
    return offerings
  } catch (error) {
    console.error('❌ Failed to get offerings:', error)
    return null
  }
}

// **CORRECTED Purchase a package**
export const purchasePackage = async (packageToPurchase: Package): Promise<{
  customerInfo: CustomerInfo | null
  success: boolean
  error?: string
}> => {
  try {
    console.log('💳 Attempting to purchase package:', {
      identifier: packageToPurchase.identifier,
      rcBillingProduct: packageToPurchase.rcBillingProduct
    })
    
    const { customerInfo } = await Purchases.getSharedInstance().purchase({
      rcPackage: packageToPurchase
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
          customerInfo: null, 
          success: false, 
          error: 'Purchase cancelled by user' 
        }
      }
      if (error.errorCode === ErrorCode.PaymentPendingError) {
        return { 
          customerInfo: null, 
          success: false, 
          error: 'Payment is pending' 
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

// **CORRECTED Login user to RevenueCat - Web SDK uses changeUser**
export const loginRevenueCat = async (appUserId: string): Promise<CustomerInfo | null> => {
  try {
    // Web SDK uses changeUser() to switch users
    const customerInfo = await Purchases.getSharedInstance().changeUser(appUserId)
    console.log('✅ RevenueCat login successful for user:', appUserId)
    return customerInfo
  } catch (error) {
    console.error('❌ RevenueCat login failed:', error)
    return null
  }
}

// **CORRECTED Logout user from RevenueCat - Web SDK workaround**
export const logoutRevenueCat = async (): Promise<CustomerInfo | null> => {
  try {
    // Web SDK does not support true logout/reset. Use changeUser with a random UUID to simulate logout.
    const randomId = 'anon_' + Math.random().toString(36).substring(2, 15)
    const customerInfo = await Purchases.getSharedInstance().changeUser(randomId)
    console.log('✅ RevenueCat logout simulated by switching to anonymous user')
    return customerInfo
  } catch (error) {
    console.error('❌ RevenueCat logout failed:', error)
    return null
  }
}

// **CORRECTED Restore purchases - Web SDK workaround**
export const restorePurchases = async (): Promise<CustomerInfo | null> => {
  try {
    // Web SDK does not support restore/sync. Just refetch customer info.
    console.log('ℹ️ Restore purchases is not supported on RevenueCat Web SDK. Returning latest customer info.')
    const customerInfo = await getCustomerInfo()
    return customerInfo
  } catch (error) {
    console.error('❌ Failed to get customer info for restore:', error)
    return null
  }
}

// **CORRECTED Check if user has specific entitlement**
export const hasEntitlement = (customerInfo: CustomerInfo | null, entitlement: string): boolean => {
  if (!customerInfo) return false
  
  const entitlementInfo = customerInfo.entitlements.active[entitlement]
  const isActive = entitlementInfo?.isActive === true
  
  console.log(`🔍 Checking entitlement "${entitlement}":`, {
    exists: !!entitlementInfo,
    isActive,
    expirationDate: entitlementInfo?.expirationDate
  })
  
  return isActive
}

// **CORRECTED Check if user has student access**
export const hasStudentAccess = (customerInfo: CustomerInfo | null): boolean => {
  return hasEntitlement(customerInfo, ENTITLEMENTS.STUDENT)
}

// **CORRECTED Check if user has pro access**
export const hasProAccess = (customerInfo: CustomerInfo | null): boolean => {
  return hasEntitlement(customerInfo, ENTITLEMENTS.PRO)
}

// Check if user has any premium access
export const hasPremiumAccess = (customerInfo: CustomerInfo | null): boolean => {
  return hasStudentAccess(customerInfo) || hasProAccess(customerInfo)
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
  
  return Object.values(customerInfo.entitlements.active).some(
    (entitlement: EntitlementInfo) => 
      entitlement.willRenew && entitlement.periodType === 'trial'
  )
}

// Get trial days remaining
export const getTrialDaysRemaining = (customerInfo: CustomerInfo | null): number => {
  if (!customerInfo || !isInTrialPeriod(customerInfo)) return 0
  
  // Check both student and pro entitlements for trial
  const studentEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.STUDENT]
  const proEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PRO]
  
  const trialEntitlement = studentEntitlement?.periodType === 'trial' ? studentEntitlement : 
                          proEntitlement?.periodType === 'trial' ? proEntitlement : null
  
  if (!trialEntitlement?.expirationDate) return 0
  
  const now = new Date()
  const expirationDate = new Date(trialEntitlement.expirationDate)
  const diffTime = expirationDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.max(0, diffDays)
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

// **NEW: Get user subscription status**
export const getSubscriptionStatus = (customerInfo: CustomerInfo | null) => {
  if (!customerInfo) {
    return {
      hasActiveSubscription: false,
      subscriptionType: null,
      expirationDate: null,
      isInTrial: false,
      trialDaysRemaining: 0
    }
  }

  const hasStudent = hasStudentAccess(customerInfo)
  const hasPro = hasProAccess(customerInfo)
  const isInTrial = isInTrialPeriod(customerInfo)
  const trialDaysRemaining = getTrialDaysRemaining(customerInfo)

  let subscriptionType = null
  let expirationDate = null

  if (hasPro) {
    subscriptionType = 'pro'
    expirationDate = getEntitlementExpirationDate(customerInfo, ENTITLEMENTS.PRO)
  } else if (hasStudent) {
    subscriptionType = 'student'
    expirationDate = getEntitlementExpirationDate(customerInfo, ENTITLEMENTS.STUDENT)
  }

  return {
    hasActiveSubscription: hasStudent || hasPro,
    subscriptionType,
    expirationDate,
    isInTrial,
    trialDaysRemaining
  }
}

// Listener for customer info updates (polling-based for web)
export function setupCustomerInfoListener(callback: (info: CustomerInfo | null) => void): () => void {
  if (!isConfigured) {
    console.warn('RevenueCat not configured, skipping setupCustomerInfoListener');
    return () => {};
  }
  let isActive = true;
  let lastInfo: CustomerInfo | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  async function poll() {
    if (!isActive) return;
    try {
      const info = await getCustomerInfo();
      if (JSON.stringify(info) !== JSON.stringify(lastInfo)) {
        lastInfo = info;
        callback(info);
      }
    } catch (e) {}
    if (isActive) {
      timeoutId = setTimeout(poll, 30000);
    }
  }

  poll();

  return () => {
    isActive = false;
    if (timeoutId) clearTimeout(timeoutId);
  };
}
