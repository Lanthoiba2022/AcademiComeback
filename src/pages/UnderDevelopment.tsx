import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ArrowLeft, Construction, Wrench, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface UnderDevelopmentProps {
  feature?: string
  description?: string
}

export const UnderDevelopment = ({ 
  feature = "This Feature", 
  description = "We're working hard to bring you this feature. Stay tuned for updates!"
}: UnderDevelopmentProps) => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
      <Card className="text-center max-w-md w-full animate-slide-up">
        <div className="mb-6">
          <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Construction className="w-10 h-10 text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {feature} Under Development
          </h1>
          <p className="text-dark-300">
            {description}
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-center space-x-3 text-dark-400">
            <Wrench className="w-5 h-5" />
            <span className="text-sm">Building amazing features</span>
          </div>
          <div className="flex items-center justify-center space-x-3 text-dark-400">
            <Clock className="w-5 h-5" />
            <span className="text-sm">Coming soon</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={() => navigate('/dashboard')}
            icon={ArrowLeft}
            className="w-full"
          >
            Back to Dashboard
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate(-1)}
            className="w-full"
          >
            Go Back
          </Button>
        </div>

        <div className="mt-6 pt-6 border-t border-dark-700">
          <p className="text-xs text-dark-500">
            Want to be notified when this feature is ready?
          </p>
          <Button variant="ghost" size="sm" className="mt-2">
            Join Waitlist
          </Button>
        </div>
      </Card>
    </div>
  )
}