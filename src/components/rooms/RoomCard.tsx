import { Button } from '../ui/Button'
import { Users, Clock, Tag, Lock, Globe, Crown } from 'lucide-react'
import { Room } from '../../types'
import { getTimeAgo } from '../../utils/roomUtils'

interface RoomCardProps {
  room: Room
  onJoinRoom: (roomId: string) => void
  onViewRoom: (roomId: string) => void
  currentUserId?: string
}

export const RoomCard = ({ room, onJoinRoom, onViewRoom, currentUserId }: RoomCardProps) => {
  const isAdmin = currentUserId === room.adminId
  const isMember = room.members.some(member => member.id === currentUserId)
  const memberAvatars = room.members.slice(0, 4)
  const extraMembers = room.members.length - 4

  return (
    <div className="bg-card-gradient backdrop-blur-xl border border-dark-700/50 rounded-2xl p-6 hover:border-dark-600/50 hover:shadow-lg hover:shadow-primary-500/10 hover:-translate-y-1 transition-all duration-300 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-white group-hover:text-primary-300 transition-colors duration-200">
              {room.name}
            </h3>
            {isAdmin && (
              <Crown className="w-4 h-4 text-yellow-400" title="You are the admin" />
            )}
          </div>
          <p className="text-dark-300 text-sm line-clamp-2 mb-3">
            {room.description}
          </p>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          {room.isPrivate ? (
            <Lock className="w-4 h-4 text-dark-400" title="Private room" />
          ) : (
            <Globe className="w-4 h-4 text-dark-400" title="Public room" />
          )}
          <div className={`w-2 h-2 rounded-full ${room.isActive ? 'bg-green-400' : 'bg-dark-500'}`} />
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {room.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center px-2 py-1 bg-primary-500/20 text-primary-300 rounded text-xs"
          >
            <Tag className="w-3 h-3 mr-1" />
            {tag}
          </span>
        ))}
        {room.tags.length > 3 && (
          <span className="text-xs text-dark-400">
            +{room.tags.length - 3} more
          </span>
        )}
      </div>

      {/* Members */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {memberAvatars.map((member, index) => (
              <div
                key={member.id}
                className="w-8 h-8 rounded-full border-2 border-dark-800 overflow-hidden"
                style={{ zIndex: memberAvatars.length - index }}
              >
                {member.avatar ? (
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary-500 flex items-center justify-center text-white text-xs font-medium">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ))}
            {extraMembers > 0 && (
              <div className="w-8 h-8 rounded-full border-2 border-dark-800 bg-dark-700 flex items-center justify-center text-xs text-dark-300 font-medium">
                +{extraMembers}
              </div>
            )}
          </div>
          <div className="ml-3 text-sm text-dark-300">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {room.members.length}/{room.maxMembers}
            </div>
          </div>
        </div>

        <div className="text-xs text-dark-400 flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          {getTimeAgo(room.lastActivity)}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {isMember ? (
          <Button
            onClick={() => onViewRoom(room.id)}
            className="flex-1"
            size="sm"
          >
            Enter Room
          </Button>
        ) : (
          <>
            <Button
              onClick={() => onViewRoom(room.id)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              View Details
            </Button>
            <Button
              onClick={() => onJoinRoom(room.id)}
              size="sm"
              disabled={room.members.length >= room.maxMembers}
            >
              Join
            </Button>
          </>
        )}
      </div>
    </div>
  )
}