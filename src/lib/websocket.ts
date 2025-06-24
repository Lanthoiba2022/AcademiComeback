import { supabase } from './supabase'
import { 
  ChatMessage, 
  TypingIndicator, 
  UserPresence, 
  ChatMember, 
  MessageReaction, 
  ChatConnection, 
  ChatError 
} from '../types/chat'

export interface WebSocketMessage {
  type: string
  id: string
  roomId: string
  userId?: string
  content?: string
  timestamp: string
  replyTo?: string
  attachments?: any[]
  reaction?: string
  messageId?: string
  fileName?: string
  fileUrl?: string
  fileSize?: number
  fileType?: string
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error'
}

export interface WebSocketConfig {
  url: string
  reconnectInterval: number
  maxReconnectAttempts: number
  heartbeatInterval: number
}

export interface WebSocketCallbacks {
  onMessage?: (message: WebSocketMessage) => void
  onTypingStart?: (userId: string) => void
  onTypingStop?: (userId: string) => void
  onReaction?: (messageId: string, userId: string, reaction: string) => void
  onFileUpload?: (message: WebSocketMessage) => void
  onSystemMessage?: (message: WebSocketMessage) => void
  onError?: (error: string) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onReconnect?: (attempt: number) => void
}

// Custom Event Emitter for browser compatibility
class EventEmitter {
  private events: { [key: string]: Function[] } = {}

  on(event: string, listener: Function): void {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(listener)
  }

  off(event: string, listener: Function): void {
    if (!this.events[event]) return
    this.events[event] = this.events[event].filter(l => l !== listener)
  }

  emit(event: string, ...args: any[]): void {
    if (!this.events[event]) return
    this.events[event].forEach(listener => {
      try {
        listener(...args)
      } catch (error) {
        console.error('Error in event listener:', error)
      }
    })
  }

  removeAllListeners(event?: string): void {
    if (event) {
      delete this.events[event]
    } else {
      this.events = {}
    }
  }
}

export class WebSocketService extends EventEmitter {
  private config: WebSocketConfig
  private callbacks: WebSocketCallbacks
  private reconnectAttempts = 0
  private reconnectTimeout: NodeJS.Timeout | null = null
  private messageQueue: WebSocketMessage[] = []
  private isConnecting = false
  private isConnected = false
  private userId: string
  private roomId: string
  private subscriptions: any[] = []
  private typingTimeout: NodeJS.Timeout | null = null
  private isDestroyed = false

  constructor(
    userId: string,
    roomId: string,
    token: string,
    callbacks: WebSocketCallbacks = {},
    config?: Partial<WebSocketConfig>
  ) {
    super()
    
    this.userId = userId
    this.roomId = roomId
    this.callbacks = callbacks
    
    // Default configuration
    this.config = {
      url: import.meta.env.VITE_SUPABASE_URL || '',
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      ...config
    }
  }

  // Add destroy method for robust cleanup
  destroy(): void {
    this.isDestroyed = true
    this.disconnect()
    this.removeAllListeners()
  }

