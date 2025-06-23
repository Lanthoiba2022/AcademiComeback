import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Check, Star, Zap } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for individual students getting started',
    features: [
      'Up to 3 study sessions per month',
      'Basic note-taking tools',
      'Public study rooms',
      'Community support',
      '1GB storage'
    ],
    buttonText: 'Get Started',
    popular: false
  },
  {
    name: 'Student',
    price: '$9',
    period: 'per month',
    description: 'Ideal for serious students and small study groups',
    features: [
      'Unlimited study sessions',
      'Advanced note-taking with LaTeX',
      'Private study rooms',
      'Video conferencing for up to 8 people',
      'AI study assistant',
      '10GB storage',
      'Priority support'
    ],
    buttonText: 'Start Free Trial',
    popular: true
  },
  {
    name: 'Pro',
    price: '$19',
    period: 'per month',
    description: 'For institutions and large study groups',
    features: [
      'Everything in Student plan',
      'Unlimited participants in study rooms',
      'Advanced analytics and insights',
      'Custom branding',
      'Admin dashboard',
      '100GB storage',
      'White-label options',
      '24/7 premium support'
    ],
    buttonText: 'Contact Sales',
    popular: false
  }
]

interface PricingProps {
  onGetStarted: () => void
}

export const Pricing = ({ onGetStarted }: PricingProps) => {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-10 leading-[1.35]">
            Simple, Transparent
            <span className="block bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent leading-[1.35] mb-2 pb-2">
              Pricing
            </span>
          </h2>
          <p className="text-xl text-dark-300 max-w-3xl mx-auto">
            Choose the perfect plan for your study needs. All plans include our core collaboration features.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index}
              className={`relative min-h-[520px] p-2 sm:p-6 ${plan.popular ? 'ring-2 ring-primary-500 scale-105' : ''} animate-slide-up`}
              style={{ animationDelay: `${index * 0.1}s` }}
              glow={plan.popular}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center mb-2">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-dark-400 ml-2 leading-[1.2]">/{plan.period}</span>
                </div>
                <p className="text-dark-400">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <Check className="w-5 h-5 text-accent-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-dark-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className="w-full" 
                size="lg"
                variant={plan.popular ? 'primary' : 'secondary'}
                icon={plan.popular ? Zap : undefined}
                onClick={onGetStarted}
              >
                {plan.buttonText}
              </Button>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-dark-400 mb-4">
            Need a custom solution? We offer enterprise plans for schools and institutions.
          </p>
          <Button variant="ghost">
            Contact Sales Team
          </Button>
        </div>
      </div>
    </section>
  )
}