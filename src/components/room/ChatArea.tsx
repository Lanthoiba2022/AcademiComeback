import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Send, Smile, Paperclip, MoreVertical } from 'lucide-react'
import { ChatMessage, User } from '../../types'

interface ChatAreaProps {
  messages: ChatMessage[]
  newMessage: string
  setNewMessage: (message: string) => void
  onSendMessage: () => void
  isTyping: boolean
  setIsTyping: (typing: boolean) => void
  typingUsers: string[]
  currentUser: User
  chatEndRef: React.RefObject<HTMLDivElement>
}

export const ChatArea = ({
  messages,
  newMessage,
  setNewMessage,
  onSendMessage,
  isTyping,
  setIsTyping,
  typingUsers,
  currentUser,
  chatEndRef
}: ChatAreaProps) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const handleInputChange = (value: string) => {
    setNewMessage(value)
    if (!isTyping && value.length > 0) {
      setIsTyping(true)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSendMessage()
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const MessageBubble = ({ message }: { message: ChatMessage }) => {
    const isCurrentUser = message.userId === currentUser.id
    const isSystem = message.type === 'system'

    if (isSystem) {
      return (
        <div className="flex justify-center my-2">
          <div className="bg-dark-800/50 px-3 py-1 rounded-full">
            <p className="text-xs text-dark-400">{message.message}</p>
          </div>
        </div>
      )
    }

    return (
      <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`flex max-w-[80%] ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          {!isCurrentUser && (
            <div className="flex-shrink-0 mr-2">
              {message.userAvatar ? (
                <img
                  src={message.userAvatar}
                  alt={message.userName}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
                  <span className="text-xs text-white font-medium">
                    {message.userName.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Message Content */}
          <div className={`${isCurrentUser ? 'mr-2' : ''}`}>
            {!isCurrentUser && (
              <p className="text-xs text-dark-400 mb-1 ml-1">{message.userName}</p>
            )}
            <div
              className={`px-4 py-2 rounded-2xl ${
                isCurrentUser
                  ? 'bg-primary-500 text-white rounded-br-md'
                  : 'bg-dark-800 text-white rounded-bl-md'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.message}</p>
            </div>
            <p className={`text-xs text-dark-500 mt-1 ${isCurrentUser ? 'text-right mr-1' : 'ml-1'}`}>
              {formatTime(message.timestamp)}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-dark-700/50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Discussion</h3>
          <Button variant="ghost" size="sm" icon={MoreVertical} />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Typing Indicators */}
        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-2 text-dark-400 text-sm">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-dark-700/50">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                icon={Smile}
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              />
              <Button
                variant="ghost"
                size="sm"
                icon={Paperclip}
              />
            </div>
            <textarea
              value={newMessage}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={2}
              className="w-full px-3 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none"
            />
          </div>
          <Button
            onClick={onSendMessage}
            disabled={!newMessage.trim()}
            icon={Send}
            size="sm"
          />
        </div>
      </div>
    </div>
  )
}