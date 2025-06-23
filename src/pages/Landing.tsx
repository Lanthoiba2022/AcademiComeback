import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Navbar } from '../components/landing/Navbar'
import { Hero } from '../components/landing/Hero'
import { Features } from '../components/landing/Features'
import { Pricing } from '../components/landing/Pricing'
import { AuthModal } from '../components/auth/AuthModal'

export const Landing = () => {
  const { user } = useAuth()
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'login' | 'register' }>({
    isOpen: false,
    mode: 'login'
  })

  // Redirect to dashboard if user is already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthModal({ isOpen: true, mode })
  }

  const closeAuthModal = () => {
    setAuthModal(prev => ({ ...prev, isOpen: false }))
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar 
        onLogin={() => openAuthModal('login')}
        onRegister={() => openAuthModal('register')}
      />

      {/* Floating Badge */}
      <a
        href="https://bolt.new/" // TODO: Replace with actual URL
        target="_blank"
        rel="noopener noreferrer"
        className="fixed z-[60] top-40 right-4 sm:top-24 sm:right-8 flex items-center"
        style={{ pointerEvents: 'auto' }}
      >
        <img
          src="/bolt_badge_black.png"
          alt="Special Badge"
          className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 drop-shadow-lg transition-transform duration-200 hover:scale-105"
          style={{ maxWidth: '90vw', height: 'auto' }}
        />
      </a>
      
      <main>
        <Hero onGetStarted={() => openAuthModal('register')} />
        <Features />
        <Pricing onGetStarted={() => openAuthModal('register')} />
      </main>

      <AuthModal
        isOpen={authModal.isOpen}
        onClose={closeAuthModal}
        mode={authModal.mode}
        onModeChange={(mode) => setAuthModal(prev => ({ ...prev, mode }))}
      />
    </div>
  )
}