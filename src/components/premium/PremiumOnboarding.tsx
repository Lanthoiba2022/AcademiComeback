import { useState, useEffect } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { usePremium } from '../../contexts/PremiumContext'
import { PremiumUpgradeModal } from './PremiumUpgradeModal'
import { 
  Crown, X, Zap, Star, Users, Award, ArrowRight, 
  CheckCircle, Clock, Sparkles 
} from 'lucide-react'

export const PremiumOnboarding = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isDismissed, setIsDismissed] = useState(false)
  
  const { 
    isPremium, 
    isTrialActive, 
    trialDaysRemaining, 
    loading 
  } = usePremium()

  // Show onboarding for new users or trial users
  useEffect(() => {
    if (loading || isPremium || isDismissed) return

    // Check if user has seen onboarding before
    const hasSeenOnboarding = localStorage.getItem('premium-onboarding-seen')
    
    if (!hasSeenOnboarding) {
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 2000) // Show after 2 seconds
      
      return () => clearTimeout(timer)
    }
  }, [loading, isPremium, isDismissed])

  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
    localStorage.setItem('premium-onboarding-seen', 'true')
  }

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onboardingSteps = [
    {
      icon: Crown,
      title: 'Welcome to StudySync Premium!',
      description: 'Unlock powerful features designed to supercharge your learning experience.',
      features: [
        'AI-powered study tools',
        'Advanced analytics',
        'Enhanced collaboration',
        'NFT study credentials'
      ],
      color: 'text-primary-400'
    },
    {
      icon: Zap,
      title: 'AI-Powered Learning',
      description: 'Get personalized study recommendations and intelligent quiz generation.',
      features: [
        'Smart quiz creation',
        'Personalized study plans',
        'AI tutoring assistance',
        'Adaptive learning paths'
      ],
      color: 'text-purple-400'
    },
    {
      icon: Star,
      title: 'Advanced Analytics',
      description: 'Track your progress with detailed insights and performance metrics.',
      features: [
        'Detailed progress tracking',
        'Performance insights',
        'Study pattern analysis',
        'Goal achievement metrics'
      ],
      color: 'text-blue-400'
    },
    {
      icon: Users,
      title: 'Enhanced Collaboration',
      description: 'Connect with study partners using advanced collaboration tools.',
      features: [
        'Voice commands',
        'AI avatars',
        'Audio messages',
        'Premium study rooms'
      ],
      color: 'text-green-400'
    }
  ]

  if (!isVisible || isPremium || loading) {
    return null
  }

  const currentStepData = onboardingSteps[currentStep]
  const Icon = currentStepData.icon
  const isLastStep = currentStep === onboardingSteps.length - 1

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full relative overflow-hidden">
        {/* Premium gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-secondary-500/10 to-accent-500/10" />
        
        <div className="relative z-10 p-6">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-dark-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Progress indicator */}
          <div className="flex space-x-2 mb-6">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  index <= currentStep ? 'bg-primary-500' : 'bg-dark-700'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <div className={`w-16 h-16 rounded-full bg-dark-800 flex items-center justify-center mx-auto mb-4 ${currentStepData.color}`}>
              <Icon className="w-8 h-8" />
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2">
              {currentStepData.title}
            </h2>
            
            <p className="text-dark-300 mb-4">
              {currentStepData.description}
            </p>

            {/* Trial status */}
            {isTrialActive && (
              <div className="inline-flex items-center px-3 py-1 bg-accent-500/20 border border-accent-500/30 rounded-full mb-4">
                <Clock className="w-4 h-4 text-accent-400 mr-2" />
                <span className="text-accent-400 text-sm font-medium">
                  {trialDaysRemaining} days left in trial
                </span>
              </div>
            )}
          </div>

          {/* Features list */}
          <div className="space-y-2 mb-6">
            {currentStepData.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span className="text-dark-300 text-sm">{feature}</span>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              size="sm"
            >
              Previous
            </Button>

            <div className="flex space-x-2">
              {isLastStep ? (
                <PremiumUpgradeModal
                  trigger={
                    <Button 
                      size="sm"
                      className="bg-gradient-to-r from-primary-500 to-secondary-500"
                      icon={Sparkles}
                    >
                      {isTrialActive ? 'Continue Premium' : 'Start Free Trial'}
                    </Button>
                  }
                />
              ) : (
                <Button
                  onClick={handleNext}
                  size="sm"
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Next
                </Button>
              )}
            </div>
          </div>

          {/* Skip option */}
          <div className="text-center mt-4">
            <button
              onClick={handleDismiss}
              className="text-dark-400 hover:text-white text-sm transition-colors"
            >
              Skip tour
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}