import { useState } from 'react'
import { 
  Home, 
  Users, 
  FileText, 
  Calendar, 
  Settings, 
  LogOut,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Trophy,
  Gift,
  TrendingUp,
  Award,
  Brain,
  BarChart3,
  FolderOpen,
  Crown
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { signOut } from '../../lib/supabase'
import { PremiumStatusBadge } from '../premium/PremiumStatusBadge'

const navigation = [
  { name: 'Dashboard', icon: Home, href: '/dashboard' },
  { name: 'Study Rooms', icon: Users, href: '/under-development' },
  { name: 'Quiz Center', icon: Brain, href: '/quiz' },
  { name: 'Analytics', icon: BarChart3, href: '/analytics' },
  { name: 'Calendar', icon: Calendar, href: '/calendar' },
  { name: 'Files', icon: FolderOpen, href: '/files' },
  { name: 'Achievements', icon: Trophy,  href: '/achievements' },
  { name: 'Rewards', icon: Gift, href: '/rewards' },
  { name: 'Leaderboard', icon: TrendingUp, href: '/leaderboard' },
  { name: 'Notes', icon: FileText, href: '/under-development' },
  { name: 'Premium', icon: Crown, href: '/premium', isPremium: true },
  { name: 'Settings', icon: Settings, href: '/settings' },
]

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const handleNavigation = (href: string) => {
    navigate(href)
    setIsMobileOpen(false) // Close mobile menu
  }

  const isActiveRoute = (href: string) => {
    return location.pathname === href
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-dark-800 rounded-lg text-white hover:bg-dark-700 transition-colors"
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full bg-card-gradient backdrop-blur-xl border-r border-dark-700/50 
        transition-all duration-300 z-40 flex flex-col
        ${isCollapsed ? 'w-16' : 'w-64'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-dark-700/50 flex-shrink-0">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-button-gradient rounded-xl">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">StudySync</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:block p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors duration-200"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Premium Status */}
        {!isCollapsed && (
          <div className="py-2 px-3 border-b border-dark-700/50 flex-shrink-0">
            <PremiumStatusBadge showDetails />
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-3">
          <ul className="space-y-1.5">
            {navigation.map((item) => {
              const isActive = isActiveRoute(item.href)
              return (
                <li key={item.name}>
                  <button
                    onClick={() => handleNavigation(item.href)}
                    className={`
                      w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg
                      transition-colors duration-200 group
                      ${isCollapsed ? 'justify-center' : 'justify-start'}
                      ${item.isPremium ? 'relative' : ''}
                      ${isActive 
                        ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30' 
                        : 'text-dark-300 hover:text-white hover:bg-dark-700'
                      }
                    `}
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive || item.isPremium ? 'text-primary-400' : ''}`} />
                    {!isCollapsed && (
                      <span className={`ml-3 ${isActive || item.isPremium ? 'text-primary-300' : ''}`}>
                        {item.name}
                      </span>
                    )}
                    {item.isPremium && !isCollapsed && (
                      <Crown className="w-3 h-3 text-primary-400 ml-auto" />
                    )}
                    {isCollapsed && (
                      <div className="absolute left-16 ml-2 px-2 py-1 bg-dark-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                        {item.name}
                      </div>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Sign Out */}
        <div className="p-3 border-t border-dark-700/50 flex-shrink-0">
          <button
            onClick={handleSignOut}
            className={`
              w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg
              text-red-400 hover:text-red-300 hover:bg-red-500/10
              transition-colors duration-200 group
              ${isCollapsed ? 'justify-center' : 'justify-start'}
            `}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="ml-3">Sign Out</span>}
            {isCollapsed && (
              <div className="absolute left-16 ml-2 px-2 py-1 bg-dark-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                Sign Out
              </div>
            )}
          </button>
        </div>
      </div>
    </>
  )
}