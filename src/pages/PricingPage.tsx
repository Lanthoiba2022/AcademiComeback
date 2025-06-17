import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from '../components/dashboard/Sidebar'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { usePremium } from '../contexts/PremiumContext'
import { Package } from '@revenuecat/purchases-js'
import { 
  Check, 
  Crown, 
  Zap, 
  Star, 
  Users, 
  Award, 
  Loader, 
  AlertCircle,
  Sparkles
} from 'lucide-react'

const plans = [
  {
    name: 'Student Plan',
    price: 9,
    description: 'Perfect for individual students',
    features: [
      'Unlimited study sessions',
      'Advanced note-taking with LaTeX',
      'Private study rooms',
      'Video conferencing (up to 8 people)',
      'AI study assistant'
    ],
    icon: Star,
    color: 'text-blue-400',
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    name: 'Pro Plan',
    price: 19,
    description: 'For serious students and study groups',
    features: [
      'Everything in Student plan',
      'Unlimited participants',
      'Advanced analytics & insights',
      'Custom branding',
      '24/7 premium support'
    ],
    icon: Crown,
    color: 'text-primary-400',
    gradient: 'from-primary-500 to-secondary-500',
    popular: true
  }
]

export const PricingPage = () => {
  const navigate = useNavigate()
  const { offerings, purchasing, handlePurchase, handleSuccessfulPayment } = usePremium()
  const [error, setError] = useState<string | null>(null)

  const handleUpgrade = async (planIndex: number) => {
    try {
      setError(null)
      if (!offerings?.current?.availablePackages) {
        throw new Error('No subscription plans available')
      }

      // Log available packages for debugging
      const availablePackages = offerings.current.availablePackages.map(pkg => ({
        identifier: pkg.identifier,
        // Add any other relevant fields here
      }))
      console.log('Available packages:', availablePackages)

      // Find the correct package based on the plan index
      const packageToPurchase = offerings.current.availablePackages.find(pkg => {
        const identifier = pkg.identifier.toLowerCase()
        
        console.log('Checking package:', {
          identifier,
          planIndex,
          isStudent: planIndex === 0,
          isPro: planIndex === 1
        })

        if (planIndex === 0) {
          // Student plan ($9)
          return identifier === '$rc_monthly'
        } else {
          // Pro plan ($19)
          return identifier === 'pro_monthly_package'
        }
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
        // Purchase was successful, handle successful payment
        const paymentSuccess = await handleSuccessfulPayment()
        if (paymentSuccess) {
          console.log('Purchase and payment verification successful!')
          // Navigate back to the app
          navigate('/')
        } else {
          throw new Error('Payment verification failed. Please try again.')
        }
      } else {
        throw new Error('Purchase failed. Please try again.')
      }
    } catch (err) {
      console.error('Purchase error:', err)
      setError(err instanceof Error ? err.message : 'Failed to process purchase. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Sidebar />
      <div className="lg:ml-64 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Choose Your Plan
            </h1>
            <p className="text-dark-300 text-lg max-w-2xl mx-auto">
              Unlock premium features and take your studying to the next level with our flexible subscription plans.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-8 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0" />
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Loading state */}
          {!offerings && (
            <div className="text-center py-12">
              <Loader className="w-8 h-8 text-primary-400 mx-auto mb-4 animate-spin" />
              <p className="text-white">Loading subscription plans...</p>
            </div>
          )}

          {/* Pricing cards */}
          {offerings && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {plans.map((plan, index) => {
                const Icon = plan.icon
                return (
                  <Card 
                    key={plan.name}
                    className={`
                      relative overflow-hidden transition-all duration-300 hover:scale-105
                      ${plan.popular ? 'bg-gradient-to-br from-dark-800 to-dark-900' : ''}
                    `}
                  >
                    {plan.popular && (
                      <div className="absolute top-0 right-0">
                        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-1 rounded-bl-lg text-sm font-medium">
                          Most Popular
                        </div>
                      </div>
                    )}

                    <div className="p-6">
                      {/* Plan header */}
                      <div className="flex items-center mb-4">
                        <div className={`w-12 h-12 rounded-full bg-dark-800 flex items-center justify-center ${plan.color}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                          <p className="text-dark-300 text-sm">{plan.description}</p>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="mb-6">
                        <div className="flex items-baseline">
                          <span className="text-4xl font-bold text-white">${plan.price}</span>
                          <span className="text-dark-400 ml-2">/month</span>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-3 mb-6">
                        {plan.features.map((feature, i) => (
                          <div key={i} className="flex items-center text-dark-300">
                            <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>

                      {/* Subscribe button */}
                      <Button
                        onClick={() => handleUpgrade(index)}
                        disabled={purchasing === offerings.current?.availablePackages[index]?.identifier}
                        className={`
                          w-full
                          ${plan.popular 
                            ? 'bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600' 
                            : 'bg-dark-700 hover:bg-dark-600'
                          }
                        `}
                        loading={purchasing === offerings.current?.availablePackages[index]?.identifier}
                      >
                        {purchasing === offerings.current?.availablePackages[index]?.identifier 
                          ? 'Processing...' 
                          : 'Subscribe Now'
                        }
                      </Button>

                      <p className="text-xs text-dark-400 mt-3 text-center">
                        Cancel anytime
                      </p>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Features section */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Premium Features
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 bg-dark-800/50 rounded-lg">
                <Zap className="w-8 h-8 text-purple-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">AI-Powered Tools</h3>
                <p className="text-dark-300 text-sm">
                  Intelligent quiz generation, personalized recommendations, and AI tutoring
                </p>
              </div>

              <div className="p-6 bg-dark-800/50 rounded-lg">
                <Star className="w-8 h-8 text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Advanced Analytics</h3>
                <p className="text-dark-300 text-sm">
                  Detailed progress tracking, performance insights, and study pattern analysis
                </p>
              </div>

              <div className="p-6 bg-dark-800/50 rounded-lg">
                <Users className="w-8 h-8 text-green-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Enhanced Collaboration</h3>
                <p className="text-dark-300 text-sm">
                  Voice commands, AI avatars, audio messages, and premium study rooms
                </p>
              </div>

              <div className="p-6 bg-dark-800/50 rounded-lg">
                <Award className="w-8 h-8 text-yellow-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">NFT Credentials</h3>
                <p className="text-dark-300 text-sm">
                  Mint blockchain-verified certificates for your achievements
                </p>
              </div>
            </div>
          </div>

          {/* FAQ section */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Frequently Asked Questions
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="p-6 bg-dark-800/50 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">Can I cancel anytime?</h3>
                <p className="text-dark-300 text-sm">
                  Yes, you can cancel your subscription at any time. Your premium features will remain active until the end of your billing period.
                </p>
              </div>

              <div className="p-6 bg-dark-800/50 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">What payment methods do you accept?</h3>
                <p className="text-dark-300 text-sm">
                  We accept all major credit cards and PayPal. All payments are processed securely through Stripe.
                </p>
              </div>

              <div className="p-6 bg-dark-800/50 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">Can I upgrade or downgrade my plan?</h3>
                <p className="text-dark-300 text-sm">
                  Yes, you can change your plan at any time. The new rate will be applied at the start of your next billing cycle.
                </p>
              </div>

              <div className="p-6 bg-dark-800/50 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">Is there a free trial?</h3>
                <p className="text-dark-300 text-sm">
                  Yes, we offer a 7-day free trial for all premium features. No credit card required to start your trial.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 