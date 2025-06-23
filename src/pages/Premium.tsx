import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePremium } from '../contexts/PremiumContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { PremiumStatusBadge } from '../components/premium/PremiumStatusBadge'
import { Sidebar } from '../components/dashboard/Sidebar'
import { 
  Crown, 
  Zap, 
  Brain, 
  BarChart3, 
  Users, 
  Award,
  Check,
  Sparkles,
  GraduationCap,
  Star,
  ArrowRight,
  CheckCircle,
  BookOpen,
  Clock,
  Shield,
  AlertCircle
} from 'lucide-react'
import { PRODUCTS } from '../lib/revenuecat'

const features = [
  {
    name: 'AI Study Assistant',
    description: 'Get instant help with your studies using advanced AI',
    icon: Brain,
    included: ['free', 'student', 'pro']
  },
  {
    name: 'Advanced Analytics',
    description: 'Track your progress with detailed insights and reports',
    icon: BarChart3,
    included: ['pro']
  },
  {
    name: 'Collaboration Tools',
    description: 'Study together with friends in real-time',
    icon: Users,
    included: ['student', 'pro']
  },
  {
    name: 'NFT Credentials',
    description: 'Earn verifiable credentials for your achievements',
    icon: Award,
    included: ['pro']
  }
]

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for getting started',
    icon: Sparkles,
    features: [
      'Basic study tools',
      'Community access',
      'Limited AI assistance',
      'Basic analytics'
    ],
    buttonText: 'Current Plan',
    buttonVariant: 'outline' as const,
    popular: false
  },
  {
    name: 'Student',
    price: '$9',
    period: '/month',
    description: 'Best for students',
    icon: GraduationCap,
    features: [
      'All Free features',
      'Advanced AI assistance',
      'Collaboration tools',
      'Priority support',
      'Custom themes'
    ],
    buttonText: 'Upgrade to Student',
    buttonVariant: 'primary' as const,
    popular: true
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    description: 'For serious learners',
    icon: Crown,
    features: [
      'All Student features',
      'Advanced analytics',
      'NFT credentials',
      'Early access to new features',
      'Premium support'
    ],
    buttonText: 'Upgrade to Pro',
    buttonVariant: 'primary' as const,
    popular: false
  }
]

export const Premium = () => {
  const {
    offerings,
    subscriptionLevel,
    purchasing,
    handlePurchase,
    trialDaysRemaining,
    refreshCustomerInfo
  } = usePremium()
  const navigate = useNavigate()
  const [selectedPlan, setSelectedPlan] = useState<'student' | 'pro' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleUpgrade = async (planIndex: number) => {
    try {
      setError(null)
      if (!offerings || !offerings.current || !offerings.current.availablePackages || offerings.current.availablePackages.length === 0) {
        throw new Error('No subscription plans available')
      }

      // Log available packages for debugging
      const availablePackages = offerings.current.availablePackages.map(pkg => ({
        identifier: pkg.identifier
      }))
      console.log('Available packages:', availablePackages)

      // Find the correct package based on the plan index
      const packageToPurchase = offerings.current.availablePackages.find(pkg => {
        const identifier = pkg.identifier.toLowerCase()
        
        console.log('Checking package:', {
          identifier,
          planIndex,
          isStudent: planIndex === 1,
          isPro: planIndex === 2
        })

        if (planIndex === 1) {
          // Student plan ($9)
          return identifier === '$rc_monthly'
        } else if (planIndex === 2) {
          // Pro plan ($19)
          return identifier === 'pro_monthly_package'
        }
        return false
      })

      if (!packageToPurchase) {
        const availableIds = offerings.current.availablePackages.map(pkg => pkg.identifier).join(', ')
        console.error('Package not found for plan index:', planIndex, 'Available:', availableIds)
        throw new Error(`Selected plan is not available. Available package identifiers: ${availableIds}`)
      }

      console.log('Selected package:', {
        identifier: packageToPurchase.identifier
      })

      const success = await handlePurchase(packageToPurchase)
      if (success) {
        // Purchase was successful, refresh customer info
        await refreshCustomerInfo()
        console.log('Purchase successful!')
        // Navigate back to the app
        navigate('/')
      } else {
        throw new Error('Purchase failed. Please try again.')
      }
    } catch (err) {
      console.error('Purchase error:', err)
      setError(err instanceof Error ? err.message : 'Failed to process purchase. Please try again.')
    }
  }

  if (!offerings || !offerings.current || !offerings.current.availablePackages || offerings.current.availablePackages.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-hero-gradient text-white">
        <Sidebar />
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">No subscription plans available</h2>
          <p className="mb-6">We couldn't load any subscription plans at this time. This may be a temporary issue. Please try again later or contact support if the problem persists.</p>
          <Button onClick={() => window.location.reload()} className="mb-2">Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Sidebar />
      <div className="lg:ml-64 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Upgrade Your Learning Experience
            </h1>
            <p className="text-xl text-dark-300 max-w-2xl mx-auto">
              Choose the perfect plan to accelerate your learning journey with advanced features and tools.
            </p>
            
            <div className="mt-6 flex justify-center">
              <PremiumStatusBadge showDetails />
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {features.map((feature) => (
              <Card key={feature.name} className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-primary-500/10 rounded-lg">
                    <feature.icon className="w-6 h-6 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {feature.name}
                    </h3>
                    <p className="text-dark-300 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pricing Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => {
              const isCurrentPlan = 
                (plan.name === 'Free' && subscriptionLevel === 'free') ||
                (plan.name === 'Student' && subscriptionLevel === 'student') ||
                (plan.name === 'Pro' && subscriptionLevel === 'pro')

              return (
                <Card 
                  key={plan.name}
                  className={`
                    relative p-8
                    ${plan.popular ? 'border-primary-500/50 bg-primary-500/5' : ''}
                    ${isCurrentPlan ? 'ring-2 ring-primary-500' : ''}
                  `}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-500/10 mb-4">
                      <plan.icon className="w-6 h-6 text-primary-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-white">{plan.price}</span>
                      {plan.period && (
                        <span className="text-dark-300 ml-1">{plan.period}</span>
                      )}
                    </div>
                    <p className="text-dark-300 mt-2">{plan.description}</p>
                  </div>

                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-center space-x-3">
                        <Check className="w-5 h-5 text-primary-400 flex-shrink-0" />
                        <span className="text-dark-300">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant={isCurrentPlan ? 'outline' : plan.buttonVariant}
                    className="w-full"
                    disabled={isCurrentPlan || purchasing === plan.name.toLowerCase()}
                    loading={purchasing === plan.name.toLowerCase()}
                    onClick={() => handleUpgrade(index)}
                  >
                    {isCurrentPlan ? (
                      'Current Plan'
                    ) : plan.name === 'Free' && subscriptionLevel !== 'free' ? (
                      'Free Plan'
                    ) : (
                      <>
                        {plan.buttonText}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </Card>
              )
            })}
          </div>

          {/* FAQ Section */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can I change my plan later?
                </h3>
                <p className="text-dark-300">
                  Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is there a free trial?
                </h3>
                <p className="text-dark-300">
                  Yes, we offer a 7-day free trial for both Student and Pro plans. No credit card required to start.
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-2">
                  How do I cancel my subscription?
                </h3>
                <p className="text-dark-300">
                  You can cancel your subscription at any time from your account settings. Your access will continue until the end of your billing period.
                </p>
              </Card>
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-dark-300">
                  We accept all major credit cards, PayPal, and Apple Pay. All payments are processed securely through RevenueCat.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 