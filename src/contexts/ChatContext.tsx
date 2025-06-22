import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react'
import { 
  ChatMessage, 
  TypingIndicator, 
  UserPresence, 
  ChatMember,
  MessageReaction,
  ChatError,
  ChatConnection,
  ChatFilter,
  ChatSearchResult
} from '../types/chat'
import { 
  createWebSocketService, 
  getWebSocketService, 
  disconnectWebSocket,
  WebSocketCallbacks 
} from '../lib/websocket'
import { User } from '../types'
import { supabase } from '../lib/supabase'

interface ChatState {
  messages: ChatMessage[]
  typingUsers: TypingIndicator[]
  members: ChatMember[]
  connectionStatus: ChatConnection['status']
  errors: ChatError[]
  searchResults: ChatSearchResult[]
  filters: ChatFilter
  unreadCount: number
  lastReadMessageId: string | null
  isSearching: boolean
  isLoading: boolean
  onlineMembers: string[]
}

type ChatAction =
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<ChatMessage> } }
  | { type: 'DELETE_MESSAGE'; payload: string }
  | { type: 'SET_TYPING_USERS'; payload: TypingIndicator[] }
  | { type: 'ADD_TYPING_USER'; payload: TypingIndicator }
  | { type: 'REMOVE_TYPING_USER'; payload: string }
  | { type: 'SET_MEMBERS'; payload: ChatMember[] }
  | { type: 'UPDATE_MEMBER'; payload: { id: string; updates: Partial<ChatMember> } }
  | { type: 'REMOVE_MEMBER'; payload: string }
  | { type: 'SET_CONNECTION_STATUS'; payload: ChatConnection['status'] }
  | { type: 'ADD_ERROR'; payload: ChatError }
  | { type: 'CLEAR_ERROR'; payload: string }
  | { type: 'SET_SEARCH_RESULTS'; payload: ChatSearchResult[] }
  | { type: 'SET_FILTERS'; payload: ChatFilter }
  | { type: 'SET_UNREAD_COUNT'; payload: number }
  | { type: 'SET_LAST_READ_MESSAGE'; payload: string }
  | { type: 'SET_SEARCHING'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_REACTION'; payload: { messageId: string; reaction: MessageReaction } }
  | { type: 'REMOVE_REACTION'; payload: { messageId: string; userId: string; emoji: string } }
  | { type: 'SET_ONLINE_MEMBERS'; payload: string[] }
  | { type: 'ADD_ONLINE_MEMBER'; payload: string }
  | { type: 'REMOVE_ONLINE_MEMBER'; payload: string }

const initialState: ChatState = {
  messages: [],
  typingUsers: [],
  members: [],
  connectionStatus: 'disconnected',
  errors: [],
  searchResults: [],
  filters: {
    search: '',
    dateRange: { start: '', end: '' },
    messageType: [],
    userId: undefined,
    hasReactions: false,
    hasAttachments: false,
    isEdited: false
  },
  unreadCount: 0,
  lastReadMessageId: null,
  isSearching: false,
  isLoading: false,
  onlineMembers: []
}

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_MESSAGES':
      // Remove duplicates based on message ID
      const uniqueMessages = action.payload.filter((message, index, self) => 
        index === self.findIndex(m => m.id === message.id)
      )
      return { ...state, messages: uniqueMessages }
    
    case 'ADD_MESSAGE':
      // Check if message already exists to prevent duplicates
      const messageExists = state.messages.some(msg => msg.id === action.payload.id)
      if (messageExists) {
        console.warn('Duplicate message detected, skipping:', action.payload.id)
        return state
      }
      return { 
        ...state, 
        messages: [...state.messages, action.payload],
        unreadCount: state.unreadCount + 1
      }
    
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.id ? { ...msg, ...action.payload.updates } : msg
        )
      }
    
    case 'DELETE_MESSAGE':
      return {
        ...state,
        messages: state.messages.filter(msg => msg.id !== action.payload)
      }
    
    case 'SET_TYPING_USERS':
      return { ...state, typingUsers: action.payload }
    
    case 'ADD_TYPING_USER':
      return {
        ...state,
        typingUsers: [
          ...state.typingUsers.filter(user => user.userId !== action.payload.userId),
          action.payload
        ]
      }
    
    case 'REMOVE_TYPING_USER':
      return {
        ...state,
        typingUsers: state.typingUsers.filter(user => user.userId !== action.payload)
      }
    
    case 'SET_MEMBERS':
      return { ...state, members: action.payload }
    
    case 'UPDATE_MEMBER':
      return {
        ...state,
        members: state.members.map(member =>
          member.id === action.payload.id ? { ...member, ...action.payload.updates } : member
        )
      }
    
    case 'REMOVE_MEMBER':
      return {
        ...state,
        members: state.members.filter(member => member.id !== action.payload)
      }
    
    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload }
    
    case 'ADD_ERROR':
      return {
        ...state,
        errors: [...state.errors, action.payload]
      }
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        errors: state.errors.filter(error => error.code !== action.payload)
      }
    
    case 'SET_SEARCH_RESULTS':
      return { ...state, searchResults: action.payload }
    
    case 'SET_FILTERS':
      return { ...state, filters: action.payload }
    
    case 'SET_UNREAD_COUNT':
      return { ...state, unreadCount: action.payload }
    
    case 'SET_LAST_READ_MESSAGE':
      return { ...state, lastReadMessageId: action.payload }
    
    case 'SET_SEARCHING':
      return { ...state, isSearching: action.payload }
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'ADD_REACTION':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.messageId
            ? { ...msg, reactions: [...msg.reactions, action.payload.reaction] }
            : msg
        )
      }
    
    case 'REMOVE_REACTION':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.messageId
            ? {
                ...msg,
                reactions: msg.reactions.filter(
                  reaction =>
                    !(reaction.userId === action.payload.userId && reaction.emoji === action.payload.emoji)
                )
              }
            : msg
        )
      }
    
    case 'SET_ONLINE_MEMBERS':
      return {
        ...state,
        onlineMembers: action.payload
      }
    
    case 'ADD_ONLINE_MEMBER':
      return {
        ...state,
        onlineMembers: state.onlineMembers.includes(action.payload) 
          ? state.onlineMembers 
          : [...state.onlineMembers, action.payload]
      }
    
    case 'REMOVE_ONLINE_MEMBER':
      return {
        ...state,
        onlineMembers: state.onlineMembers.filter(id => id !== action.payload)
      }
    
    default:
      return state
  }
}