  /**
   * Connect to Supabase real-time
   */
  async connect(): Promise<void> {
    if (this.isDestroyed || this.isConnecting || this.isConnected) {
      return
    }

    this.isConnecting = true
    
    try {
      console.log('🔗 Connecting to Supabase real-time for room:', this.roomId)
      
      // Subscribe to chat messages for this specific room
      const messagesSubscription = supabase
        .channel(`chat_messages_${this.roomId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chat_messages',
            filter: `room_id=eq.${this.roomId}`
          },
          (payload) => {
            console.log('📨 Raw message change received:', payload)
            this.handleMessageChange(payload)
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chat_typing_indicators',
            filter: `room_id=eq.${this.roomId}`
          },
          (payload) => {
            console.log('⌨️ Typing change received:', payload)
            this.handleTypingChange(payload)
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chat_reactions',
            filter: `message_id=in.(select id from chat_messages where room_id='${this.roomId}')`
          },
          (payload) => {
            console.log('😀 Reaction change received:', payload)
            this.handleReactionChange(payload)
          }
        )
        .subscribe((status) => {
          console.log('📡 Supabase subscription status:', status)
          if (status === 'SUBSCRIBED') {
            this.isConnecting = false
            this.isConnected = true
            this.reconnectAttempts = 0
            this.flushMessageQueue()
            this.callbacks.onConnect?.()
            this.emit('connect')
            console.log('✅ Successfully connected to room:', this.roomId)
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Channel error for room:', this.roomId)
            this.handleConnectionError()
          } else if (status === 'TIMED_OUT') {
            console.error('⏰ Connection timed out for room:', this.roomId)
            this.handleConnectionError()
          }
        })

      this.subscriptions.push(messagesSubscription)
      
    } catch (error) {
      console.error('Error connecting to Supabase real-time:', error)
      this.isConnecting = false
      this.handleConnectionError()
      throw new Error('Failed to connect to real-time service')
    }
  }

  /**
   * Disconnect from Supabase real-time
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout)
      this.typingTimeout = null
    }
    
    // Unsubscribe from all channels
    this.subscriptions.forEach(subscription => {
      try {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error('Error unsubscribing:', error)
      }
    })
    
    this.subscriptions = []
    this.isConnected = false
    this.isConnecting = false
    this.messageQueue = []
    // Clean up event emitter listeners
    this.removeAllListeners()
  }

  /**
   * Send a message to the chat room
   */
  async sendMessage(content: string, replyTo?: string, attachments: any[] = []): Promise<string> {
    const messageId = this.generateMessageId()
    
    // Create optimistic message
    const message: WebSocketMessage = {
      type: 'chat',
      id: messageId,
      roomId: this.roomId,
      userId: this.userId,
      content,
      timestamp: new Date().toISOString(),
      replyTo,
      attachments,
      status: 'sending'
    }

    // Don't emit optimistic message here - let the ChatContext handle it
    // This prevents duplicate messages when the real-time subscription fires

    try {
      console.log('📤 Sending message to database:', { messageId, content, roomId: this.roomId })
      
      // Insert message into database
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          id: messageId,
          room_id: this.roomId,
          user_id: this.userId,
          content,
          message_type: 'text',
          reply_to: replyTo || null,
          metadata: attachments.length > 0 ? { attachments } : null
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Database insert error:', error)
        
        // If it's a UUID format error, try with a new UUID
        if (error.code === '22P02' && error.message.includes('uuid')) {
          console.log('🔄 Retrying with new UUID...')
          const newMessageId = this.generateMessageId()
          message.id = newMessageId
          
          const { data: retryData, error: retryError } = await supabase
            .from('chat_messages')
            .insert({
              id: newMessageId,
              room_id: this.roomId,
              user_id: this.userId,
              content,
              message_type: 'text',
              reply_to: replyTo || null,
              metadata: attachments.length > 0 ? { attachments } : null
            })
            .select()
            .single()

          if (retryError) {
            throw retryError
          }
          
          console.log('✅ Message saved to database (retry):', retryData)
          return newMessageId
        }
        
        throw error
      }

      console.log('✅ Message saved to database:', data)
      
      return messageId
      
    } catch (error) {
      console.error('Error sending message:', error)
      this.callbacks.onError?.('Failed to send message')
      throw error
    }
  }

  /**
   * Send typing start indicator
   */
  async sendTypingStart(): Promise<void> {
    try {
      await supabase
        .from('chat_typing_indicators')
        .upsert({
          room_id: this.roomId,
          user_id: this.userId,
          is_typing: true,
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'room_id,user_id'
        })
    } catch (error) {
      console.error('Error sending typing indicator:', error)
    }
  }

  /**
   * Send typing stop indicator
   */
  async sendTypingStop(): Promise<void> {
    try {
      await supabase
        .from('chat_typing_indicators')
        .upsert({
          room_id: this.roomId,
          user_id: this.userId,
          is_typing: false,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'room_id,user_id'
        })
    } catch (error) {
      console.error('Error stopping typing indicator:', error)
    }
  }

  /**
   * Send reaction to a message
   */
  async sendReaction(messageId: string, reaction: string): Promise<void> {
    try {
      await supabase
        .from('chat_reactions')
        .insert({
          message_id: messageId,
          user_id: this.userId,
          reaction
        })
    } catch (error) {
      console.error('Error sending reaction:', error)
      this.callbacks.onError?.('Failed to send reaction')
    }
  }

  /**
   * Send file upload message
   */
  async sendFileUpload(fileName: string, fileUrl: string, fileSize: number, fileType: string): Promise<string> {
    const messageId = this.generateMessageId()
    
    try {
      // Insert file message into database
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          id: messageId,
          room_id: this.roomId,
          user_id: this.userId,
          content: `Uploaded: ${fileName}`,
          message_type: 'file',
          metadata: {
            fileName,
            fileUrl,
            fileSize,
            fileType,
            attachments: [{
              id: messageId,
              name: fileName,
              url: fileUrl,
              type: 'file',
              size: fileSize,
              mimeType: fileType
            }]
          }
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      const message: WebSocketMessage = {
        type: 'file_upload',
        id: messageId,
        roomId: this.roomId,
        userId: this.userId,
        fileName,
        fileUrl,
        fileSize,
        fileType,
        timestamp: new Date().toISOString(),
        status: 'sent'
      }

      this.callbacks.onFileUpload?.(message)
      this.emit('fileUpload', message)
      
      return messageId
      
    } catch (error) {
      console.error('Error sending file message:', error)
      this.callbacks.onError?.('Failed to send file message')
      throw error
    }
  }

  /**
   * Handle message changes from Supabase
   */
  private handleMessageChange(payload: any): void {
    const { eventType, new: newRecord, old: oldRecord } = payload
    
    console.log('📨 Received message change:', { eventType, newRecord, oldRecord })
    
    if (eventType === 'INSERT' && newRecord) {
      // Convert database record to WebSocket message format
      const message: WebSocketMessage = {
        type: 'chat',
        id: newRecord.id,
        roomId: newRecord.room_id,
        userId: newRecord.user_id,
        content: newRecord.content,
        timestamp: newRecord.created_at,
        replyTo: newRecord.reply_to,
        attachments: newRecord.metadata?.attachments || [],
        status: 'sent'
      }
      
      console.log('📨 Processing new message:', message)
      
      // Always emit message to all listeners for real-time updates
      // This ensures all users receive the message immediately
      try {
        this.callbacks.onMessage?.(message)
        this.emit('message', message)
        console.log('✅ Message broadcasted to all users')
      } catch (error) {
        console.error('❌ Error broadcasting message:', error)
      }
    } else if (eventType === 'UPDATE' && newRecord) {
      // Handle message updates (edits, status changes, etc.)
      console.log('📝 Message updated:', newRecord)
    } else if (eventType === 'DELETE' && oldRecord) {
      // Handle message deletions
      console.log('🗑️ Message deleted:', oldRecord)
    }
  }

  /**
   * Handle typing indicator changes
   */
  private handleTypingChange(payload: any): void {
    const { eventType, new: newRecord, old: oldRecord } = payload
    
    if (eventType === 'INSERT' && newRecord && newRecord.user_id !== this.userId) {
      this.callbacks.onTypingStart?.(newRecord.user_id)
      this.emit('typingStart', newRecord.user_id)
    } else if (eventType === 'UPDATE' && newRecord && newRecord.user_id !== this.userId) {
      if (newRecord.is_typing) {
        this.callbacks.onTypingStart?.(newRecord.user_id)
        this.emit('typingStart', newRecord.user_id)
      } else {
        this.callbacks.onTypingStop?.(newRecord.user_id)
        this.emit('typingStop', newRecord.user_id)
      }
    } else if (eventType === 'DELETE' && oldRecord && oldRecord.user_id !== this.userId) {
      this.callbacks.onTypingStop?.(oldRecord.user_id)
      this.emit('typingStop', oldRecord.user_id)
    }
  }

  /**
   * Handle reaction changes
   */
  private handleReactionChange(payload: any): void {
    const { eventType, new: newRecord, old: oldRecord } = payload
    
    if (eventType === 'INSERT' && newRecord) {
      this.callbacks.onReaction?.(newRecord.message_id, newRecord.user_id, newRecord.reaction)
      this.emit('reaction', newRecord.message_id, newRecord.user_id, newRecord.reaction)
    }
  }

  /**
   * Handle connection errors
   */
  private handleConnectionError(): void {
    this.isConnecting = false
    this.callbacks.onError?.('Connection failed')
    this.emit('error', 'Connection failed')
    
    // Attempt to reconnect
    if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.scheduleReconnect()
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }
    
    this.reconnectAttempts++
    const delay = this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`🔄 Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`)
    
    this.reconnectTimeout = setTimeout(() => {
      this.callbacks.onReconnect?.(this.reconnectAttempts)
      this.emit('reconnect', this.reconnectAttempts)
      this.connect().catch(error => {
        console.error('Reconnection failed:', error)
      })
    }, delay)
  }

  /**
   * Flush queued messages
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (message) {
        this.callbacks.onMessage?.(message)
        this.emit('message', message)
      }
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    // Use crypto.randomUUID() if available, otherwise fallback to manual generation
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID()
    }
    
    // Fallback UUID v4 generation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): { isConnected: boolean; isConnecting: boolean } {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting
    }
  }

  /**
   * Get message queue length
   */
  getQueueLength(): number {
    return this.messageQueue.length
  }
}

// Export singleton instance for global use
let wsInstance: WebSocketService | null = null

export const createWebSocketService = (
  userId: string,
  roomId: string,
  token: string,
  callbacks: WebSocketCallbacks = {},
  config?: Partial<WebSocketConfig>
): WebSocketService => {
  // Properly cleanup previous instance
  if (wsInstance) {
    wsInstance.destroy()
    wsInstance = null
  }
  wsInstance = new WebSocketService(userId, roomId, token, callbacks, config)
  return wsInstance
}

export const getWebSocketService = (): WebSocketService | null => {
  return wsInstance
}

export const disconnectWebSocket = (): void => {
  if (wsInstance) {
    wsInstance.destroy()
    wsInstance = null
  }
} 