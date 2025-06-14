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
    .maybeSingle()
  
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
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()
  
  return { data, error }
}

// Study session functions
export const getUserStudyStats = async (userId: string) => {
  const { data, error } = await supabase.rpc('get_user_study_stats', {
    user_uuid: userId
  })
  
  return { data, error }
}

export const getTotalFocusTimeForUser = async (userId: string) => {
  const { data, error } = await supabase.rpc('get_user_total_focus_time', {
    user_uuid: userId
  })
  
  return { data, error }
}

export const createStudySession = async (sessionData: any) => {
  const { data, error } = await supabase
    .from('study_sessions')
    .insert(sessionData)
    .select()
    .single()
  
  return { data, error }
}

export const updateStudySession = async (sessionId: string, updates: any) => {
  const { data, error } = await supabase
    .from('study_sessions')
    .update(updates)
    .eq('id', sessionId)
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
    .select()
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
    
    // Fetch admin profile separately
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, total_points, rank, achievements, created_at')
      .eq('id', roomData.admin_id)
      .single()
    
    return { data: { ...data, admin: adminProfile }, error }
  }
  
  return { data, error }
}

export const getRooms = async (filters?: any) => {
  let query = supabase
    .from('rooms')
    .select(`
      id,
      name,
      code,
      description,
      tags,
      admin_id,
      max_members,
      is_private,
      is_active,
      created_at,
      updated_at
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
  
  const { data: roomsData, error } = await query.order('created_at', { ascending: false })
  
  if (error || !roomsData) {
    return { data: [], error }
  }
  
  // Get unique admin IDs and fetch their profiles separately
  const adminIds = [...new Set(roomsData.map(room => room.admin_id))]
  const { data: adminProfilesData, error: adminProfilesError } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, total_points, rank, achievements, created_at')
    .in('id', adminIds)
  
  if (adminProfilesError) {
    console.error('Error loading admin profiles:', adminProfilesError)
  }
  
  // Create a map of admin profiles for quick lookup
  const adminProfilesMap = new Map(adminProfilesData?.map(profile => [profile.id, profile]) || [])
  
  // Get room members separately - simplified query to avoid recursion
  const roomIds = roomsData.map(room => room.id)
  const { data: membersData, error: membersError } = await supabase
    .from('room_members')
    .select('room_id, user_id, is_online, last_seen')
    .in('room_id', roomIds)
  
  if (membersError) {
    console.error('Error loading room members:', membersError)
    return { 
      data: roomsData.map(room => ({ 
        ...room, 
        admin: adminProfilesMap.get(room.admin_id) || null,
        members: [] 
      })), 
      error: null 
    }
  }
  
  // Get unique user IDs and fetch their profiles separately
  const userIds = [...new Set(membersData?.map(member => member.user_id) || [])]
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, total_points, rank, achievements, created_at')
    .in('id', userIds)
  
  if (profilesError) {
    console.error('Error loading profiles:', profilesError)
  }
  
  // Create a map of profiles for quick lookup
  const profilesMap = new Map(profilesData?.map(profile => [profile.id, profile]) || [])
  
  // Combine rooms with their admin profiles and members
  const roomsWithMembers = roomsData.map(room => ({
    ...room,
    admin: adminProfilesMap.get(room.admin_id) || null,
    members: membersData
      ?.filter(member => member.room_id === room.id)
      .map(member => ({
        ...member,
        user: profilesMap.get(member.user_id) || null
      })) || []
  }))
  
  return { data: roomsWithMembers, error: null }
}

export const getRoomByCode = async (code: string) => {
  const { data: roomData, error } = await supabase
    .from('rooms')
    .select(`
      id,
      name,
      code,
      description,
      tags,
      admin_id,
      max_members,
      is_private,
      is_active,
      created_at,
      updated_at
    `)
    .eq('code', code)
    .single()
  
  if (error || !roomData) {
    return { data: null, error }
  }
  
  // Fetch admin profile separately
  const { data: adminProfile, error: adminError } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, total_points, rank, achievements, created_at')
    .eq('id', roomData.admin_id)
    .single()
  
  if (adminError) {
    console.error('Error loading admin profile:', adminError)
  }
  
  // Get room members separately - simplified query
  const { data: membersData, error: membersError } = await supabase
    .from('room_members')
    .select('user_id, is_online, last_seen')
    .eq('room_id', roomData.id)
  
  if (membersError) {
    console.error('Error loading room members:', membersError)
    return { 
      data: { 
        ...roomData, 
        admin: adminProfile || null,
        members: [] 
      }, 
      error: null 
    }
  }
  
  // Get unique user IDs and fetch their profiles separately
  const userIds = [...new Set(membersData?.map(member => member.user_id) || [])]
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, total_points, rank, achievements, created_at')
    .in('id', userIds)
  
  if (profilesError) {
    console.error('Error loading profiles:', profilesError)
  }
  
  // Create a map of profiles for quick lookup
  const profilesMap = new Map(profilesData?.map(profile => [profile.id, profile]) || [])
  
  const roomWithMembers = {
    ...roomData,
    admin: adminProfile || null,
    members: membersData?.map(member => ({
      ...member,
      user: profilesMap.get(member.user_id) || null
    })) || []
  }
  
  return { data: roomWithMembers, error: null }
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