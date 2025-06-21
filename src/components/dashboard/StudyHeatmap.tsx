import React from 'react'
import CalendarHeatmap from 'react-calendar-heatmap'
import { subDays, format } from 'date-fns'
import { Card } from '../ui/Card'
import { StudyStreakData } from '../../hooks/useStudyStreak'
import 'react-calendar-heatmap/dist/styles.css'

interface StudyHeatmapProps {
  data: StudyStreakData[]
  className?: string
}

export const StudyHeatmap: React.FC<StudyHeatmapProps> = ({ data, className = '' }) => {
  const endDate = new Date()
  const startDate = subDays(endDate, 365)

  const getClassForValue = (value: StudyStreakData | null) => {
    if (!value || value.count < 30) {
      return 'color-empty'
    }
    
    if (value.count >= 240) return 'color-scale-4' // 4+ hours
    if (value.count >= 120) return 'color-scale-3' // 2+ hours
    if (value.count >= 60) return 'color-scale-2'  // 1+ hour
    return 'color-scale-1' // 30+ minutes
  }

  const getTitleForValue = (value: StudyStreakData | null) => {
    if (!value) {
      return 'No study time recorded'
    }
    
    const hours = Math.floor(value.count / 60)
    const minutes = value.count % 60
    const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
    
    return `${format(new Date(value.date), 'MMM d, yyyy')}: ${timeStr} studied (${value.sessions} sessions)`
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">Study Activity</h3>
        <p className="text-sm text-dark-300">
          Your study activity over the past year. Each square represents a day.
        </p>
      </div>

      <div className="study-heatmap-container">
        <CalendarHeatmap
          startDate={startDate}
          endDate={endDate}
          values={data}
          classForValue={getClassForValue}
          titleForValue={getTitleForValue}
          showWeekdayLabels={true}
          showMonthLabels={true}
          onClick={(value) => {
            if (value) {
              console.log('Clicked on:', value)
            }
          }}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-6 text-xs text-dark-400">
        <span>Less</span>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-dark-800 rounded-sm" title="No activity" />
          <div className="w-3 h-3 color-scale-1 rounded-sm" title="30-59 minutes" />
          <div className="w-3 h-3 color-scale-2 rounded-sm" title="1-2 hours" />
          <div className="w-3 h-3 color-scale-3 rounded-sm" title="2-4 hours" />
          <div className="w-3 h-3 color-scale-4 rounded-sm" title="4+ hours" />
        </div>
        <span>More</span>
      </div>
    </Card>
  )
}
