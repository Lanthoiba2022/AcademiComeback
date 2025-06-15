export interface CalendarEvent {
  id: string
  title: string
  description?: string
  type: 'study-session' | 'quiz' | 'deadline' | 'reminder' | 'meeting'
  startTime: string
  endTime: string
  isAllDay: boolean
  roomId?: string
  participants?: string[]
  location?: string
  priority: 'low' | 'medium' | 'high'
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  reminders: EventReminder[]
  recurrence?: RecurrenceRule
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface EventReminder {
  id: string
  type: 'notification' | 'email' | 'sms'
  minutesBefore: number
  isEnabled: boolean
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly'
  interval: number
  daysOfWeek?: number[] // 0-6, Sunday = 0
  endDate?: string
  occurrences?: number
}

export interface CalendarView {
  type: 'month' | 'week' | 'day' | 'agenda'
  currentDate: string
  events: CalendarEvent[]
}

export interface StudyBlock {
  id: string
  title: string
  duration: number // minutes
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedFocusTime: number
  actualFocusTime?: number
  tasks: string[]
  isCompleted: boolean
}