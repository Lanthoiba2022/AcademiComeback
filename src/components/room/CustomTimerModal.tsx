import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Timer, Clock, Coffee, BookOpen, Target } from 'lucide-react'

interface CustomTimerModalProps {
  isOpen: boolean
  onClose: () => void
  onSetTimer: (minutes: number, mode: 'work' | 'break', label?: string, cycles?: number) => void
  currentMode: 'work' | 'break'
}

const presetTimers = [
  { minutes: 25, mode: 'work' as const, label: 'Pomodoro Focus', icon: Target, color: 'text-red-400' },
  { minutes: 50, mode: 'work' as const, label: 'Deep Work', icon: BookOpen, color: 'text-blue-400' },
  { minutes: 90, mode: 'work' as const, label: 'Flow State', icon: Timer, color: 'text-purple-400' },
  { minutes: 5, mode: 'break' as const, label: 'Quick Break', icon: Coffee, color: 'text-green-400' },
  { minutes: 15, mode: 'break' as const, label: 'Long Break', icon: Coffee, color: 'text-green-400' },
  { minutes: 30, mode: 'break' as const, label: 'Meal Break', icon: Coffee, color: 'text-green-400' },
]

export const CustomTimerModal = ({ isOpen, onClose, onSetTimer, currentMode }: CustomTimerModalProps) => {
  const [customMinutes, setCustomMinutes] = useState('25')
  const [customMode, setCustomMode] = useState<'work' | 'break'>(currentMode)
  const [customLabel, setCustomLabel] = useState('')
  const [customCycles, setCustomCycles] = useState(4)

  const handlePresetSelect = (preset: typeof presetTimers[0]) => {
    const cycles = preset.mode === 'work' ? customCycles : undefined
    onSetTimer(preset.minutes, preset.mode, preset.label, cycles)
    onClose()
  }

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const minutes = parseInt(customMinutes)
    if (minutes > 0 && minutes <= 180) {
      const cycles = customMode === 'work' ? customCycles : undefined
      onSetTimer(minutes, customMode, customLabel || undefined, cycles)
      onClose()
    }
  }

  const handleClose = () => {
    setCustomMinutes('25')
    setCustomMode(currentMode)
    setCustomLabel('')
    setCustomCycles(4)
    onClose()
  }

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow empty input for better UX
    if (value === '') {
      setCustomMinutes('')
      return
    }
    // Only allow numbers
    if (/^\d*$/.test(value)) {
      const numValue = parseInt(value)
      if (numValue <= 180) {
        setCustomMinutes(value)
      }
    }
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title="Set Custom Timer"
      size="md"
    >
      <div className="space-y-4">
        {/* Preset Timers */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Quick Presets</h3>
          <div className="grid grid-cols-3 gap-2">
            {presetTimers.map((preset, index) => (
              <button
                key={index}
                onClick={() => handlePresetSelect(preset)}
                className="p-2 bg-dark-800/50 hover:bg-dark-700/50 border border-dark-600 hover:border-dark-500 rounded-lg transition-all duration-200 group"
              >
                <div className={`w-6 h-6 mx-auto mb-1 ${preset.color} group-hover:scale-110 transition-transform duration-200`}>
                  <preset.icon className="w-full h-full" />
                </div>
                <div className="text-center">
                  <p className="text-white font-medium text-xs">{preset.label}</p>
                  <p className="text-dark-400 text-xs">{preset.minutes} min</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Timer */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Custom Timer</h3>
          <form onSubmit={handleCustomSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-dark-300 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={customMinutes}
                  onChange={handleMinutesChange}
                  className="w-full px-3 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  placeholder="1-180"
                />
                <p className="text-xs text-dark-400 mt-1">1-180 minutes</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-dark-300 mb-1">
                  Timer Type
                </label>
                <select
                  value={customMode}
                  onChange={(e) => setCustomMode(e.target.value as 'work' | 'break')}
                  className="w-full px-3 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="work">Focus Session</option>
                  <option value="break">Break Time</option>
                </select>
              </div>
            </div>

            {customMode === 'work' && (
              <div>
                <label className="block text-xs font-medium text-dark-300 mb-1">
                  Number of Cycles
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={customCycles}
                    onChange={(e) => setCustomCycles(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-20 px-3 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  />
                  <span className="text-xs text-dark-400">cycles (1-10)</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-dark-300 mb-1">
                Label (Optional)
              </label>
              <Input
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="e.g., Math homework, Reading session"
                className="text-sm"
              />
            </div>

            {/* Preview */}
            <div className="bg-dark-800/30 rounded-lg p-2">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  customMode === 'work' ? 'bg-primary-500/20' : 'bg-green-500/20'
                }`}>
                  {customMode === 'work' ? (
                    <Timer className={`w-4 h-4 ${customMode === 'work' ? 'text-primary-400' : 'text-green-400'}`} />
                  ) : (
                    <Coffee className="w-4 h-4 text-green-400" />
                  )}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">
                    {customLabel || (customMode === 'work' ? 'Focus Session' : 'Break Time')}
                  </p>
                  <p className="text-dark-300 text-xs">
                    {customMinutes} minutes
                    {customMode === 'work' && ` • ${customCycles} cycles`}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit"
                size="sm"
                disabled={!customMinutes || parseInt(customMinutes) < 1 || parseInt(customMinutes) > 180}
                icon={Timer}
              >
                Set Timer
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  )
}