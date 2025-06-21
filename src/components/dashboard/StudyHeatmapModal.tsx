import React from 'react'
import { X } from 'lucide-react'
import { StudyHeatmap } from './StudyHeatmap'
import { StudyStreakData, StreakStats } from '../../hooks/useStudyStreak'

interface StudyHeatmapModalProps {
  isOpen: boolean
  onClose: () => void
  data: StudyStreakData[]
  streakStats: StreakStats
}

export const StudyHeatmapModal: React.FC<StudyHeatmapModalProps> = ({
  isOpen,
  onClose,
  data,
  streakStats
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-dark-800">
          <div>
            <h2 className="text-xl font-semibold text-white">Study Activity Heatmap</h2>
            <p className="text-sm text-dark-300 mt-1">
              Track your consistency and build stronger study habits
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-dark-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] custom-scrollbar">
          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-dark-800/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">{streakStats.currentStreak}</p>
              <p className="text-sm text-dark-400">Current Streak</p>
            </div>
            <div className="bg-dark-800/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">{streakStats.longestStreak}</p>
              <p className="text-sm text-dark-400">Longest Streak</p>
            </div>
            <div className="bg-dark-800/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">{streakStats.totalStudyDays}</p>
              <p className="text-sm text-dark-400">Study Days</p>
            </div>
            <div className="bg-dark-800/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">{streakStats.averageMinutesPerDay}m</p>
              <p className="text-sm text-dark-400">Daily Average</p>
            </div>
          </div>

          {/* Heatmap */}
          <StudyHeatmap data={data} />

          {/* Tips */}
          <div className="mt-8 bg-primary-500/10 border border-primary-500/20 rounded-lg p-4">
            <h4 className="text-sm font-medium text-primary-400 mb-2">💡 Tips for Building Streaks</h4>
            <ul className="text-sm text-dark-300 space-y-1">
              <li>• Study for at least 30 minutes daily to maintain your streak</li>
              <li>• Consistency is more important than duration - aim for daily progress</li>
              <li>• Use the Pomodoro technique to make study sessions more manageable</li>
              <li>• Join study rooms to stay motivated and accountable</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
