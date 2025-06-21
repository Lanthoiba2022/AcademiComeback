import { useState } from 'react'
import { Button } from '../ui/Button'
import { Play, Pause, RotateCcw, Volume2, VolumeX, Timer, Settings } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { X, Clock, Coffee, Focus } from 'lucide-react'

interface TimerState {
  minutes: number
  seconds: number
  isRunning: boolean
  mode: 'work' | 'break'
  cycle: number
  totalCycles: number
  label?: string
  totalElapsed: number // Total elapsed time in seconds for this session
}

interface TimerControlsProps {
  timerState: TimerState
  onToggleTimer: () => void
  onResetTimer: () => void
  onSetCustomTimer: (minutes: number, mode: 'work' | 'break', label?: string, cycles?: number) => void
  audioEnabled: boolean
  onToggleAudio: () => void
  roomTotalStudyTime: number // in minutes
  userTodayFocusTime: number // in minutes
}

export const TimerControls = ({
  timerState,
  onToggleTimer,
  onResetTimer,
  onSetCustomTimer,
  audioEnabled,
  onToggleAudio,
  roomTotalStudyTime,
  userTodayFocusTime
}: TimerControlsProps) => {
  const [isCustomTimerModalOpen, setIsCustomTimerModalOpen] = useState(false)

  const formatTime = (minutes: number, seconds: number) => {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const formatDuration = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const getProgress = () => {
    const totalMinutes = timerState.mode === 'work' ? 25 : timerState.cycle % 4 === 0 ? 15 : 5
    const totalSeconds = totalMinutes * 60
    const currentSeconds = timerState.minutes * 60 + timerState.seconds
    return ((totalSeconds - currentSeconds) / totalSeconds) * 100
  }

  const circumference = 2 * Math.PI * 45 // radius = 45
  const strokeDashoffset = circumference - (getProgress() / 100) * circumference

  // Calculate session progress (elapsed time)
  const sessionElapsedMinutes = Math.floor(timerState.totalElapsed / 60)

  const handleCustomTimerSubmit = (minutes: number, mode: 'work' | 'break', label?: string, cycles?: number) => {
    onSetCustomTimer(minutes, mode, label, cycles)
    setIsCustomTimerModalOpen(false)
  }

  return (
    <>
      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between px-0.5 sm:px-6 h-full w-full bg-dark-900/95 sm:bg-transparent border-t border-dark-700/70 sm:border-none shadow-lg sm:shadow-none">
        {/* Timer Display */}
        <div className="flex items-center justify-center gap-0.5 sm:gap-4 w-full sm:w-auto py-0">
          <div className="relative">
            <svg className="w-7 h-7 sm:w-16 sm:h-16 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-dark-700"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={`transition-all duration-1000 ${
                  timerState.mode === 'work' ? 'text-primary-500' : 'text-accent-500'
                }`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Timer className={`w-3.5 h-3.5 sm:w-6 sm:h-6 ${
                timerState.mode === 'work' ? 'text-primary-400' : 'text-accent-400'
              }`} />
            </div>
          </div>
          <div>
            <div className="text-base sm:text-2xl font-mono font-bold text-white">
              {formatTime(timerState.minutes, timerState.seconds)}
            </div>
            <div className="text-[10px] sm:text-sm text-dark-200">
              {timerState.label || (timerState.mode === 'work' ? 'Focus Time' : 'Break Time')}
              {timerState.mode === 'work' && (
                <span> • Cycle {timerState.cycle}/{timerState.totalCycles}</span>
              )}
            </div>
            {sessionElapsedMinutes > 0 && (
              <div className="text-[10px] sm:text-xs text-dark-400">
                Session: {formatDuration(sessionElapsedMinutes)}
              </div>
            )}
          </div>
        </div>
        {/* Timer Controls */}
        <div className="flex flex-wrap justify-center gap-0.5 sm:flex-nowrap sm:items-center sm:space-x-3 w-full sm:w-auto mt-0.5">
          <Button
            variant={timerState.isRunning ? "outline" : "primary"}
            size="sm"
            icon={timerState.isRunning ? Pause : Play}
            onClick={onToggleTimer}
            className="px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-base"
          >
            {timerState.isRunning ? 'Pause' : 'Start'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={RotateCcw}
            onClick={onResetTimer}
            className="px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-base"
          >
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={Settings}
            onClick={() => setIsCustomTimerModalOpen(true)}
            title="Custom Timer"
            className="px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-base"
          >
            Custom
          </Button>
          <div className="h-8 w-px bg-dark-600 mx-2 hidden sm:block" />
          <Button
            variant={audioEnabled ? "primary" : "outline"}
            size="sm"
            icon={audioEnabled ? Volume2 : VolumeX}
            onClick={onToggleAudio}
            title="Toggle audio notifications"
            className="px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-base"
          />
        </div>
        {/* Study Stats */}
        <div className="text-center sm:text-right space-y-0.5 w-full sm:w-auto mt-0.5">
          <div className="flex items-center justify-center sm:justify-end">
            <div>
              <div className="text-[10px] sm:text-lg font-semibold text-white">
                {formatDuration(userTodayFocusTime)}
              </div>
              <div className="text-[10px] sm:text-sm text-dark-300">Your focus today</div>
            </div>
          </div>
        </div>
      </div>
      {/* Custom Timer Modal */}
      <CustomTimerModal
        isOpen={isCustomTimerModalOpen}
        onClose={() => setIsCustomTimerModalOpen(false)}
        onSubmit={handleCustomTimerSubmit}
      />
    </>
  )
}

interface CustomTimerModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (minutes: number, mode: 'work' | 'break', label?: string, cycles?: number) => void
}

export const CustomTimerModal = ({ isOpen, onClose, onSubmit }: CustomTimerModalProps) => {
  const [minutes, setMinutes] = useState(25)
  const [mode, setMode] = useState<'work' | 'break'>('work')
  const [label, setLabel] = useState('')
  const [cycles, setCycles] = useState(4)

  const presetTimers = [
    { minutes: 15, mode: 'work' as const, label: 'Quick Focus', icon: Focus },
    { minutes: 25, mode: 'work' as const, label: 'Pomodoro', icon: Clock },
    { minutes: 45, mode: 'work' as const, label: 'Deep Work', icon: Focus },
    { minutes: 5, mode: 'break' as const, label: 'Short Break', icon: Coffee },
    { minutes: 15, mode: 'break' as const, label: 'Long Break', icon: Coffee },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (minutes > 0 && cycles > 0) {
      onSubmit(minutes, mode, label.trim() || undefined, cycles)
    }
  }

  const handlePresetClick = (preset: typeof presetTimers[0]) => {
    setMinutes(preset.minutes)
    setMode(preset.mode)
    setLabel(preset.label)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Custom Timer" size="md">
      {/* Preset Timers */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-dark-300 mb-2">Quick Presets</h3>
        <div className="grid grid-cols-2 gap-2">
          {presetTimers.map((preset, index) => {
            const Icon = preset.icon
            return (
              <button
                key={index}
                type="button"
                onClick={() => handlePresetClick(preset)}
                className="flex items-center space-x-2 p-2 rounded-lg border border-dark-600 hover:border-primary-500 hover:bg-dark-700 transition-colors text-left"
              >
                <Icon className={`w-4 h-4 ${preset.mode === 'work' ? 'text-primary-400' : 'text-accent-400'}`} />
                <div>
                  <div className="text-sm font-medium text-white">{preset.label}</div>
                  <div className="text-xs text-dark-400">{preset.minutes} min</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
      {/* Custom Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex space-x-2">
          <div className="flex-1">
            <label className="block text-xs font-medium text-dark-300 mb-1">
              Duration (min)
            </label>
            <input
              type="number"
              min="1"
              max="180"
              value={minutes}
              onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
              className="w-full px-2 py-1.5 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500 text-sm"
              placeholder="Minutes"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-dark-300 mb-1">
              Cycles
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="px-2 py-1 rounded bg-dark-600 text-white text-xs focus:outline-none"
                onClick={() => setCycles(c => Math.max(1, c - 1))}
                tabIndex={-1}
              >-</button>
              <input
                type="number"
                min="1"
                max="12"
                value={cycles}
                onChange={(e) => {
                  const val = parseInt(e.target.value)
                  setCycles(isNaN(val) ? 1 : Math.max(1, Math.min(12, val)))
                }}
                className="w-10 px-2 py-1.5 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500 text-sm text-center hide-spin"
                placeholder="Cycles"
                inputMode="numeric"
                pattern="[0-9]*"
              />
              <button
                type="button"
                className="px-2 py-1 rounded bg-dark-600 text-white text-xs focus:outline-none"
                onClick={() => setCycles(c => Math.min(12, c + 1))}
                tabIndex={-1}
              >+</button>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-dark-300 mb-1">
            Timer Type
          </label>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setMode('work')}
              className={`flex-1 py-1.5 px-2 rounded-lg border transition-colors text-sm ${
                mode === 'work'
                  ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                  : 'border-dark-600 text-dark-300 hover:border-dark-500'
              }`}
            >
              Focus
            </button>
            <button
              type="button"
              onClick={() => setMode('break')}
              className={`flex-1 py-1.5 px-2 rounded-lg border transition-colors text-sm ${
                mode === 'break'
                  ? 'border-accent-500 bg-accent-500/10 text-accent-400'
                  : 'border-dark-600 text-dark-300 hover:border-dark-500'
              }`}
            >
              Break
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-dark-300 mb-1">
            Label (optional)
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-2 py-1.5 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:border-primary-500 text-sm"
            placeholder="e.g., Math Study, Reading"
            maxLength={30}
          />
        </div>
        {/* Actions */}
        <div className="flex space-x-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={minutes <= 0 || cycles <= 0}
          >
            Set Timer
          </Button>
        </div>
      </form>
    </Modal>
  )
}
