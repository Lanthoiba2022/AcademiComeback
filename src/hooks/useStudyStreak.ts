import { useState, useEffect } from 'react'
import { subDays, format, parseISO, isToday, differenceInDays } from 'date-fns'
import { getStudyStreakData } from '../lib/supabase'

export interface StudyStreakData {
  date: string
  count: number // minutes studied
  sessions: number
}

export interface StreakStats {
  currentStreak: number
  longestStreak: number
  totalStudyDays: number
  averageMinutesPerDay: number
}

export const useStudyStreak = (userId: string) => {
  const [streakData, setStreakData] = useState<StudyStreakData[]>([])
  const [streakStats, setStreakStats] = useState<StreakStats>({
    currentStreak: 0,
    longestStreak: 0,
    totalStudyDays: 0,
    averageMinutesPerDay: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      loadStreakData()
    }
  }, [userId])

  const loadStreakData = async () => {
    try {
      setLoading(true)
      
      // Get data for the last 365 days
      const endDate = new Date()
      const startDate = subDays(endDate, 365)
      
      const { data, error } = await getStudyStreakData(userId, startDate, endDate)
      
      if (error) {
        console.error('Error loading streak data:', error)
        return
      }

      if (data) {
        const formattedData = data.map(item => ({
          date: format(parseISO(item.study_date), 'yyyy-MM-dd'),
          count: item.total_minutes,
          sessions: item.session_count
        }))

        setStreakData(formattedData)
        calculateStreakStats(formattedData)
      }
    } catch (error) {
      console.error('Error loading streak data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStreakStats = (data: StudyStreakData[]) => {
    // Sort data by date
    const sortedData = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    // Filter days with at least 30 minutes of study
    const studyDays = sortedData.filter(day => day.count >= 30)
    
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    
    // Calculate current streak (working backwards from today)
    const today = format(new Date(), 'yyyy-MM-dd')
    let checkDate = new Date()
    
    while (true) {
      const dateStr = format(checkDate, 'yyyy-MM-dd')
      const dayData = studyDays.find(day => day.date === dateStr)
      
      if (dayData && dayData.count >= 30) {
        currentStreak++
        checkDate = subDays(checkDate, 1)
      } else if (isToday(checkDate)) {
        // If today has no data yet, check yesterday
        checkDate = subDays(checkDate, 1)
        continue
      } else {
        break
      }
      
      // Prevent infinite loop
      if (differenceInDays(new Date(), checkDate) > 365) break
    }
    
    // Calculate longest streak
    let lastDate: Date | null = null
    
    for (const day of studyDays) {
      const currentDate = parseISO(day.date)
      
      if (lastDate && differenceInDays(currentDate, lastDate) === 1) {
        tempStreak++
      } else {
        tempStreak = 1
      }
      
      longestStreak = Math.max(longestStreak, tempStreak)
      lastDate = currentDate
    }
    
    // Calculate average minutes per day (only counting study days)
    const totalMinutes = studyDays.reduce((sum, day) => sum + day.count, 0)
    const averageMinutesPerDay = studyDays.length > 0 ? Math.round(totalMinutes / studyDays.length) : 0
    
    setStreakStats({
      currentStreak,
      longestStreak,
      totalStudyDays: studyDays.length,
      averageMinutesPerDay
    })
  }

  return {
    streakData,
    streakStats,
    loading,
    refreshStreak: loadStreakData
  }
}
