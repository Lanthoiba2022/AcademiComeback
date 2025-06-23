import { useState } from 'react'
import { Button } from '../ui/Button'
import { Menu, X, BookOpen } from 'lucide-react'
import { BrandTitle } from "../ui/Footer"

interface NavbarProps {
  onLogin: () => void
  onRegister: () => void
}

export const Navbar = ({ onLogin, onRegister }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navigation = [
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'About', href: '#about' },
    { name: 'Contact', href: '#contact' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/80 backdrop-blur-xl border-b border-dark-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 w-full justify-between">
          {/* Logo + BrandTitle to far left (desktop) */}
          <div className="flex items-center flex-shrink-0">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl">
                <img 
                  src="/12.webp" 
                  alt="Your Logo" 
                  className="w-18 h-9" 
                />
              </div>
              <div className="h-10 flex items-center">
                <BrandTitle size="sm" noGlow />
              </div>
            </div>
          </div>
          {/* Navigation and buttons to far right (desktop) */}
          <div className="hidden md:flex items-center space-x-8 ml-auto">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-dark-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors duration-200"
              >
                {item.name}
              </a>
            ))}
            <Button variant="ghost" onClick={onLogin}>
              Sign In
            </Button>
            <Button onClick={onRegister}>
              Sign Up
            </Button>
          </div>
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-dark-400 hover:text-white p-2 rounded-lg transition-colors duration-200"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden animate-slide-down">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-dark-800/50 backdrop-blur-xl rounded-lg mt-2 border border-dark-700/50">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-dark-300 hover:text-white block px-3 py-2 text-base font-medium transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <div className="pt-4 space-y-2">
                <Button variant="ghost" className="w-full" onClick={onLogin}>
                  Sign In
                </Button>
                <Button className="w-full" onClick={onRegister}>
                  Sign Up
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}