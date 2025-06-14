import { Button } from '../ui/Button'
import { Play, Pause, RotateCcw, Volume2, VolumeX, Timer } from 'lucide-react'

interface TimerState {
  minutes: number
  seconds: number
  isRunning: boolean
  mode: 'work' | 'break'
  cycle: number
  totalCycles: number
}

interface TimerControlsProps {
  timerState: TimerState
  onToggleTimer: () => void
  onResetTimer: () => void
  audioEnabled: boolean
  onToggleAudio: () => void
}

export const TimerControls = ({
  timerState,
  onToggleTimer,
  onResetTimer,
  audioEnabled,
  onToggleAudio
}: TimerControlsProps) => {
  const formatTime = (minutes: number, seconds: number) => {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const getProgress = () => {
    const totalMinutes = timerState.mode === 'work' ? 25 : timerState.cycle % 4 === 0 ? 15 : 5
    const totalSeconds = totalMinutes * 60
    const currentSeconds = timerState.minutes * 60 + timerState.seconds
    return ((totalSeconds - currentSeconds) / totalSeconds) * 100
  }

  const circumference = 2 * Math.PI * 45 // radius = 45
  const strokeDashoffset = circumference - (getProgress() / 100) * circumference

  return (
    <div className="flex items-center justify-between px-6 h-full">
      {/* Timer Display */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          {/* Circular Progress */}
          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
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
          
          {/* Timer Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Timer className={`w-6 h-6 ${
              timerState.mode === 'work' ? 'text-primary-400' : 'text-accent-400'
            }`} />
          </div>
        </div>

        <div>
          <div className="text-2xl font-mono font-bold text-white">
            {formatTime(timerState.minutes, timerState.seconds)}
          </div>
          <div className="text-sm text-dark-300">
            {timerState.mode === 'work' ? 'Focus Time' : 'Break Time'} • 
            Cycle {timerState.cycle}/{timerState.totalCycles}
          </div>
        </div>
      </div>

      {/* Timer Controls */}
      <div className="flex items-center space-x-3">
        <Button
          variant={timerState.isRunning ? "outline" : "primary"}
          size="lg"
          icon={timerState.isRunning ? Pause : Play}
          onClick={onToggleTimer}
        >
          {timerState.isRunning ? 'Pause' : 'Start'}
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          icon={RotateCcw}
          onClick={onResetTimer}
        >
          Reset
        </Button>

        <div className="h-8 w-px bg-dark-600 mx-2" />

        <Button
          variant={audioEnabled ? "primary" : "outline"}
          size="sm"
          icon={audioEnabled ? Volume2 : VolumeX}
          onClick={onToggleAudio}
        />
      </div>

      {/* Session Stats */}
      <div className="text-right">
        <div className="text-lg font-semibold text-white">2h 34m</div>
        <div className="text-sm text-dark-300">Today's focus time</div>
      </div>
    </div>
  )
}