import { useState, useEffect } from 'react'
import { Sidebar } from '../components/dashboard/Sidebar'
import { StudyCalendar } from '../components/calendar/StudyCalendar'
import { CalendarEvent } from '../types/calendar'

// Mock data generator
const generateMockEvents = (): CalendarEvent[] => {
  const today = new Date()
  const events: CalendarEvent[] = []

  // Generate some sample events
  for (let i = 0; i < 10; i++) {
    const eventDate = new Date(today)
    eventDate.setDate(eventDate.getDate() + Math.floor(Math.random() * 14) - 7)
    eventDate.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0)
    
    const endDate = new Date(eventDate)
    endDate.setHours(eventDate.getHours() + 1 + Math.floor(Math.random() * 2))

    const types: CalendarEvent['type'][] = ['study-session', 'quiz', 'deadline', 'reminder', 'meeting']
    const priorities: CalendarEvent['priority'][] = ['low', 'medium', 'high']
    
    events.push({
      id: `event-${i}`,
      title: `Study Session ${i + 1}`,
      description: `Description for study session ${i + 1}`,
      type: types[Math.floor(Math.random() * types.length)],
      startTime: eventDate.toISOString(),
      endTime: endDate.toISOString(),
      isAllDay: false,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      status: 'scheduled',
      reminders: [
        {
          id: `reminder-${i}`,
          type: 'notification',
          minutesBefore: 15,
          isEnabled: true
        }
      ],
      createdBy: 'current-user',
      createdAt: today.toISOString(),
      updatedAt: today.toISOString()
    })
  }

  return events
}

export const CalendarPage = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([])

  useEffect(() => {
    // In a real app, this would fetch from the API
    setEvents(generateMockEvents())
  }, [])

  const handleCreateEvent = (eventData: Partial<CalendarEvent>) => {
    const newEvent: CalendarEvent = {
      id: `event-${Date.now()}`,
      title: eventData.title || 'New Event',
      description: eventData.description || '',
      type: eventData.type || 'study-session',
      startTime: eventData.startTime || new Date().toISOString(),
      endTime: eventData.endTime || new Date().toISOString(),
      isAllDay: eventData.isAllDay || false,
      priority: eventData.priority || 'medium',
      status: 'scheduled',
      reminders: eventData.reminders || [
        {
          id: `reminder-${Date.now()}`,
          type: 'notification',
          minutesBefore: 15,
          isEnabled: true
        }
      ],
      createdBy: 'current-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    setEvents(prev => [...prev, newEvent])
  }

  const handleUpdateEvent = (eventId: string, updates: Partial<CalendarEvent>) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, ...updates, updatedAt: new Date().toISOString() }
        : event
    ))
  }

  const handleDeleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId))
  }

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Sidebar />
      <div className="lg:ml-64 p-4 lg:p-8">
        <StudyCalendar
          events={events}
          onCreateEvent={handleCreateEvent}
          onUpdateEvent={handleUpdateEvent}
          onDeleteEvent={handleDeleteEvent}
        />
      </div>
    </div>
  )
}