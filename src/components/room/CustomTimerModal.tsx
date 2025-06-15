import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Timer, Clock, Coffee, BookOpen, Target } from 'lucide-react'

interface CustomTimerModalProps {
  isOpen: boolean
  onClose: () => void
  onSetTimer: (minutes: number, mode: 'work' | 'break', label?: string) => void
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
  const [customMinutes, setCustomMinutes] = useState(25)
  const [customMode, setCustomMode] = useState<'work' | 'break'>(currentMode)
  const [customLabel, setCustomLabel] = useState('')

  const handlePresetSelect = (preset: typeof presetTimers[0]) => {
    onSetTimer(preset.minutes, preset.mode, preset.label)
    onClose()
  }

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (customMinutes > 0 && customMinutes <= 180) {
      onSetTimer(customMinutes, customMode, customLabel || undefined)
      onClose()
    }
  }

  const handleClose = () => {
    setCustomMinutes(25)
    setCustomMode(currentMode)
    setCustomLabel('')
    onClose()
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title="Set Custom Timer"
      size="lg"
    >
      <div className="space-y-6">
        {/* Preset Timers */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Quick Presets</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {presetTimers.map((preset, index) => (
              <button
                key={index}
                onClick={() => handlePresetSelect(preset)}
                className="p-4 bg-dark-800/50 hover:bg-dark-700/50 border border-dark-600 hover:border-dark-500 rounded-lg transition-all duration-200 group"
              >
                <div className={`w-8 h-8 mx-auto mb-2 ${preset.color} group-hover:scale-110 transition-transform duration-200`}>
                  <preset.icon className="w-full h-full" />
                </div>
                <div className="text-center">
                  <p className="text-white font-medium text-sm">{preset.label}</p>
                  <p className="text-dark-400 text-xs">{preset.minutes} min</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Timer */}
        <div className="border-t border-dark-700 pt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Custom Timer</h3>
          
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-3 bg-dark-800/50 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                />
                <p className="text-xs text-dark-400 mt-1">1-180 minutes</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Timer Type
                </label>
                <select
                  value={customMode}
                  onChange={(e) => setCustomMode(e.target.value as 'work' | 'break')}
                  className="w-full px-4 py-3 bg-dark-800/50 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="work">Focus Session</option>
                  <option value="break">Break Time</option>
                </select>
              </div>
            </div>

            <Input
              label="Label (Optional)"
              placeholder="e.g., Math homework, Reading session"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              icon={Clock}
            />

            {/* Preview */}
            <div className="bg-dark-800/30 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  customMode === 'work' ? 'bg-primary-500/20' : 'bg-green-500/20'
                }`}>
                  {customMode === 'work' ? (
                    <Timer className={`w-5 h-5 ${customMode === 'work' ? 'text-primary-400' : 'text-green-400'}`} />
                  ) : (
                    <Coffee className="w-5 h-5 text-green-400" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-white font-medium">
                    {customLabel || (customMode === 'work' ? 'Focus Session' : 'Break Time')}
                  </p>
                  <p className="text-dark-300 text-sm">{customMinutes} minutes</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={customMinutes < 1 || customMinutes > 180}
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