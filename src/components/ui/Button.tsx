import { forwardRef } from 'react'
import { DivideIcon as LucideIcon } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  icon?: typeof LucideIcon
  iconPosition?: 'left' | 'right'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className = '', 
    variant = 'primary', 
    size = 'md', 
    icon: Icon,
    iconPosition = 'left',
    loading = false,
    children, 
    disabled,
    ...props 
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900 disabled:opacity-50 disabled:cursor-not-allowed'
    
    const variants = {
      primary: 'bg-button-gradient text-white hover:shadow-lg hover:shadow-primary-500/25 hover:scale-105 focus:ring-primary-500',
      secondary: 'bg-dark-800 text-white border border-dark-700 hover:bg-dark-700 hover:border-dark-600 focus:ring-dark-500',
      outline: 'border border-dark-600 text-dark-300 hover:bg-dark-800 hover:text-white focus:ring-dark-500',
      ghost: 'text-dark-300 hover:bg-dark-800 hover:text-white focus:ring-dark-500'
    }
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-md',
      md: 'px-4 py-2 text-sm rounded-lg',
      lg: 'px-4 py-3 sm:px-6 text-base rounded-xl min-h-[44px]'
    }

    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
        ) : (
          <>
            {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 mr-2" />}
            {children}
            {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 ml-2" />}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'