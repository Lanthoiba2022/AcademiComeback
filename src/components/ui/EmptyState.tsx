import { Button } from './Button'
import { DivideIcon as LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionText?: string
  onAction?: () => void
  className?: string
}

export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  actionText, 
  onAction,
  className = ''
}: EmptyStateProps) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      <Icon className="w-16 h-16 text-dark-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-dark-300 mb-6 max-w-md mx-auto">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  )
}