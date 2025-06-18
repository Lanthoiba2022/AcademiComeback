import { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Switch } from '../ui/Switch'
import { 
  Settings, Volume2, VolumeX, Bell, BellOff, 
  Download, Shield, Palette, Eye, EyeOff
} from 'lucide-react'

export const ChatSettings = () => {
  const [settings, setSettings] = useState({
    soundNotifications: true,
    pushNotifications: true,
    autoScroll: true,
    showTimestamps: true,
    showAvatars: true,
    compactMode: false,
    darkMode: true,
    encryption: false
  })

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const exportChatHistory = () => {
    // Implementation for exporting chat history
    console.log('Exporting chat history...')
  }

  return (
    <div className="mt-4 p-4 bg-dark-800/50 rounded-lg border border-dark-700">
      <div className="flex items-center space-x-2 mb-4">
        <Settings className="w-5 h-5 text-primary-400" />
        <h3 className="text-lg font-semibold text-white">Chat Settings</h3>
      </div>

      <div className="space-y-4">
        {/* Notifications */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white">Notifications</h4>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {settings.soundNotifications ? (
                <Volume2 className="w-4 h-4 text-primary-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-dark-400" />
              )}
              <span className="text-sm text-white">Sound notifications</span>
            </div>
            <Switch
              checked={settings.soundNotifications}
              onCheckedChange={(checked: boolean) => handleSettingChange('soundNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {settings.pushNotifications ? (
                <Bell className="w-4 h-4 text-primary-400" />
              ) : (
                <BellOff className="w-4 h-4 text-dark-400" />
              )}
              <span className="text-sm text-white">Push notifications</span>
            </div>
            <Switch
              checked={settings.pushNotifications}
              onCheckedChange={(checked: boolean) => handleSettingChange('pushNotifications', checked)}
            />
          </div>
        </div>

        {/* Display */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white">Display</h4>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Eye className="w-4 h-4 text-primary-400" />
              <span className="text-sm text-white">Auto-scroll to new messages</span>
            </div>
            <Switch
              checked={settings.autoScroll}
              onCheckedChange={(checked: boolean) => handleSettingChange('autoScroll', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Eye className="w-4 h-4 text-primary-400" />
              <span className="text-sm text-white">Show timestamps</span>
            </div>
            <Switch
              checked={settings.showTimestamps}
              onCheckedChange={(checked: boolean) => handleSettingChange('showTimestamps', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Eye className="w-4 h-4 text-primary-400" />
              <span className="text-sm text-white">Show avatars</span>
            </div>
            <Switch
              checked={settings.showAvatars}
              onCheckedChange={(checked: boolean) => handleSettingChange('showAvatars', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Eye className="w-4 h-4 text-primary-400" />
              <span className="text-sm text-white">Compact mode</span>
            </div>
            <Switch
              checked={settings.compactMode}
              onCheckedChange={(checked: boolean) => handleSettingChange('compactMode', checked)}
            />
          </div>
        </div>

        {/* Security */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white">Security</h4>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-4 h-4 text-primary-400" />
              <span className="text-sm text-white">Message encryption</span>
            </div>
            <Switch
              checked={settings.encryption}
              onCheckedChange={(checked: boolean) => handleSettingChange('encryption', checked)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-4 border-t border-dark-700">
          <Button
            variant="outline"
            onClick={exportChatHistory}
            icon={Download}
            className="w-full"
          >
            Export Chat History
          </Button>
        </div>
      </div>
    </div>
  )
} 