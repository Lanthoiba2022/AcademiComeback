import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Modal } from '../ui/Modal'
import { 
  Bell, BellOff, Check, CheckCheck, Trash2, Filter,
  Trophy, Users, Brain, Calendar, Settings, X
} from 'lucide-react'
import { Notification, NotificationSettings } from '../../types/notifications'

interface NotificationCenterProps {
  notifications: Notification[]
  settings: NotificationSettings
  onMarkAsRead: (notificationId: string) => void
  onMarkAllAsRead: () => void
  onDeleteNotification: (notificationId: string) => void
  onUpdateSettings: (settings: Partial<NotificationSettings>) => void
}

export const NotificationCenter = ({ 
  notifications, 
  settings,
  onMarkAsRead, 
  onMarkAllAsRead, 
  onDeleteNotification,
  onUpdateSettings 
}: NotificationCenterProps) => {
  const [showSettings, setShowSettings] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | 'achievements' | 'room_activity'>('all')
  const [isOpen, setIsOpen] = useState(false)

  const unreadCount = notifications.filter(n => !n.isRead).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'achievement': return Trophy
      case 'room_activity': return Users
      case 'quiz_complete': return Brain
      case 'reminder': return Calendar
      default: return Bell
    }
  }

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'high') return 'border-red-500/30 bg-red-500/10'
    
    switch (type) {
      case 'achievement': return 'border-yellow-500/30 bg-yellow-500/10'
      case 'room_activity': return 'border-blue-500/30 bg-blue-500/10'
      case 'quiz_complete': return 'border-purple-500/30 bg-purple-500/10'
      case 'reminder': return 'border-green-500/30 bg-green-500/10'
      default: return 'border-dark-600 bg-dark-800/50'
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead
    if (filter === 'achievements') return notification.type === 'achievement'
    if (filter === 'room_activity') return notification.type === 'room_activity'
    return true
  })

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <>
      {/* Notification Bell */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          icon={unreadCount > 0 ? Bell : BellOff}
          className="relative"
        >
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>

        {/* Notification Dropdown */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-96 bg-card-gradient backdrop-blur-xl border border-dark-700/50 rounded-xl shadow-2xl z-50">
            {/* Header */}
            <div className="p-4 border-b border-dark-700/50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Notifications</h3>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowSettings(true)}
                    icon={Settings}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsOpen(false)}
                    icon={X}
                  />
                </div>
              </div>
              
              {unreadCount > 0 && (
                <div className="flex items-center justify-between mt-2">
                  <span className="text-dark-300 text-sm">{unreadCount} unread</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onMarkAllAsRead}
                    icon={CheckCheck}
                  >
                    Mark all read
                  </Button>
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="p-4 border-b border-dark-700/50">
              <div className="flex space-x-2 overflow-x-auto">
                {[
                  { id: 'all', name: 'All' },
                  { id: 'unread', name: 'Unread' },
                  { id: 'achievements', name: 'Achievements' },
                  { id: 'room_activity', name: 'Room Activity' }
                ].map(filterOption => (
                  <button
                    key={filterOption.id}
                    onClick={() => setFilter(filterOption.id as any)}
                    className={`
                      px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap
                      ${filter === filterOption.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white'
                      }
                    `}
                  >
                    {filterOption.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-dark-400 mx-auto mb-4" />
                  <h4 className="text-white font-medium mb-2">No notifications</h4>
                  <p className="text-dark-400 text-sm">You're all caught up!</p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {filteredNotifications.map(notification => {
                    const Icon = getNotificationIcon(notification.type)
                    
                    return (
                      <div
                        key={notification.id}
                        className={`
                          p-3 rounded-lg border transition-all duration-200 cursor-pointer
                          ${getNotificationColor(notification.type, notification.priority)}
                          ${!notification.isRead ? 'ring-1 ring-primary-500/30' : ''}
                          hover:scale-102
                        `}
                        onClick={() => {
                          if (!notification.isRead) {
                            onMarkAsRead(notification.id)
                          }
                          if (notification.actionUrl) {
                            window.location.href = notification.actionUrl
                          }
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                            ${notification.type === 'achievement' ? 'bg-yellow-500/20 text-yellow-400' :
                              notification.type === 'room_activity' ? 'bg-blue-500/20 text-blue-400' :
                              notification.type === 'quiz_complete' ? 'bg-purple-500/20 text-purple-400' :
                              'bg-dark-700 text-dark-400'
                            }
                          `}>
                            <Icon className="w-4 h-4" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-white font-medium text-sm truncate">
                                {notification.title}
                              </h4>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />
                              )}
                            </div>
                            
                            <p className="text-dark-300 text-sm line-clamp-2">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-dark-500 text-xs">
                                {formatTimeAgo(notification.createdAt)}
                              </span>
                              
                              <div className="flex items-center space-x-1">
                                {notification.actionText && (
                                  <span className="text-primary-400 text-xs font-medium">
                                    {notification.actionText}
                                  </span>
                                )}
                                
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onDeleteNotification(notification.id)
                                  }}
                                  icon={Trash2}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Notification Settings"
        size="lg"
      >
        <div className="space-y-6">
          {/* Email Notifications */}
          <div>
            <h4 className="text-white font-medium mb-4">Email Notifications</h4>
            <div className="space-y-3">
              {Object.entries(settings.emailNotifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-dark-300 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </span>
                  <button
                    onClick={() => onUpdateSettings({
                      emailNotifications: {
                        ...settings.emailNotifications,
                        [key]: !value
                      }
                    })}
                    className={`
                      relative w-12 h-6 rounded-full transition-colors duration-200
                      ${value ? 'bg-primary-500' : 'bg-dark-600'}
                    `}
                  >
                    <div className={`
                      absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200
                      ${value ? 'translate-x-7' : 'translate-x-1'}
                    `} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Push Notifications */}
          <div>
            <h4 className="text-white font-medium mb-4">Push Notifications</h4>
            <div className="space-y-3">
              {Object.entries(settings.pushNotifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-dark-300 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </span>
                  <button
                    onClick={() => onUpdateSettings({
                      pushNotifications: {
                        ...settings.pushNotifications,
                        [key]: !value
                      }
                    })}
                    className={`
                      relative w-12 h-6 rounded-full transition-colors duration-200
                      ${value ? 'bg-primary-500' : 'bg-dark-600'}
                    `}
                  >
                    <div className={`
                      absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200
                      ${value ? 'translate-x-7' : 'translate-x-1'}
                    `} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quiet Hours */}
          <div>
            <h4 className="text-white font-medium mb-4">Quiet Hours</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-dark-300">Enable quiet hours</span>
                <button
                  onClick={() => onUpdateSettings({
                    quietHours: {
                      ...settings.quietHours,
                      enabled: !settings.quietHours.enabled
                    }
                  })}
                  className={`
                    relative w-12 h-6 rounded-full transition-colors duration-200
                    ${settings.quietHours.enabled ? 'bg-primary-500' : 'bg-dark-600'}
                  `}
                >
                  <div className={`
                    absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200
                    ${settings.quietHours.enabled ? 'translate-x-7' : 'translate-x-1'}
                  `} />
                </button>
              </div>
              
              {settings.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-dark-300 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={settings.quietHours.startTime}
                      onChange={(e) => onUpdateSettings({
                        quietHours: {
                          ...settings.quietHours,
                          startTime: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-dark-300 mb-2">End Time</label>
                    <input
                      type="time"
                      value={settings.quietHours.endTime}
                      onChange={(e) => onUpdateSettings({
                        quietHours: {
                          ...settings.quietHours,
                          endTime: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <h4 className="text-white font-medium mb-4">Notification Frequency</h4>
            <select
              value={settings.frequency}
              onChange={(e) => onUpdateSettings({ frequency: e.target.value as any })}
              className="w-full px-3 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="immediate">Immediate</option>
              <option value="hourly">Hourly digest</option>
              <option value="daily">Daily digest</option>
              <option value="weekly">Weekly digest</option>
            </select>
          </div>
        </div>
      </Modal>
    </>
  )
}