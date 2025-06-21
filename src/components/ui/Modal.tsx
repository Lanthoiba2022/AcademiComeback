import { useEffect } from 'react'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }: ModalProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'auto'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-[400px]',
    md: 'max-w-[500px]',
    lg: 'max-w-[600px]',
    xl: 'max-w-[700px]'
  }

  return createPortal(
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300 ease-out"
        style={{ 
          zIndex: 2147483647,
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'scale(1)' : 'scale(0.95)'
        }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={`
          fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
          w-[95%] ${sizes[size]} bg-card-gradient backdrop-blur-xl 
          border border-dark-700/50 rounded-xl shadow-2xl 
          transition-all duration-300 ease-out
        `}
        style={{ 
          zIndex: 2147483647,
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.95)'
        }}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-2 border-b border-dark-700/50">
            <h2 className="text-sm font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="p-2 sm:p-4 max-h-[90vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </>,
    document.body
  )
}