import { useState, useEffect, useCallback } from 'react'
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

export const useStudyStreak = (userId: string, totalFocusMinutes: number = 0, userCreatedAt?: string) => {
  const [streakData, setStreakData] = useState<StudyStreakData[]>([])
  const [streakStats, setStreakStats] = useState<StreakStats>({
    currentStreak: 0,
    longestStreak: 0,
    totalStudyDays: 0,
    averageMinutesPerDay: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Calculate average independently when totalFocusMinutes changes
  const calculateAverageOnly = useCallback(() => {
    if (!userCreatedAt) return
    
    let totalDays = 365 // Default to 365 days if no userCreatedAt
    
    const joinDate = new Date(userCreatedAt)
    const today = new Date()
    totalDays = differenceInDays(today, joinDate) + 1 // +1 to include both join date and today
    totalDays = Math.max(totalDays, 1) // Ensure at least 1 day
    
    const averageMinutesPerDay = Math.round(totalFocusMinutes / totalDays)
    
    setStreakStats(prev => ({
      ...prev,
      averageMinutesPerDay
    }))
    
    console.log('Updated average only - Total focus minutes:', totalFocusMinutes, 'Total active days:', totalDays, 'Average:', averageMinutesPerDay)
  }, [totalFocusMinutes, userCreatedAt])

  // Initialize average immediately when hook mounts and recalculate on every render
  useEffect(() => {
    if (userCreatedAt) {
      calculateAverageOnly()
    }
  })

  const loadStreakData = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Get data for the last 365 days
      const endDate = new Date()
      const startDate = subDays(endDate, 365)
      
      console.log('Loading streak data for user:', userId, 'from', startDate, 'to', endDate)
      
      const { data, error } = await getStudyStreakData(userId, startDate, endDate)
      
      if (error) {
        console.error('Error loading streak data:', error)
        setError('Failed to load streak data')
        return
      }

      console.log('Streak data received:', data)

      if (data) {
        const formattedData = data.map((item: any) => ({
          date: format(parseISO(item.study_date), 'yyyy-MM-dd'),
          count: item.total_minutes,
          sessions: item.session_count
        }))

        console.log('Formatted streak data:', formattedData)
        setStreakData(formattedData)
        calculateStreakStats(formattedData)
      } else {
        setStreakData([])
        setStreakStats(prev => ({
          ...prev,
          currentStreak: 0,
          longestStreak: 0,
          totalStudyDays: 0
        }))
      }
    } catch (error) {
      console.error('Error loading streak data:', error)
      setError('Failed to load streak data')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const calculateStreakStats = useCallback((data: StudyStreakData[]) => {
    console.log('Calculating streak stats from data:', data)
    
    // Sort data by date
    const sortedData = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    // Filter days with at least 30 minutes of study
    const studyDays = sortedData.filter(day => day.count >= 30)
    console.log('Study days with >= 30 minutes:', studyDays)
    
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
    
    // Calculate average minutes per day using total focus time and user's active days
    let totalDays = 365 // Default to 365 days if no userCreatedAt
    
    if (userCreatedAt) {
      const joinDate = new Date(userCreatedAt)
      const today = new Date()
      totalDays = differenceInDays(today, joinDate) + 1 // +1 to include both join date and today
      totalDays = Math.max(totalDays, 1) // Ensure at least 1 day
    }
    
    const averageMinutesPerDay = Math.round(totalFocusMinutes / totalDays)
    
    const finalStats = {
      currentStreak,
      longestStreak,
      totalStudyDays: studyDays.length,
      averageMinutesPerDay
    }
    
    console.log('Calculated streak stats:', finalStats)
    console.log('Total focus minutes:', totalFocusMinutes, 'Total active days:', totalDays, 'Average:', averageMinutesPerDay)
    setStreakStats(finalStats)
  }, [totalFocusMinutes, userCreatedAt])

  useEffect(() => {
    loadStreakData()
  }, [loadStreakData])

  // Recalculate average when totalFocusMinutes changes (e.g., after page refresh)
  useEffect(() => {
    // Always recalculate average when totalFocusMinutes changes
    calculateAverageOnly()
  }, [totalFocusMinutes, calculateAverageOnly])

  // Auto-refresh every 5 minutes to keep data fresh
  useEffect(() => {
    if (!userId) return

    const interval = setInterval(() => {
      console.log('Auto-refreshing streak data...')
      loadStreakData()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [userId, loadStreakData])

  return {
    streakData,
    streakStats,
    loading,
    error,
    refreshStreak: loadStreakData
  }
}
