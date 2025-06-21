import { Card } from '../ui/Card'
import { Users, MessageSquare, FileText, Video, Brain, Zap, Shield, Globe } from 'lucide-react'

const features = [
  {
    icon: Users,
    title: 'Real-time Collaboration',
    description: 'Study with friends and classmates in synchronized sessions with live cursors and instant updates.',
    color: 'text-primary-400'
  },
  {
    icon: MessageSquare,
    title: 'Integrated Chat',
    description: 'Communicate seamlessly while studying with built-in voice, video, and text chat features.',
    color: 'text-secondary-400'
  },
  {
    icon: FileText,
    title: 'Smart Note Taking',
    description: 'Create, share, and collaborate on notes with rich formatting, LaTeX support, and version control.',
    color: 'text-accent-400'
  },
  {
    icon: Video,
    title: 'Virtual Study Rooms',
    description: 'Join or create study rooms with video conferencing, screen sharing, and collaborative whiteboards.',
    color: 'text-primary-400'
  },
  {
    icon: Brain,
    title: 'AI Study Assistant',
    description: 'Get personalized study recommendations, quiz generation, and instant answers to your questions.',
    color: 'text-secondary-400'
  },
  {
    icon: Zap,
    title: 'Performance Analytics',
    description: 'Track your study progress, identify knowledge gaps, and optimize your learning efficiency.',
    color: 'text-accent-400'
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your data is encrypted and secure with enterprise-grade security and privacy controls.',
    color: 'text-primary-400'
  },
  {
    icon: Globe,
    title: 'Cross-platform Access',
    description: 'Access your study materials from anywhere on any device with seamless synchronization.',
    color: 'text-secondary-400'
  }
]

export const Features = () => {
  return (
    <section className="py-24 bg-dark-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Powerful Features for
            <span className="block bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
              Better Learning
            </span>
          </h2>
          <p className="text-xl text-dark-300 max-w-3xl mx-auto">
            Everything you need to create the perfect study environment and achieve academic excellence.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 overflow-x-auto scrollbar-hidden pb-2">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="animate-slide-up" 
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-dark-800 mb-4 ${feature.color}`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-dark-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}