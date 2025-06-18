import { useState } from 'react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { MessageReaction } from '../../types/chat'

interface MessageReactionsProps {
  reactions: MessageReaction[]
  onReaction: (emoji: string) => void
  currentUserId: string
}

export const MessageReactions = ({ reactions, onReaction, currentUserId }: MessageReactionsProps) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false)

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = []
    }
    acc[reaction.emoji].push(reaction)
    return acc
  }, {} as Record<string, MessageReaction[]>)

  const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '😡']

  return (
    <div className="flex items-center space-x-1 mt-2">
      {/* Display existing reactions */}
      {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
        const hasReacted = reactionList.some(r => r.userId === currentUserId)
        return (
          <Button
            key={emoji}
            variant={hasReacted ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onReaction(emoji)}
            className={`text-xs px-2 py-1 h-6 ${
              hasReacted 
                ? 'bg-primary-500 hover:bg-primary-600' 
                : 'bg-dark-700 hover:bg-dark-600'
            }`}
          >
            <span className="mr-1">{emoji}</span>
            <span>{reactionList.length}</span>
          </Button>
        )
      })}

      {/* Add reaction button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowReactionPicker(!showReactionPicker)}
        className="text-xs px-2 py-1 h-6 bg-dark-700 hover:bg-dark-600"
      >
        +
      </Button>

      {/* Quick reaction picker */}
      {showReactionPicker && (
        <div className="absolute bottom-full left-0 mb-2 z-50">
          <Card className="p-2 bg-dark-800 border border-dark-700 shadow-xl">
            <div className="flex space-x-1">
              {quickReactions.map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onReaction(emoji)
                    setShowReactionPicker(false)
                  }}
                  className="w-8 h-8 p-0 text-lg hover:bg-dark-700"
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
} 