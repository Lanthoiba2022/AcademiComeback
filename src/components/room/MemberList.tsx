import { Crown, Dot, User } from 'lucide-react'
import { User as UserType } from '../../types'

interface MemberListProps {
  members: UserType[]
  currentUserId: string
  adminId: string
}

export const MemberList = ({ members, currentUserId, adminId }: MemberListProps) => {
  const onlineMembers = members.filter(() => Math.random() > 0.3) // Mock online status
  const offlineMembers = members.filter(member => !onlineMembers.includes(member))

  const MemberItem = ({ member, isOnline }: { member: UserType; isOnline: boolean }) => (
    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-dark-800/50 transition-colors duration-200">
      <div className="relative">
        {member.avatar ? (
          <img
            src={member.avatar}
            alt={member.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
        )}
        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-dark-800 ${
          isOnline ? 'bg-green-400' : 'bg-dark-500'
        }`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className={`text-sm font-medium truncate ${
            isOnline ? 'text-white' : 'text-dark-400'
          }`}>
            {member.name}
            {member.id === currentUserId && ' (You)'}
          </p>
          {member.id === adminId && (
            <Crown className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          )}
        </div>
        <p className={`text-xs truncate ${
          isOnline ? 'text-primary-400' : 'text-dark-500'
        }`}>
          {isOnline ? 'Online' : 'Offline'} • {member.rank}
        </p>
      </div>
    </div>
  )

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">Members</h3>
        <p className="text-sm text-dark-300">
          {onlineMembers.length} online • {members.length} total
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
        {/* Online Members */}
        {onlineMembers.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Dot className="w-4 h-4 text-green-400" />
              <span className="text-xs font-medium text-green-400 uppercase tracking-wide">
                Online ({onlineMembers.length})
              </span>
            </div>
            {onlineMembers.map(member => (
              <MemberItem key={member.id} member={member} isOnline={true} />
            ))}
          </div>
        )}

        {/* Offline Members */}
        {offlineMembers.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Dot className="w-4 h-4 text-dark-500" />
              <span className="text-xs font-medium text-dark-500 uppercase tracking-wide">
                Offline ({offlineMembers.length})
              </span>
            </div>
            {offlineMembers.map(member => (
              <MemberItem key={member.id} member={member} isOnline={false} />
            ))}
          </div>
        )}
      </div>

      {/* Study Stats */}
    </div>
  )
}