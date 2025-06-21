import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { 
  Send, AlertCircle, CheckCircle, Clock, MessageSquare, Eye, RefreshCw
} from 'lucide-react'
import { useChat } from '../../contexts/ChatContext'
import { ChatMessage } from '../../types/chat'
import { User } from '../../types'

interface ChatAreaProps {
  currentUser: User
  roomId: string
}

export const ChatArea = ({ currentUser, roomId }: ChatAreaProps) => {
  const { state, sendMessage, sendTyping, markAsRead } = useChat()
  const [newMessage, setNewMessage] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [state.messages, autoScroll])

  // Mark messages as read when scrolled to bottom
  useEffect(() => {
    if (state.messages.length > 0) {
      const lastMessage = state.messages[state.messages.length - 1]
      if (lastMessage.userId !== currentUser.id) {
        markAsRead(lastMessage.id)
      }
    }
  }, [state.messages, currentUser.id, markAsRead])

  const handleInputChange = (value: string) => {
    setNewMessage(value)
    
    // Send typing indicator
    if (!state.typingUsers.some(user => user.userId === currentUser.id)) {
      sendTyping(true)
    }

    // Clear typing indicator after delay
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false)
    }, 3000)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    await sendMessage(newMessage.trim())
    setNewMessage('')
    sendTyping(false)
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  const getMessageStatusIcon = (status: ChatMessage['status']) => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-dark-400" />
      case 'sent':
        return <CheckCircle className="w-3 h-3 text-dark-400" />
      case 'delivered':
        return <Eye className="w-3 h-3 text-primary-400" />
      case 'read':
        return <Eye className="w-3 h-3 text-accent-400" />
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-400" />
      default:
        return null
    }
  }

  // Generate unique key for messages to prevent React warnings
  const getMessageKey = (message: ChatMessage, index: number) => {
    return `${message.id}-${message.timestamp}-${index}`
  }

  const MessageBubble = ({ message, showDate }: { message: ChatMessage; showDate: boolean }) => {
    const isCurrentUser = message.userId === currentUser.id
    const isSystem = message.type === 'system'

    if (isSystem) {
      return (
        <div className="flex justify-center my-4">
          <div className="bg-dark-800/50 px-4 py-2 rounded-full">
            <p className="text-sm text-dark-400">{message.message}</p>
          </div>
        </div>
      )
    }

    return (
      <div className={`group ${showDate ? 'mt-6' : 'mt-2'}`}>
        {showDate && (
          <div className="flex justify-center mb-4">
            <div className="bg-dark-800/50 px-3 py-1 rounded-full">
              <span className="text-xs text-dark-400">{formatDate(message.timestamp)}</span>
            </div>
          </div>
        )}
        
        <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[85%] ${isCurrentUser ? 'order-2' : 'order-1'}`}>
            {/* Username above message */}
            {!isCurrentUser && (
              <div className="mb-1">
                <span className="text-xs text-dark-400 font-medium">{message.userName}</span>
              </div>
            )}
            
            <div className={`rounded-2xl px-4 py-3 shadow-sm ${
              isCurrentUser 
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white' 
                : 'bg-dark-700/80 text-white border border-dark-600/50'
            }`}>
              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.message}</p>
            </div>
            
            <div className={`flex items-center mt-2 text-xs text-dark-400 ${
              isCurrentUser ? 'justify-end' : 'justify-start'
            }`}>
              <span className="font-medium">{formatTime(message.timestamp)}</span>
              {isCurrentUser && (
                <span className="ml-2">
                  {getMessageStatusIcon(message.status)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const shouldShowDate = (currentMessage: ChatMessage, previousMessage?: ChatMessage) => {
    if (!previousMessage) return true
    
    const currentDate = new Date(currentMessage.timestamp).toDateString()
    const previousDate = new Date(previousMessage.timestamp).toDateString()
    
    return currentDate !== previousDate
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-dark-700/50 bg-dark-900/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Chat</h3>
            <div className="flex items-center space-x-2 text-sm text-dark-300">
              <div className={`w-2 h-2 rounded-full ${
                state.connectionStatus === 'connected' ? 'bg-green-400' : 'bg-red-400'
              }`} />
              <span>{state.connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}</span>
              <span>•</span>
              <span>{state.messages.length} messages</span>
            </div>
          </div>
          
          {/* Debug refresh button */}
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={() => {
              console.log('🔄 Manual refresh clicked')
              console.log('📊 Current state:', {
                connectionStatus: state.connectionStatus,
                messageCount: state.messages.length,
                isLoading: state.isLoading,
                roomId,
                currentUserId: currentUser.id
              })
            }}
            className="text-dark-400 hover:text-white"
          />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {state.messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-10 h-10 text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">No messages yet</h3>
            <p className="text-dark-300 text-sm">Start the conversation with your study group!</p>
          </div>
        ) : (
          state.messages.map((message, index) => (
            <MessageBubble
              key={getMessageKey(message, index)}
              message={message}
              showDate={shouldShowDate(message, state.messages[index - 1])}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicators */}
      {state.typingUsers.length > 0 && (
        <div className="px-4 py-3 bg-dark-800/30 border-t border-dark-700/30">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <span className="text-sm text-dark-300 font-medium">
              {state.typingUsers.map(user => user.userName).join(', ')} typing...
            </span>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-dark-700/50 bg-dark-900/50">
        <div className="flex space-x-3">
          <textarea
            ref={textareaRef}
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-4 py-3 bg-dark-800/80 border border-dark-600/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 resize-none transition-all duration-200"
            rows={1}
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            icon={Send}
            size="sm"
            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  )
}