interface ChatContextType {
  state: ChatState
  sendMessage: (message: string) => Promise<void>
  sendTyping: (isTyping: boolean) => void
  sendReaction: (messageId: string, emoji: string) => void
  removeReaction: (messageId: string, emoji: string) => void
  updatePresence: (status: UserPresence['status'], customStatus?: string) => void
  markAsRead: (messageId: string) => void
  searchMessages: (query: string) => Promise<ChatSearchResult[]>
  applyFilters: (filters: ChatFilter) => void
  clearErrors: () => void
  connect: (roomId: string, userId: string) => Promise<void>
  disconnect: () => void
  sendActivityMessage: (activityType: string, details: any) => Promise<void>
  isUserOnline: (userId: string) => boolean
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}

interface ChatProviderProps {
  children: React.ReactNode
  currentUser: User
  roomId: string
  wsUrl: string
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ 
  children, 
  currentUser, 
  roomId, 
  wsUrl 
}) => {
  const [state, dispatch] = useReducer(chatReducer, initialState)
  const wsServiceRef = useRef<any>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const presenceSubscriptionRef = useRef<any>(null)

  // Load online members for the room
  const loadOnlineMembers = useCallback(async () => {
    if (!roomId) return
    
    try {
      console.log('👥 Loading online members for room:', roomId)
      
      const { data: presenceData, error } = await supabase
        .from('chat_presence')
        .select('user_id')
        .eq('room_id', roomId)
        .eq('status', 'online')
        .gt('updated_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Only consider users active in last 5 minutes

      if (error) {
        console.error('Error loading online members:', error)
        return
      }

      const onlineUserIds = presenceData?.map(p => p.user_id) || []
      dispatch({ type: 'SET_ONLINE_MEMBERS', payload: onlineUserIds })
      console.log('👥 Online members loaded:', onlineUserIds.length)
      
    } catch (error) {
      console.error('Failed to load online members:', error)
    }
  }, [roomId])

  // Subscribe to presence changes
  const subscribeToPresence = useCallback(() => {
    if (!roomId) return

    console.log('🔗 Subscribing to presence changes for room:', roomId)
    
    presenceSubscriptionRef.current = supabase
      .channel(`presence_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_presence',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('👥 Presence change received:', payload)
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const userId = payload.new?.user_id
            const status = payload.new?.status
            
            if (userId && status === 'online') {
              dispatch({ type: 'ADD_ONLINE_MEMBER', payload: userId })
            } else if (userId && status === 'offline') {
              dispatch({ type: 'REMOVE_ONLINE_MEMBER', payload: userId })
            }
          } else if (payload.eventType === 'DELETE') {
            const userId = payload.old?.user_id
            if (userId) {
              dispatch({ type: 'REMOVE_ONLINE_MEMBER', payload: userId })
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Presence subscription status:', status)
      })

  }, [roomId])

  const connectToWebSocket = useCallback(async () => {
    if (!roomId || !currentUser.id) return

    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      console.log('🔗 Connecting to chat room:', roomId)
      
      // Load existing messages for this room
      await loadExistingMessages()
      
      // Load online members
      await loadOnlineMembers()
      
      // Subscribe to presence changes
      subscribeToPresence()
      
      // Join the room (update presence)
      await joinRoom()
      
      const wsService = createWebSocketService(
        currentUser.id,
        roomId,
        'dummy-token', // We're using Supabase real-time, so token isn't needed
        {
          onMessage: (wsMessage) => {
            console.log('📨 WebSocket message received:', wsMessage)
            
            // Convert WebSocket message to ChatMessage format
            const chatMessage: ChatMessage = {
              id: wsMessage.id,
              roomId: wsMessage.roomId,
              userId: wsMessage.userId || 'unknown',
              userName: wsMessage.userId === currentUser.id ? currentUser.name : 'Unknown User',
              message: wsMessage.content || '',
              timestamp: wsMessage.timestamp,
              type: 'message',
              status: wsMessage.status || 'sent',
              reactions: [],
              mentions: [],
              attachments: wsMessage.attachments || [],
              isEdited: false,
              encrypted: false
            }
            
            console.log('📨 Processing received message:', chatMessage)
            
            // Only add message if it's not from current user (optimistic messages are already added)
            if (wsMessage.userId !== currentUser.id) {
              console.log('📨 Adding message from other user to state')
              dispatch({ type: 'ADD_MESSAGE', payload: chatMessage })
            } else {
              // Update existing message status if it's our own message
              console.log('📨 Updating own message status')
              dispatch({ 
                type: 'UPDATE_MESSAGE', 
                payload: { 
                  id: wsMessage.id, 
                  updates: { status: wsMessage.status || 'sent' } 
                } 
              })
            }
          },
          onTypingStart: (userId) => {
            console.log('⌨️ Typing started by:', userId)
            const typingIndicator: TypingIndicator = {
              userId,
              userName: 'Unknown User',
              timestamp: new Date().toISOString(),
              isTyping: true
            }
            dispatch({ type: 'ADD_TYPING_USER', payload: typingIndicator })
          },
          onTypingStop: (userId) => {
            console.log('⌨️ Typing stopped by:', userId)
            dispatch({ type: 'REMOVE_TYPING_USER', payload: userId })
          },
          onReaction: (messageId, userId, reaction) => {
            console.log('😀 Reaction received:', { messageId, userId, reaction })
            const messageReaction: MessageReaction = {
              emoji: reaction,
              userId,
              userName: 'Unknown User',
              timestamp: new Date().toISOString()
            }
            dispatch({ type: 'ADD_REACTION', payload: { messageId, reaction: messageReaction } })
          },
          onFileUpload: (wsMessage) => {
            // Handle file upload message
            const chatMessage: ChatMessage = {
              id: wsMessage.id,
              roomId: wsMessage.roomId,
              userId: wsMessage.userId || '',
              userName: currentUser.name,
              message: `Uploaded: ${wsMessage.fileName}`,
              timestamp: wsMessage.timestamp,
              type: 'file',
              status: wsMessage.status || 'sent',
              reactions: [],
              mentions: [],
              attachments: [{
                id: wsMessage.id,
                name: wsMessage.fileName || '',
                url: wsMessage.fileUrl || '',
                type: 'file',
                size: wsMessage.fileSize || 0,
                mimeType: wsMessage.fileType || '',
                thumbnail: undefined
              }],
              isEdited: false,
              encrypted: false
            }
            dispatch({ type: 'ADD_MESSAGE', payload: chatMessage })
          },
          onSystemMessage: (wsMessage) => {
            // Handle system messages
            const chatMessage: ChatMessage = {
              id: wsMessage.id,
              roomId: wsMessage.roomId,
              userId: 'system',
              userName: 'System',
              message: wsMessage.content || '',
              timestamp: wsMessage.timestamp,
              type: 'system',
              status: 'sent',
              reactions: [],
              mentions: [],
              attachments: [],
              isEdited: false,
              encrypted: false
            }
            dispatch({ type: 'ADD_MESSAGE', payload: chatMessage })
          },
          onError: (errorMessage) => {
            console.error('❌ WebSocket error:', errorMessage)
            const error: ChatError = {
              code: 'WEBSOCKET_ERROR',
              message: errorMessage,
              timestamp: new Date().toISOString()
            }
            dispatch({ type: 'ADD_ERROR', payload: error })
          },
          onConnect: () => {
            console.log('✅ WebSocket connected successfully')
            dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' })
            dispatch({ type: 'SET_LOADING', payload: false })
          },
          onDisconnect: () => {
            console.log('❌ WebSocket disconnected')
            dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' })
          },
          onReconnect: (attempt) => {
            console.log(`🔄 WebSocket reconnection attempt ${attempt}`)
            dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'reconnecting' })
          }
        }
      )
      
      wsServiceRef.current = wsService
      await wsService.connect()
      
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error)
      dispatch({ type: 'SET_LOADING', payload: false })
      dispatch({ 
        type: 'ADD_ERROR', 
        payload: {
          code: 'CONNECTION_FAILED',
          message: 'Failed to connect to chat server',
          timestamp: new Date().toISOString()
        }
      })
    }
  }, [roomId, currentUser, loadOnlineMembers, subscribeToPresence])

  const disconnect = useCallback(() => {
    if (wsServiceRef.current) {
      wsServiceRef.current.disconnect()
      wsServiceRef.current = null
    }
    
    // Unsubscribe from presence
    if (presenceSubscriptionRef.current) {
      presenceSubscriptionRef.current.unsubscribe()
      presenceSubscriptionRef.current = null
    }
    
    disconnectWebSocket()
    // Clear messages when disconnecting
    dispatch({ type: 'SET_MESSAGES', payload: [] })
    // Clear online members
    dispatch({ type: 'SET_ONLINE_MEMBERS', payload: [] })
    // Leave the room
    leaveRoom()
  }, [])

  const joinRoom = useCallback(async () => {
    if (!roomId || !currentUser.id) return
    
    try {
      console.log('🚪 Joining room:', roomId)
      
      // Update presence to show user is online in this room
      const { error } = await supabase
        .from('chat_presence')
        .upsert({
          room_id: roomId,
          user_id: currentUser.id,
          status: 'online',
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'room_id,user_id'
        })

      if (error) {
        console.error('Error updating presence:', error)
      } else {
        // Add current user to online members
        dispatch({ type: 'ADD_ONLINE_MEMBER', payload: currentUser.id })
      }

      // Send join activity message
      if (wsServiceRef.current) {
        await wsServiceRef.current.sendMessage(
          `👋 ${currentUser.name} joined the room`,
          undefined,
          []
        )
      }
      
    } catch (error) {
      console.error('Error joining room:', error)
    }
  }, [roomId, currentUser.id, currentUser.name])

  const leaveRoom = useCallback(async () => {
    if (!roomId || !currentUser.id) return
    
    try {
      console.log('🚪 Leaving room:', roomId)
      
      // Send leave activity message before disconnecting
      if (wsServiceRef.current) {
        await wsServiceRef.current.sendMessage(
          `👋 ${currentUser.name} left the room`,
          undefined,
          []
        )
      }
      
      // Update presence to show user is offline
      const { error } = await supabase
        .from('chat_presence')
        .upsert({
          room_id: roomId,
          user_id: currentUser.id,
          status: 'offline',
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'room_id,user_id'
        })

      if (error) {
        console.error('Error updating presence:', error)
      } else {
        // Remove current user from online members
        dispatch({ type: 'REMOVE_ONLINE_MEMBER', payload: currentUser.id })
      }
      
    } catch (error) {
      console.error('Error leaving room:', error)
    }
  }, [roomId, currentUser.id, currentUser.name])

  const loadExistingMessages = useCallback(async () => {
    if (!roomId) return
    
    try {
      console.log('📥 Loading existing messages for room:', roomId)
      
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          room_id,
          user_id,
          content,
          message_type,
          reply_to,
          metadata,
          created_at,
          updated_at,
          is_edited,
          is_pinned
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100) // Limit to last 100 messages for performance

      if (error) {
        console.error('Error loading messages:', error)
        return
      }

      console.log('📥 Loaded messages:', messages.length)

      // Get unique user IDs to fetch user information
      const userIds = [...new Set(messages.map(msg => msg.user_id))]
      console.log('👥 Unique user IDs:', userIds)
      
      // Fetch user information (you might need to adjust this based on your user table structure)
      let userMap: Record<string, string> = {}
      try {
        // Use the profiles table instead of users table
        const { data: users, error: userError } = await supabase
          .from('profiles') // Changed from 'users' to 'profiles'
          .select('id, full_name, email') // Changed from 'name' to 'full_name'
          .in('id', userIds)

        if (!userError && users) {
          console.log('👥 Found users:', users.length)
          userMap = users.reduce((acc, user) => {
            acc[user.id] = user.full_name || user.email || 'Unknown User' // Changed from 'name' to 'full_name'
            return acc
          }, {} as Record<string, string>)
          console.log('👥 User map:', userMap)
        } else if (userError) {
          console.error('❌ User lookup error:', userError)
        }
      } catch (userError) {
        console.warn('Could not load user information:', userError)
      }

      // Convert database messages to ChatMessage format
      const chatMessages: ChatMessage[] = messages.map(msg => ({
        id: msg.id,
        roomId: msg.room_id,
        userId: msg.user_id,
        userName: userMap[msg.user_id] || (msg.user_id === currentUser.id ? currentUser.name : 'Unknown User'),
        message: msg.content,
        timestamp: msg.created_at,
        type: msg.message_type as any || 'message',
        status: 'sent',
        reactions: [], // TODO: Load reactions separately
        mentions: [],
        attachments: msg.metadata?.attachments || [],
        isEdited: msg.is_edited || false,
        encrypted: false
      }))

      console.log('📨 Converted chat messages:', chatMessages.length)
      console.log('📨 Sample message:', chatMessages[0])

      dispatch({ type: 'SET_MESSAGES', payload: chatMessages })
      console.log('✅ Messages dispatched to state')
      
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }, [roomId, currentUser.id, currentUser.name])

  const sendMessage = useCallback(async (message: string) => {
    if (!wsServiceRef.current || !message.trim()) return

    try {
      // Create optimistic message immediately for instant UI feedback
      const optimisticMessage: ChatMessage = {
        id: `temp-${Date.now()}-${Math.random()}`, // Temporary ID
        roomId,
        userId: currentUser.id,
        userName: currentUser.name,
        message: message.trim(),
        timestamp: new Date().toISOString(),
        type: 'message',
        status: 'sending',
        reactions: [],
        mentions: [],
        attachments: [],
        isEdited: false,
        encrypted: false
      }

      // Add optimistic message to state immediately
      dispatch({ type: 'ADD_MESSAGE', payload: optimisticMessage })

      const messageId = await wsServiceRef.current.sendMessage(
        message.trim(),
        undefined,
        []
      )
      
      // Update the optimistic message with the real ID and status
      dispatch({ 
        type: 'UPDATE_MESSAGE', 
        payload: { 
          id: optimisticMessage.id, 
          updates: { 
            id: messageId, 
            status: 'sent' 
          } 
        } 
      })
      
      console.log('✅ Message sent:', messageId)
      
      // Fallback: If real-time subscription fails, manually add the message after a delay
      setTimeout(() => {
        const messageExists = state.messages.some(msg => msg.id === messageId)
        if (!messageExists) {
          console.log('🔄 Fallback: Adding message manually')
          const fallbackMessage: ChatMessage = {
            id: messageId,
            roomId,
            userId: currentUser.id,
            userName: currentUser.name,
            message: message.trim(),
            timestamp: new Date().toISOString(),
            type: 'message',
            status: 'sent',
            reactions: [],
            mentions: [],
            attachments: [],
            isEdited: false,
            encrypted: false
          }
          dispatch({ type: 'ADD_MESSAGE', payload: fallbackMessage })
        }
      }, 2000) // Wait 2 seconds before fallback
      
    } catch (error) {
      console.error('Failed to send message:', error)
      
      // Remove the optimistic message if sending failed
      dispatch({ type: 'DELETE_MESSAGE', payload: `temp-${Date.now()}-${Math.random()}` })
      
      dispatch({ 
        type: 'ADD_ERROR', 
        payload: {
          code: 'SEND_FAILED',
          message: 'Failed to send message',
          timestamp: new Date().toISOString()
        }
      })
    }
  }, [roomId, currentUser.id, currentUser.name, state.messages])

  const sendTyping = useCallback(async (isTyping: boolean) => {
    if (!wsServiceRef.current) return

    try {
      if (isTyping) {
        await wsServiceRef.current.sendTypingStart()
      } else {
        await wsServiceRef.current.sendTypingStop()
      }
    } catch (error) {
      console.error('Failed to send typing indicator:', error)
    }
  }, [])

  const sendReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!wsServiceRef.current) return

    try {
      await wsServiceRef.current.sendReaction(messageId, emoji)
    } catch (error) {
      console.error('Failed to send reaction:', error)
    }
  }, [])

  const removeReaction = useCallback(async (messageId: string, emoji: string) => {
    // This would need to be implemented in the WebSocket service
    console.log('Remove reaction:', messageId, emoji)
  }, [])

  const updatePresence = useCallback((status: UserPresence['status'], customStatus?: string) => {
    if (!wsServiceRef.current) return
    wsServiceRef.current.sendPresence(status, customStatus)
  }, [])

  const markAsRead = useCallback((messageId: string) => {
    dispatch({ type: 'SET_LAST_READ_MESSAGE', payload: messageId })
    dispatch({ type: 'SET_UNREAD_COUNT', payload: 0 })
  }, [])

  const searchMessages = useCallback(async (query: string): Promise<ChatSearchResult[]> => {
    dispatch({ type: 'SET_SEARCHING', payload: true })
    
    try {
      // Filter messages based on search query
      const results = state.messages
        .filter(msg => 
          msg.message.toLowerCase().includes(query.toLowerCase()) ||
          msg.userName.toLowerCase().includes(query.toLowerCase())
        )
        .map(msg => ({
          message: msg,
          highlight: query,
          context: msg.message.substring(
            Math.max(0, msg.message.toLowerCase().indexOf(query.toLowerCase()) - 20),
            Math.min(msg.message.length, msg.message.toLowerCase().indexOf(query.toLowerCase()) + query.length + 20)
          )
        }))

      dispatch({ type: 'SET_SEARCH_RESULTS', payload: results })
      return results
    } finally {
      dispatch({ type: 'SET_SEARCHING', payload: false })
    }
  }, [state.messages])

  const applyFilters = useCallback((filters: ChatFilter) => {
    dispatch({ type: 'SET_FILTERS', payload: filters })
  }, [])

  const clearErrors = useCallback(() => {
    dispatch({ type: 'SET_LOADING', payload: false })
    // Clear all errors
    state.errors.forEach(error => {
      dispatch({ type: 'CLEAR_ERROR', payload: error.code })
    })
  }, [state.errors])

  const sendActivityMessage = useCallback(async (activityType: string, details: any) => {
    if (!wsServiceRef.current) return

    try {
      const activityMessage = `🎯 ${activityType}: ${details.message}`
      
      // Create optimistic activity message
      const optimisticMessage: ChatMessage = {
        id: `activity-${Date.now()}-${Math.random()}`,
        roomId,
        userId: 'system',
        userName: 'System',
        message: activityMessage,
        timestamp: new Date().toISOString(),
        type: 'system',
        status: 'sent',
        reactions: [],
        mentions: [],
        attachments: [],
        isEdited: false,
        encrypted: false
      }

      // Add optimistic message to state immediately
      dispatch({ type: 'ADD_MESSAGE', payload: optimisticMessage })

      const messageId = await wsServiceRef.current.sendMessage(
        activityMessage,
        undefined,
        []
      )
      
      // Update the optimistic message with the real ID
      dispatch({ 
        type: 'UPDATE_MESSAGE', 
        payload: { 
          id: optimisticMessage.id, 
          updates: { 
            id: messageId
          } 
        } 
      })
      
      console.log('✅ Activity message sent:', messageId)
    } catch (error) {
      console.error('Failed to send activity message:', error)
    }
  }, [roomId])

  // Check if a user is online
  const isUserOnline = useCallback((userId: string): boolean => {
    return state.onlineMembers.includes(userId)
  }, [state.onlineMembers])

  // Connect on mount
  useEffect(() => {
    if (roomId && currentUser.id) {
      connectToWebSocket()
    }

    return () => {
      disconnect()
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [roomId, currentUser.id, connectToWebSocket, disconnect])

  // Polling mechanism as backup for real-time subscriptions
  useEffect(() => {
    if (!roomId || !currentUser.id || state.connectionStatus !== 'connected') return

    const pollInterval = setInterval(async () => {
      try {
        // Check for new messages in the last 30 seconds
        const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString()
        
        const { data: newMessages, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('room_id', roomId)
          .gt('created_at', thirtySecondsAgo)
          .order('created_at', { ascending: true })

        if (error) {
          console.error('Error polling for messages:', error)
          return
        }

        if (newMessages && newMessages.length > 0) {
          // Check if any of these messages are not in our state
          const existingMessageIds = new Set(state.messages.map(msg => msg.id))
          const missingMessages = newMessages.filter(msg => !existingMessageIds.has(msg.id))

          if (missingMessages.length > 0) {
            console.log('📨 Polling found missing messages:', missingMessages.length)
            
            // Get user information for missing messages
            const userIds = [...new Set(missingMessages.map(msg => msg.user_id))]
            const { data: users } = await supabase
              .from('profiles')
              .select('id, full_name')
              .in('id', userIds)

            const userMap = users?.reduce((acc, user) => {
              acc[user.id] = user.full_name || 'Unknown User'
              return acc
            }, {} as Record<string, string>) || {}

            // Add missing messages to state
            missingMessages.forEach(msg => {
              const chatMessage: ChatMessage = {
                id: msg.id,
                roomId: msg.room_id,
                userId: msg.user_id,
                userName: userMap[msg.user_id] || (msg.user_id === currentUser.id ? currentUser.name : 'Unknown User'),
                message: msg.content,
                timestamp: msg.created_at,
                type: 'message',
                status: 'sent',
                reactions: [],
                mentions: [],
                attachments: msg.metadata?.attachments || [],
                isEdited: false,
                encrypted: false
              }
              dispatch({ type: 'ADD_MESSAGE', payload: chatMessage })
            })
          }
        }
      } catch (error) {
        console.error('Error in message polling:', error)
      }
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(pollInterval)
  }, [roomId, currentUser.id, currentUser.name, state.connectionStatus, state.messages])

  const value: ChatContextType = {
    state,
    sendMessage,
    sendTyping,
    sendReaction,
    removeReaction,
    updatePresence,
    markAsRead,
    searchMessages,
    applyFilters,
    clearErrors,
    connect: connectToWebSocket,
    disconnect,
    sendActivityMessage,
    isUserOnline
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
} 