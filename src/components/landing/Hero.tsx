import { Button } from '../ui/Button'
import { ArrowRight, Play, Users, Zap, Shield } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface HeroProps {
  onGetStarted: () => void
}

// CountUp component for animated numbers
const CountUp = ({ end, duration = 2, suffix = '', prefix = '', decimals = 0 }: { end: number, duration?: number, suffix?: string, prefix?: string, decimals?: number }) => {
  const [count, setCount] = useState(0)
  const start = useRef(0)
  const raf = useRef<number | null>(null)
  const startTime = useRef<number>()

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp
      const progress = Math.min((timestamp - startTime.current) / (duration * 1000), 1)
      const value = start.current + (end - start.current) * progress
      setCount(value)
      if (progress < 1) {
        raf.current = requestAnimationFrame(animate)
      } else {
        setCount(end)
      }
    }
    raf.current = requestAnimationFrame(animate)
    return () => {
      if (raf.current !== null) {
        cancelAnimationFrame(raf.current)
      }
    }
  }, [end, duration])

  let displayValue: string
  if (decimals > 0) {
    displayValue = count.toFixed(decimals)
  } else {
    displayValue = Math.floor(count).toLocaleString()
  }

  return <span>{prefix}{displayValue}{suffix}</span>
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
          <div className="flex flex-col sm:flex-row gap-16 justify-center items-center mt-8">
            <div className="animate-float text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
                <CountUp end={29000} duration={3.5} suffix="+" />
              </div>
              <div className="text-dark-400">Active Students</div>
            </div>
            <div className="animate-float text-center" style={{ animationDelay: '1s' }}>
              <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
                <CountUp end={85000} duration={3.5} suffix="+" />
              </div>
              <div className="text-dark-400">Study Sessions</div>
            </div>
            <div className="animate-float text-center" style={{ animationDelay: '2s' }}>
              <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
                <CountUp end={99.9} duration={3.5} suffix="%" decimals={1} />
              </div>
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