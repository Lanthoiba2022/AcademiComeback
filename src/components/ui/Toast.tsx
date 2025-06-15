import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react'

export interface ToastProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  onClose: (id: string) => void
}

export const Toast = ({ id, type, title, message, duration = 5000, onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100)
    
    // Auto-close timer
    const closeTimer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => {
      clearTimeout(timer)
      clearTimeout(closeTimer)
    }
  }, [duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onClose(id)
    }, 300)
  }

  const getIcon = () => {
    switch (type) {
      case 'success': return CheckCircle
      case 'error': return AlertCircle
      case 'warning': return AlertTriangle
      case 'info': return Info
    }
  }

  const getColors = () => {
    switch (type) {
      case 'success': return 'bg-green-500/20 border-green-500/30 text-green-400'
      case 'error': return 'bg-red-500/20 border-red-500/30 text-red-400'
      case 'warning': return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
      case 'info': return 'bg-blue-500/20 border-blue-500/30 text-blue-400'
    }
  }

  const Icon = getIcon()

  return createPortal(
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full transform transition-all duration-300 ease-out
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className={`
        p-4 rounded-lg border backdrop-blur-xl shadow-2xl
        ${getColors()}
      `}>
        <div className="flex items-start space-x-3">
          <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium">{title}</h4>
            {message && (
              <p className="text-sm opacity-80 mt-1">{message}</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// Toast Container Component
export const ToastContainer = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const addToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    setToasts(prev => [...prev, { ...toast, id, onClose: removeToast }])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  // Expose addToast globally for easy access
  useEffect(() => {
    (window as any).addToast = addToast
  }, [])

  return (
    <>
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} />
      ))}
    </>
  )
}

// Helper function to show toasts
export const showToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
  if ((window as any).addToast) {
    (window as any).addToast(toast)
  }
}