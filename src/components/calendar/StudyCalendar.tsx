import { useState, useEffect } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { 
  Calendar, ChevronLeft, ChevronRight, Plus, Clock, 
  Users, AlertCircle, CheckCircle, Play, Edit, Trash2
} from 'lucide-react'
import { CalendarEvent, CalendarView, StudyBlock } from '../../types/calendar'

interface StudyCalendarProps {
  events: CalendarEvent[]
  onCreateEvent: (event: Partial<CalendarEvent>) => void
  onUpdateEvent: (eventId: string, updates: Partial<CalendarEvent>) => void
  onDeleteEvent: (eventId: string) => void
}

export const StudyCalendar = ({ events, onCreateEvent, onUpdateEvent, onDeleteEvent }: StudyCalendarProps) => {
  const [view, setView] = useState<CalendarView['type']>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    type: 'study-session' as CalendarEvent['type'],
    startTime: '',
    endTime: '',
    priority: 'medium' as CalendarEvent['priority']
  })

  const views = [
    { id: 'month', name: 'Month', icon: Calendar },
    { id: 'week', name: 'Week', icon: Calendar },
    { id: 'day', name: 'Day', icon: Clock },
    { id: 'agenda', name: 'Agenda', icon: Users }
  ]

  const eventTypes = [
    { id: 'study-session', name: 'Study Session', color: 'bg-blue-500', icon: '📚' },
    { id: 'quiz', name: 'Quiz', color: 'bg-purple-500', icon: '🧠' },
    { id: 'deadline', name: 'Deadline', color: 'bg-red-500', icon: '⏰' },
    { id: 'reminder', name: 'Reminder', color: 'bg-yellow-500', icon: '🔔' },
    { id: 'meeting', name: 'Meeting', color: 'bg-green-500', icon: '👥' }
  ]

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime)
      return eventDate.toDateString() === date.toDateString()
    })
  }

  const getEventTypeInfo = (type: string) => {
    return eventTypes.find(t => t.id === type) || eventTypes[0]
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleCreateEvent = () => {
    const newEvent: Partial<CalendarEvent> = {
      ...eventForm,
      startTime: new Date(eventForm.startTime).toISOString(),
      endTime: new Date(eventForm.endTime).toISOString(),
      isAllDay: false,
      status: 'scheduled',
      reminders: [{ id: '1', type: 'notification', minutesBefore: 15, isEnabled: true }],
      createdBy: 'current-user'
    }
    
    onCreateEvent(newEvent)
    setShowEventModal(false)
    resetForm()
  }

  const resetForm = () => {
    setEventForm({
      title: '',
      description: '',
      type: 'study-session',
      startTime: '',
      endTime: '',
      priority: 'medium'
    })
    setSelectedEvent(null)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate)
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
      <div className="bg-dark-800/50 rounded-lg p-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')} icon={ChevronLeft} />
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')} icon={ChevronRight} />
          </div>
        </div>

        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="p-2 text-center text-dark-400 text-sm font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (!day) {
              return <div key={index} className="p-2 h-24" />
            }

            const dayEvents = getEventsForDate(day)
            const isToday = day.toDateString() === new Date().toDateString()
            const isCurrentMonth = day.getMonth() === currentDate.getMonth()

            return (
              <div
                key={index}
                className={`
                  p-2 h-24 border border-dark-700 rounded cursor-pointer hover:bg-dark-700/50 transition-colors
                  ${isToday ? 'bg-primary-500/20 border-primary-500' : ''}
                  ${!isCurrentMonth ? 'opacity-50' : ''}
                `}
                onClick={() => {
                  const defaultStartTime = new Date(day)
                  defaultStartTime.setHours(9, 0, 0, 0)
                  const defaultEndTime = new Date(day)
                  defaultEndTime.setHours(10, 0, 0, 0)
                  
                  setEventForm(prev => ({
                    ...prev,
                    startTime: defaultStartTime.toISOString().slice(0, 16),
                    endTime: defaultEndTime.toISOString().slice(0, 16)
                  }))
                  setShowEventModal(true)
                }}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary-300' : 'text-white'}`}>
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map(event => {
                    const typeInfo = getEventTypeInfo(event.type)
                    return (
                      <div
                        key={event.id}
                        className={`text-xs p-1 rounded truncate ${typeInfo.color} text-white`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedEvent(event)
                        }}
                      >
                        {event.title}
                      </div>
                    )
                  })}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-dark-400">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderAgendaView = () => {
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    const upcomingEvents = events
      .filter(event => {
        const eventDate = new Date(event.startTime)
        return eventDate >= today && eventDate <= nextWeek
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

    return (
      <div className="space-y-4">
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-dark-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Upcoming Events</h3>
            <p className="text-dark-300 mb-4">Schedule your study sessions to stay organized</p>
            <Button onClick={() => setShowEventModal(true)} icon={Plus}>
              Create Event
            </Button>
          </div>
        ) : (
          upcomingEvents.map(event => {
            const typeInfo = getEventTypeInfo(event.type)
            const eventDate = new Date(event.startTime)
            const isToday = eventDate.toDateString() === today.toDateString()
            
            return (
              <Card key={event.id} className="hover:scale-102 transition-transform duration-200">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full ${typeInfo.color} flex items-center justify-center text-white text-lg`}>
                    {typeInfo.icon}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-white font-medium">{event.title}</h4>
                      <span className={`px-2 py-1 rounded text-xs ${
                        event.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                        event.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {event.priority}
                      </span>
                    </div>
                    
                    <p className="text-dark-300 text-sm mb-2">{event.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-dark-400">
                      <span>
                        {isToday ? 'Today' : eventDate.toLocaleDateString()} at {formatTime(event.startTime)}
                      </span>
                      {event.roomId && (
                        <span className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          Study Room
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {event.status === 'scheduled' && (
                      <Button size="sm" variant="ghost" icon={Play}>
                        Start
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" icon={Edit} onClick={() => setSelectedEvent(event)} />
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Study Calendar</h2>
          <p className="text-dark-300">Schedule and track your study sessions</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* View Selector */}
          <div className="flex space-x-1">
            {views.map(viewOption => {
              const Icon = viewOption.icon
              return (
                <button
                  key={viewOption.id}
                  onClick={() => setView(viewOption.id as any)}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all duration-200
                    ${view === viewOption.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:block">{viewOption.name}</span>
                </button>
              )
            })}
          </div>
          
          <Button onClick={() => setShowEventModal(true)} icon={Plus}>
            Add Event
          </Button>
        </div>
      </div>

      {/* Calendar Content */}
      {view === 'month' && renderMonthView()}
      {view === 'agenda' && renderAgendaView()}

      {/* Create/Edit Event Modal */}
      <Modal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false)
          resetForm()
        }}
        title={selectedEvent ? 'Edit Event' : 'Create Event'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Event Title"
            placeholder="Enter event title"
            value={eventForm.title}
            onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
            required
          />

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Event Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {eventTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => setEventForm(prev => ({ ...prev, type: type.id as any }))}
                  className={`
                    p-3 rounded-lg border-2 transition-all duration-200 text-left
                    ${eventForm.type === type.id
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-dark-600 bg-dark-800/50 hover:border-dark-500'
                    }
                  `}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{type.icon}</span>
                    <span className={`font-medium ${eventForm.type === type.id ? 'text-primary-300' : 'text-white'}`}>
                      {type.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Description
            </label>
            <textarea
              placeholder="Event description (optional)"
              value={eventForm.description}
              onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Start Time
              </label>
              <input
                type="datetime-local"
                value={eventForm.startTime}
                onChange={(e) => setEventForm(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-3 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                End Time
              </label>
              <input
                type="datetime-local"
                value={eventForm.endTime}
                onChange={(e) => setEventForm(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full px-3 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Priority
            </label>
            <select
              value={eventForm.priority}
              onChange={(e) => setEventForm(prev => ({ ...prev, priority: e.target.value as any }))}
              className="w-full px-3 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setShowEventModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateEvent} disabled={!eventForm.title || !eventForm.startTime || !eventForm.endTime}>
              {selectedEvent ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}