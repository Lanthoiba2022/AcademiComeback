interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  glow?: boolean
  style?: React.CSSProperties
}

export const Card = ({ children, className = '', hover = true, glow = false, style }: CardProps) => {
  return (
    <div
      className={`
        bg-card-gradient backdrop-blur-xl border border-dark-700/50 rounded-2xl p-2 sm:p-6
        ${hover ? 'hover:border-dark-600/50 hover:shadow-lg hover:shadow-primary-500/10 hover:-translate-y-1' : ''}
        ${glow ? 'shadow-lg shadow-primary-500/20' : ''}
        transition-all duration-300
        ${className}
      `}
      style={style}
    >
      {children}
    </div>
  )
}