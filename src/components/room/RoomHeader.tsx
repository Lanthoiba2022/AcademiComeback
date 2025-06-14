import { Button } from '../ui/Button'
import { 
  ArrowLeft, Settings, Users, Crown, Mic, MicOff, 
  Video, VideoOff, Volume2, VolumeX, MoreVertical 
} from 'lucide-react'
import { Room } from '../../types'

interface RoomHeaderProps {
  room: Room
  onBack: () => void
  audioEnabled: boolean
  micEnabled: boolean
  videoEnabled: boolean
  onToggleAudio: () => void
  onToggleMic: () => void
  onToggleVideo: () => void
}

export const RoomHeader = ({ 
  room, 
  onBack, 
  audioEnabled, 
  micEnabled, 
  videoEnabled,
  onToggleAudio,
  onToggleMic,
  onToggleVideo
}: RoomHeaderProps) => {
  return (
    <div className="h-20 bg-dark-900/90 backdrop-blur-xl border-b border-dark-700/50 px-6">
      <div className="flex items-center justify-between h-full">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            icon={ArrowLeft}
            onClick={onBack}
          >
            Back
          </Button>
          
          <div className="h-8 w-px bg-dark-600" />
          
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-semibold text-white">{room.name}</h1>
              <div className={`w-2 h-2 rounded-full ${room.isActive ? 'bg-green-400' : 'bg-dark-500'}`} />
            </div>
            <div className="flex items-center space-x-2 text-sm text-dark-300">
              <Users className="w-4 h-4" />
              <span>{room.members.length} members</span>
              <span>•</span>
              <span>Code: {room.code}</span>
            </div>
          </div>
        </div>

        {/* Center Section - Audio/Video Controls */}
        <div className="flex items-center space-x-2">
          <Button
            variant={audioEnabled ? "primary" : "outline"}
            size="sm"
            icon={audioEnabled ? Volume2 : VolumeX}
            onClick={onToggleAudio}
          />
          <Button
            variant={micEnabled ? "primary" : "outline"}
            size="sm"
            icon={micEnabled ? Mic : MicOff}
            onClick={onToggleMic}
          />
          <Button
            variant={videoEnabled ? "primary" : "outline"}
            size="sm"
            icon={videoEnabled ? Video : VideoOff}
            onClick={onToggleVideo}
          />
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            icon={Settings}
          >
            Settings
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={MoreVertical}
          />
        </div>
      </div>
    </div>
  )
}