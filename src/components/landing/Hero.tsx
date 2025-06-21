import { Button } from '../ui/Button'
import { ArrowRight, Play, Users, Zap, Shield } from 'lucide-react'

interface HeroProps {
  onGetStarted: () => void
}

export const Hero = ({ onGetStarted }: HeroProps) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 sm:pt-0">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-hero-gradient" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 text-center">
        <div className="animate-slide-up">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-card-gradient backdrop-blur-xl border border-dark-700/50 rounded-full text-sm text-dark-300 mb-6 sm:mb-8">
            <Zap className="w-4 h-4 mr-2 text-primary-400" />
            Revolutionizing Study Collaboration
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight">
            Study Together,
            <span className="block bg-gradient-to-r from-primary-400 via-secondary-400 to-accent-400 bg-clip-text text-transparent">
              Achieve More
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-dark-300 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed">
            Join thousands of students collaborating in real-time study sessions. 
            Share notes, solve problems together, and accelerate your learning journey.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-10 sm:mb-16">
            <Button 
              size="lg" 
              className="text-lg px-8 py-4"
              icon={ArrowRight}
              iconPosition="right"
              onClick={onGetStarted}
            >
              Get Started Free
            </Button>
            <Button 
              variant="ghost" 
              size="lg" 
              className="text-lg px-8 py-4"
              icon={Play}
            >
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-2xl mx-auto">
            <div className="animate-float">
              <div className="text-2xl sm:text-3xl font-bold text-white mb-2">50K+</div>
              <div className="text-dark-400">Active Students</div>
            </div>
            <div className="animate-float" style={{ animationDelay: '1s' }}>
              <div className="text-2xl sm:text-3xl font-bold text-white mb-2">100K+</div>
              <div className="text-dark-400">Study Sessions</div>
            </div>
            <div className="animate-float" style={{ animationDelay: '2s' }}>
              <div className="text-2xl sm:text-3xl font-bold text-white mb-2">99.9%</div>
              <div className="text-dark-400">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="hidden sm:block absolute top-20 left-10 opacity-30">
        <Users className="w-8 h-8 text-primary-400 animate-float" />
      </div>
      <div className="hidden sm:block absolute bottom-20 right-10 opacity-30">
        <Shield className="w-8 h-8 text-accent-400 animate-float" style={{ animationDelay: '3s' }} />
      </div>
    </section>
  )
}