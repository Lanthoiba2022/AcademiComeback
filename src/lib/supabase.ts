import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Auth functions
export const signUp = async (email: string, password: string, fullName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      }
    }
  })
  
  // Create profile after signup
  if (data.user && !error) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        full_name: fullName,
        total_points: 0,
        rank: 'Beginner',
        achievements: []
      })
    
    if (profileError) {
      console.error('Error creating profile:', profileError)
    }
  }
  
  return { data, error }
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser()
  return { data, error }
}

// Profile functions
export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  return { data, error }
}

export const createProfile = async (userId: string, fullName: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      full_name: fullName,
      total_points: 0,
      rank: 'Beginner',
      achievements: []
    })
    .select()
    .single()
  
  return { data, error }
}

export const updateProfile = async (userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  
  return { data, error }
}

// Room functions
export const createRoom = async (roomData: any) => {
  const { data, error } = await supabase
    .from('rooms')
    .insert({
      ...roomData,
      code: await generateRoomCode()
    })
    .select(`
      *,
      admin:profiles!admin_id(*)
    `)
    .single()
  
  if (data && !error) {
    // Add creator as first member
    await supabase
      .from('room_members')
      .insert({
        room_id: data.id,
        user_id: roomData.admin_id,
        is_online: true
      })
  }
  
  return { data, error }
}

export const getRooms = async (filters?: any) => {
  let query = supabase
    .from('rooms')
    .select(`
      *,
      admin:profiles!admin_id(*),
      members:room_members(
        user:profiles(*)
      )
    `)
    .eq('is_active', true)
  
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }
  
  if (filters?.tags?.length > 0) {
    query = query.overlaps('tags', filters.tags)
  }
  
  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive)
  }
  
  const { data, error } = await query.order('created_at', { ascending: false })
  
  return { data, error }
}

export const getRoomByCode = async (code: string) => {
  const { data, error } = await supabase
    .from('rooms')
    .select(`
      *,
      admin:profiles!admin_id(*),
      members:room_members(
        user:profiles(*),
        is_online,
        last_seen
      )
    `)
    .eq('code', code)
    .single()
  
  return { data, error }
}

export const joinRoom = async (roomId: string, userId: string) => {
  const { data, error } = await supabase
    .from('room_members')
    .insert({
      room_id: roomId,
      user_id: userId,
      is_online: true
    })
    .select()
  
  return { data, error }
}

export const leaveRoom = async (roomId: string, userId: string) => {
  const { error } = await supabase
    .from('room_members')
    .delete()
    .eq('room_id', roomId)
    .eq('user_id', userId)
  
  return { error }
}

// Task functions
export const getTasks = async (roomId: string) => {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      assignee:profiles!assignee_id(*),
      creator:profiles!created_by(*)
    `)
    .eq('room_id', roomId)
    .order('order_index', { ascending: true })
  
  return { data, error }
}

export const createTask = async (taskData: any) => {
  const { data, error } = await supabase
    .from('tasks')
    .insert(taskData)
    .select(`
      *,
      assignee:profiles!assignee_id(*),
      creator:profiles!created_by(*)
    `)
    .single()
  
  return { data, error }
}

export const updateTask = async (taskId: string, updates: any) => {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select(`
      *,
      assignee:profiles!assignee_id(*),
      creator:profiles!created_by(*)
    `)
    .single()
  
  return { data, error }
}

export const deleteTask = async (taskId: string) => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
  
  return { error }
}

// Chat functions
export const getChatMessages = async (roomId: string) => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select(`
      *,
      user:profiles(*)
    `)
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })
  
  return { data, error }
}

export const sendChatMessage = async (messageData: any) => {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert(messageData)
    .select(`
      *,
      user:profiles(*)
    `)
    .single()
  
  return { data, error }
}

// Real-time subscriptions
export const subscribeToRoom = (roomId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`room:${roomId}`)
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'tasks', filter: `room_id=eq.${roomId}` },
      callback
    )
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
      callback
    )
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${roomId}` },
      callback
    )
    .subscribe()
}

export const subscribeToRooms = (callback: (payload: any) => void) => {
  return supabase
    .channel('rooms')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'rooms' },
      callback
    )
    .subscribe()
}

// Utility functions
const generateRoomCode = async (): Promise<string> => {
  const { data, error } = await supabase.rpc('generate_room_code')
  if (error) {
    console.error('Error generating room code:', error)
    // Fallback to client-side generation
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }
  return data
}

export const updateUserPresence = async (roomId: string, userId: string, isOnline: boolean) => {
  const { error } = await supabase
    .from('room_members')
    .update({ 
      is_online: isOnline,
      last_seen: new Date().toISOString()
    })
    .eq('room_id', roomId)
    .eq('user_id', userId)
  
  return { error }
}