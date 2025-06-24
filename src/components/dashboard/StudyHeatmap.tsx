import React from 'react'
import CalendarHeatmap from 'react-calendar-heatmap'
import { subDays, format, parseISO } from 'date-fns'
import { Card } from '../ui/Card'
import { StudyStreakData } from '../../hooks/useStudyStreak'
import 'react-calendar-heatmap/dist/styles.css'
import type { ReactCalendarHeatmapValue } from 'react-calendar-heatmap'

// Add local type declaration for react-calendar-heatmap if missing
// @ts-ignore
// eslint-disable-next-line
declare module 'react-calendar-heatmap';

interface StudyHeatmapProps {
  data: StudyStreakData[]
  className?: string
}

export const StudyHeatmap: React.FC<StudyHeatmapProps> = ({ data, className = '' }) => {
  // Only include days with study activity
  const activityMap = new Map<string, StudyStreakData>()
  data.forEach(d => activityMap.set(d.date, d))

  // Calculate the start date (1 year ago from today, aligned to the previous Sunday)
  const today = new Date()
  const endDate = new Date(today)
  endDate.setHours(0, 0, 0, 0)
  const startDate = new Date(endDate)
  startDate.setFullYear(endDate.getFullYear() - 1)
  // Align startDate to the previous Sunday
  startDate.setDate(startDate.getDate() - startDate.getDay())

  // Build a 7x53 grid (53 weeks, 7 days per week)
  const days: { date: string, value: number, month: number, isFuture: boolean }[] = []
  let d = new Date(startDate)
  for (let i = 0; i < 371; i++) {
    const dateStr = format(d, 'yyyy-MM-dd')
    const isFuture = d > endDate
    days.push({ date: dateStr, value: isFuture ? 0 : activityMap.get(dateStr)?.count || 0, month: d.getMonth(), isFuture })
    d.setDate(d.getDate() + 1)
  }

  // Group days into weeks (columns)
  const weeks: { date: string, value: number, month: number, isFuture: boolean }[][] = []
  for (let w = 0; w < 53; w++) {
    weeks.push(days.slice(w * 7, (w + 1) * 7))
  }

  // Month labels (show at the first week of each month)
  const monthLabels: string[] = []
  let lastMonth = -1
  for (let w = 0; w < weeks.length; w++) {
    const week = weeks[w]
    const firstDay = week[0]
    if (firstDay && firstDay.month !== lastMonth) {
      monthLabels[w] = format(new Date(firstDay.date), 'MMM')
      lastMonth = firstDay.month
    } else {
      monthLabels[w] = ''
    }
  }

  // Day labels (Mon, Wed, Fri)
  const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', '']

  // Color scale (GitHub style, darker green variations)
  const getColor = (value: number) => {
    if (value >= 240) return '#164c26'   // darkest green
    if (value >= 120) return '#216e39'   // dark green
    if (value >= 60)  return '#30a14e'   // medium green
    if (value >= 30)  return '#40c463'   // light green
    if (value > 0)    return '#9be9a8'   // very light green
    return '#23272e'  // background for zero activity
  }

  const getTitle = (date: string, value: number) => {
    if (value > 0) {
      const hours = Math.floor(value / 60)
      const minutes = value % 60
      const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
      return `${format(parseISO(date), 'MMM d, yyyy')}: ${timeStr} studied`
    }
    return `${format(parseISO(date), 'MMM d, yyyy')}: No study activity`
  }

  return (
    <Card className={`p-6 sm:p-10 ${className}`} style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-1">Yearly Study Activity</h3>
        <p className="text-base text-dark-300">Past 12 months</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Month labels and heatmap grid - mobile scrollable wrapper */}
        <div
          className="heatmap-scroll-wrapper"
          style={{
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            maxWidth: '100%',
            marginLeft: 0,
            marginRight: 0,
          }}
        >
          {/* Month labels */}
          <div
            style={{
              display: 'flex',
              marginLeft: 40,
              marginBottom: 4,
              width: 53 * 18 + 40,
              minWidth: 700,
            }}
            className="heatmap-month-labels"
          >
            {monthLabels.map((label, i) => (
              <div key={i} style={{ width: 18, textAlign: 'left', fontSize: 15, color: '#b0b7c3', fontWeight: 700 }}>{label}</div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            {/* Day labels */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', marginRight: 8 }}>
              {dayLabels.map((label, i) => (
                <div key={i} style={{ height: 20, fontSize: 15, color: '#b0b7c3', fontWeight: 700, marginTop: i === 0 ? 18 : 0 }}>{label}</div>
              ))}
            </div>
            {/* Heatmap grid */}
            <div style={{ display: 'flex', gap: 2, width: 53 * 18, minWidth: 53 * 18 }}>
              {weeks.map((week, wi) => (
                <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {week.map((day, di) => (
                    day.isFuture ? (
                      <div
                        key={day.date}
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 3,
                          background: 'transparent',
                          border: '1px solid transparent',
                        }}
                      />
                    ) : (
                      <div
                        key={day.date}
                        title={getTitle(day.date, day.value)}
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 3,
                          background: getColor(day.value),
                          border: '1px solid #2d3748',
                          transition: 'background 0.2s',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                          cursor: day.value > 0 ? 'pointer' : 'default',
                        }}
                        onMouseOver={e => {
                          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 2px #38b2ac';
                        }}
                        onMouseOut={e => {
                          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 2px rgba(0,0,0,0.08)';
                        }}
                      />
                    )
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-6 text-sm text-dark-400">
        <span>Less</span>
        <div className="flex items-center gap-1">
          <div style={{ width: 16, height: 16, borderRadius: 3, background: '#23272e', border: '1px solid #2d3748' }} />
          <div style={{ width: 16, height: 16, borderRadius: 3, background: '#9be9a8', border: '1px solid #2d3748' }} />
          <div style={{ width: 16, height: 16, borderRadius: 3, background: '#40c463', border: '1px solid #2d3748' }} />
          <div style={{ width: 16, height: 16, borderRadius: 3, background: '#30a14e', border: '1px solid #2d3748' }} />
          <div style={{ width: 16, height: 16, borderRadius: 3, background: '#216e39', border: '1px solid #2d3748' }} />
          <div style={{ width: 16, height: 16, borderRadius: 3, background: '#164c26', border: '1px solid #2d3748' }} />
        </div>
        <span>More</span>
      </div>
    </Card>
  )
}
