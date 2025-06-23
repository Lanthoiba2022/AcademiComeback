import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Navbar } from '../components/landing/Navbar'
import { Hero } from '../components/landing/Hero'
import { Features } from '../components/landing/Features'
import { Pricing } from '../components/landing/Pricing'
import { AuthModal } from '../components/auth/AuthModal'
import { Mail, Info, Linkedin, Twitter, Github, Sparkles, Users, Shield } from 'lucide-react'

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
        {/* About Section */}
        <section id="about" className="relative py-24 bg-gradient-to-br from-dark-900 via-dark-950 to-dark-900 overflow-hidden animate-fade-in">
          <div className="absolute top-0 left-0 w-40 h-40 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-accent-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-12">
              <span className="inline-flex items-center px-4 py-2 bg-card-gradient backdrop-blur-xl border border-dark-700/50 rounded-full text-sm text-dark-300 mb-4 animate-fade-in">
                <Info className="w-4 h-4 mr-2 text-primary-400 animate-bounce" />
                About Us
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-[1.2] animate-slide-up">
                Empowering Students, <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">Together</span>
              </h2>
              <p className="text-xl text-dark-300 max-w-2xl mx-auto animate-fade-in">
                AcademiComeback is on a mission to revolutionize collaborative learning. We blend technology, community, and creativity to help you achieve your academic dreams. Our platform is built by students, for students—with passion, innovation, and a spark of magic.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-8 mt-10 animate-float">
              <div className="flex flex-col items-center">
                <Sparkles className="w-12 h-12 text-primary-400 animate-spin-slow mb-2" />
                <span className="text-lg text-white font-semibold">Innovative Tools</span>
              </div>
              <div className="flex flex-col items-center">
                <Users className="w-12 h-12 text-secondary-400 animate-bounce mb-2" />
                <span className="text-lg text-white font-semibold">Vibrant Community</span>
              </div>
              <div className="flex flex-col items-center">
                <Shield className="w-12 h-12 text-accent-400 animate-pulse mb-2" />
                <span className="text-lg text-white font-semibold">Privacy First</span>
              </div>
            </div>
          </div>
        </section>
        {/* Contact Section */}
        <section id="contact" className="relative py-24 bg-dark-950 overflow-hidden animate-fade-in">
          <div className="absolute top-0 right-0 w-40 h-40 bg-secondary-500/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-12">
              <span className="inline-flex items-center px-4 py-2 bg-card-gradient backdrop-blur-xl border border-dark-700/50 rounded-full text-sm text-dark-300 mb-4 animate-fade-in">
                <Mail className="w-4 h-4 mr-2 text-secondary-400 animate-bounce" />
                Contact Us
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-[1.2] animate-slide-up">
                Let's Connect & Collaborate
              </h2>
              <p className="text-xl text-dark-300 max-w-2xl mx-auto animate-fade-in">
                Have questions, feedback, or partnership ideas? Reach out and our team will get back to you soon!
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-8 animate-float">
              <a href="mailto:hello@academicomback.com" className="flex items-center space-x-2 px-6 py-3 bg-primary-500/10 rounded-lg border border-primary-500 text-primary-300 hover:bg-primary-500/20 transition-all duration-300 shadow-lg hover:scale-105">
                <Mail className="w-6 h-6 animate-pulse" />
                <span className="font-medium">hello@academicomback.com</span>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 px-6 py-3 bg-secondary-500/10 rounded-lg border border-secondary-500 text-secondary-300 hover:bg-secondary-500/20 transition-all duration-300 shadow-lg hover:scale-105">
                <Linkedin className="w-6 h-6 animate-bounce" />
                <span className="font-medium">LinkedIn</span>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 px-6 py-3 bg-accent-500/10 rounded-lg border border-accent-500 text-accent-300 hover:bg-accent-500/20 transition-all duration-300 shadow-lg hover:scale-105">
                <Twitter className="w-6 h-6 animate-spin-slow" />
                <span className="font-medium">Twitter</span>
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 px-6 py-3 bg-dark-700/20 rounded-lg border border-dark-700 text-dark-200 hover:bg-dark-700/40 transition-all duration-300 shadow-lg hover:scale-105">
                <Github className="w-6 h-6 animate-fade-in" />
                <span className="font-medium">GitHub</span>
              </a>
            </div>
          </div>
        </section>
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