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
  ChevronRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { signOut } from '../../lib/supabase'

const navigation = [
  { name: 'Dashboard', icon: Home, href: '/dashboard' },
  { name: 'Study Rooms', icon: Users, href: '/rooms' },
  { name: 'Notes', icon: FileText, href: '/notes' },
  { name: 'Calendar', icon: Calendar, href: '/calendar' },
  { name: 'Settings', icon: Settings, href: '/settings' },
]

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className={`
      fixed left-0 top-0 h-full bg-card-gradient backdrop-blur-xl border-r border-dark-700/50 
      transition-all duration-300 z-40
      ${isCollapsed ? 'w-16' : 'w-64'}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-dark-700/50">
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
          className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors duration-200"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <button
                onClick={() => navigate(item.href)}
                className={`
                  w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg
                  text-dark-300 hover:text-white hover:bg-dark-700
                  transition-colors duration-200 group
                  ${isCollapsed ? 'justify-center' : 'justify-start'}
                `}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="ml-3">{item.name}</span>}
                {isCollapsed && (
                  <div className="absolute left-16 ml-2 px-2 py-1 bg-dark-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    {item.name}
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-dark-700/50">
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
  )
}