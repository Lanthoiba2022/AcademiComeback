import { Button } from '../ui/Button'
import { 
  ArrowLeft, Settings, Users, Crown, Mic, MicOff, 
  Video, VideoOff, Volume2, VolumeX, MoreVertical 
} from 'lucide-react'
import { Room } from '../../types'
import { useState } from 'react'
import { MemberList } from './MemberList'
import { Modal } from '../ui/Modal'

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
  const [showMembers, setShowMembers] = useState(false)
  const [showCode, setShowCode] = useState(false)

  return (
    <div className="h-16 sm:h-20 bg-dark-900/90 backdrop-blur-xl border-b border-dark-700/50 px-3 sm:px-6 flex items-center">
      <div className="flex items-center justify-between w-full">
        {/* Left Section */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            icon={ArrowLeft}
            onClick={onBack}
            className="p-1 sm:p-2"
          >
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="h-6 w-px bg-dark-600 hidden sm:block" />
          <div className="truncate">
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              <h1 className="text-base sm:text-lg font-semibold text-white truncate max-w-[120px] sm:max-w-none">{room.name}</h1>
              <div className={`w-2 h-2 rounded-full ${room.isActive ? 'bg-green-400' : 'bg-dark-500'}`} />
            </div>
            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-dark-300 mt-0.5 sm:mt-0">
              {/* Users icon triggers member modal on mobile */}
              <button
                className="flex items-center justify-center focus:outline-none sm:hidden"
                onClick={() => setShowMembers(true)}
                aria-label="Show Members"
                type="button"
              >
                <Users className="w-4 h-4" />
                <span className="ml-1">{room.members.length}</span>
              </button>
              <span className="hidden sm:inline"><Users className="w-3 h-3 sm:w-4 sm:h-4" /> {room.members.length} members</span>
              <span>•</span>
              {/* Room code triggers code modal on mobile */}
              <button
                className="truncate max-w-[60px] sm:max-w-none text-left focus:outline-none sm:cursor-default"
                onClick={() => setShowCode(true)}
                type="button"
              >
                Code: {room.code}
              </button>
            </div>
          </div>
        </div>
        {/* Center Section - Audio/Video Controls (hide on mobile) */}
        <div className="hidden sm:flex items-center space-x-2">
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
        {/* Right Section (hide on mobile) */}
        <div className="hidden sm:flex items-center space-x-2">
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
      {/* Mobile: MemberList Modal */}
      <Modal isOpen={showMembers} onClose={() => setShowMembers(false)} title="Participants" size="sm">
        <div className="max-h-[60vh] overflow-y-auto">
          <MemberList members={room.members} currentUserId={room.adminId} adminId={room.adminId} />
        </div>
      </Modal>
      {/* Mobile: Room Code Modal */}
      <Modal isOpen={showCode} onClose={() => setShowCode(false)} title="Room Code" size="sm">
        <div className="flex flex-col items-center gap-3 p-2">
          <div className="text-lg font-mono font-bold text-primary-400 break-all">{room.code}</div>
          <Button size="sm" onClick={() => {navigator.clipboard.writeText(room.code)}}>Copy Code</Button>
        </div>
      </Modal>
    </div>
  )
}