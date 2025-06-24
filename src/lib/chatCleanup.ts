import { supabase } from './supabase'

/**
 * Clean up chat messages for rooms that have been inactive for more than 1 hour
 */
export const cleanupInactiveChats = async () => {
  try {
    console.log('🧹 Starting chat cleanup for inactive rooms...')
    
    // Get rooms that have been inactive for more than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    // Find inactive rooms (no recent activity)
    const { data: inactiveRooms, error: roomsError } = await supabase
      .from('chat_presence')
      .select('room_id')
      .lt('updated_at', oneHourAgo)
      .eq('status', 'offline')

    if (roomsError) {
      console.error('Error finding inactive rooms:', roomsError)
      return
    }

    if (!inactiveRooms || inactiveRooms.length === 0) {
      console.log('✅ No inactive rooms found')
      return
    }

    const inactiveRoomIds = [...new Set(inactiveRooms.map(room => room.room_id))]
    console.log(`🗑️ Found ${inactiveRoomIds.length} inactive rooms to cleanup`)

    // Delete chat messages for inactive rooms
    const { error: messagesError } = await supabase
      .from('chat_messages')
      .delete()
      .in('room_id', inactiveRoomIds)

    if (messagesError) {
      console.error('Error deleting chat messages:', messagesError)
      return
    }

    // Delete typing indicators for inactive rooms
    const { error: typingError } = await supabase
      .from('chat_typing_indicators')
      .delete()
      .in('room_id', inactiveRoomIds)

    if (typingError) {
      console.error('Error deleting typing indicators:', typingError)
      return
    }

    // Delete reactions for messages in inactive rooms
    const { data: messageIds, error: messageIdsError } = await supabase
      .from('chat_messages')
      .select('id')
      .in('room_id', inactiveRoomIds)

    if (messageIdsError) {
      console.error('Error getting message IDs:', messageIdsError)
      return
    }

    if (messageIds && messageIds.length > 0) {
      const ids = messageIds.map(msg => msg.id)
      const { error: reactionsError } = await supabase
        .from('chat_reactions')
        .delete()
        .in('message_id', ids)

      if (reactionsError) {
        console.error('Error deleting reactions:', reactionsError)
        return
      }
    }

    // Delete presence records for inactive rooms
    const { error: presenceError } = await supabase
      .from('chat_presence')
      .delete()
      .in('room_id', inactiveRoomIds)

    if (presenceError) {
      console.error('Error deleting presence records:', presenceError)
      return
    }

    console.log(`✅ Successfully cleaned up ${inactiveRoomIds.length} inactive rooms`)
    
  } catch (error) {
    console.error('Error during chat cleanup:', error)
  }
}

/**
 * Schedule periodic cleanup (run every hour)
 */
let cleanupInterval: NodeJS.Timeout | null = null

export const scheduleChatCleanup = () => {
  // Clear existing interval to prevent duplicates
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
  }
  // Run cleanup every hour
  cleanupInterval = setInterval(cleanupInactiveChats, 60 * 60 * 1000)
  // Also run cleanup immediately
  cleanupInactiveChats()
  console.log('⏰ Chat cleanup scheduled to run every hour')
}

// Add cleanup function to clear interval
export const stopChatCleanup = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
    cleanupInterval = null
    console.log('🛑 Chat cleanup stopped')
  }
}

/**
 * Manual cleanup trigger
 */
export const triggerChatCleanup = () => {
  console.log('🔧 Manual chat cleanup triggered')
  cleanupInactiveChats()
} 