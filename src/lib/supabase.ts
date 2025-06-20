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
        email: email,
        total_points: 0,
        rank: 'Beginner',
        achievements: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (profileError) {
      console.error('Error creating profile:', profileError)
      return { data: null, error: profileError }
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

export const createProfile = async (userId: string, fullName: string, email: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      full_name: fullName,
      email: email,
      total_points: 0,
      rank: 'Beginner',
      achievements: []
    })
    .select()
    .single()
  
  return { data, error }
}

export const updateProfile = async (userId: string, updates: any, email?: string) => {
  // First check if profile exists
  const { data: existingProfile, error: checkError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()

  if (checkError || !existingProfile) {
    // Profile doesn't exist, create it
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        ...updates,
        email: email,
        total_points: 0,
        rank: 'Beginner',
        achievements: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    return { data: newProfile, error: createError }
  }

  // Profile exists, update it
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      ...(email ? { email } : {}),
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

export const getRoomTotalStudyTime = async (roomId: string) => {
  const { data, error } = await supabase.rpc('get_room_total_study_time', {
    room_uuid: roomId
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

export const endStudySession = async (sessionId: string, focusTime: number, completedTasks: number) => {
  const { data, error } = await supabase
    .from('study_sessions')
    .update({
      end_time: new Date().toISOString(),
      focus_time: focusTime,
      completed_tasks: completedTasks,
      is_active: false
    })
    .eq('id', sessionId)
    .select()
    .single()
  
  return { data, error }
}

// Room functions
export const createRoom = async (roomData: any) => {
  // Generate unique room code using database function
  const { data: codeData, error: codeError } = await supabase.rpc('generate_room_code')
  
  if (codeError) {
    console.error('Error generating room code:', codeError)
    return { data: null, error: codeError }
  }
  
  const { data, error } = await supabase
    .from('rooms')
    .insert({
      ...roomData,
      code: codeData
    })
    .select()
    .single()
  
  if (data && !error) {
    // Add creator as first member
    const { error: memberError } = await supabase
      .from('room_members')
      .insert({
        room_id: data.id,
        user_id: roomData.admin_id,
        is_online: true
      })
    
    if (memberError) {
      console.error('Error adding room member:', memberError)
    }
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
  
  // Get room members and admin profiles separately to avoid recursion
  const roomIds = roomsData.map(room => room.id)
  
  // Get all room members
  const { data: membersData } = await supabase
    .from('room_members')
    .select(`
      room_id,
      user_id,
      is_online,
      last_seen,
      profiles!inner(
        id,
        full_name,
        avatar_url,
        total_points,
        rank,
        achievements,
        created_at
      )
    `)
    .in('room_id', roomIds)
  
  // Get admin profiles
  const adminIds = [...new Set(roomsData.map(room => room.admin_id))]
  const { data: adminProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, total_points, rank, achievements, created_at')
    .in('id', adminIds)
  
  // Create maps for quick lookup
  const adminProfilesMap = new Map(adminProfiles?.map(profile => [profile.id, profile]) || [])
  const membersByRoom = new Map()
  
  membersData?.forEach(member => {
    if (!membersByRoom.has(member.room_id)) {
      membersByRoom.set(member.room_id, [])
    }
    membersByRoom.get(member.room_id).push({
      ...member,
      user: member.profiles
    })
  })
  
  // Combine rooms with their data
  const roomsWithMembers = roomsData.map(room => ({
    ...room,
    admin: adminProfilesMap.get(room.admin_id) || null,
    members: membersByRoom.get(room.id) || []
  }))
  
  return { data: roomsWithMembers, error: null }
}

export const getRoomById = async (roomId: string) => {
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
    .eq('id', roomId)
    .single()
  
  if (error || !roomData) {
    return { data: null, error }
  }
  
  // Get admin profile
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, total_points, rank, achievements, created_at')
    .eq('id', roomData.admin_id)
    .single()
  
  // Get room members with profiles
  const { data: membersData } = await supabase
    .from('room_members')
    .select(`
      user_id,
      is_online,
      last_seen,
      profiles!inner(
        id,
        full_name,
        avatar_url,
        total_points,
        rank,
        achievements,
        created_at
      )
    `)
    .eq('room_id', roomData.id)
  
  const roomWithMembers = {
    ...roomData,
    admin: adminProfile || null,
    members: membersData?.map(member => ({
      ...member,
      user: member.profiles
    })) || []
  }
  
  return { data: roomWithMembers, error: null }
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
    .eq('code', code.toUpperCase())
    .single()
  
  if (error || !roomData) {
    return { data: null, error }
  }
  
  // Get admin profile
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, total_points, rank, achievements, created_at')
    .eq('id', roomData.admin_id)
    .single()
  
  // Get room members with profiles
  const { data: membersData } = await supabase
    .from('room_members')
    .select(`
      user_id,
      is_online,
      last_seen,
      profiles!inner(
        id,
        full_name,
        avatar_url,
        total_points,
        rank,
        achievements,
        created_at
      )
    `)
    .eq('room_id', roomData.id)
  
  const roomWithMembers = {
    ...roomData,
    admin: adminProfile || null,
    members: membersData?.map(member => ({
      ...member,
      user: member.profiles
    })) || []
  }
  
  return { data: roomWithMembers, error: null }
}

// Updated join room function using the new database function
export const joinRoom = async (roomId: string, userId: string) => {
  const { data, error } = await supabase
    .from('room_members')
    .insert({
      room_id: roomId,
      user_id: userId,
      is_online: true
    })
    .select()
    .single()
  
  return { data, error }
}

// New function to join room with code validation
export const joinRoomWithCode = async (code: string, userId: string) => {
  const { data, error } = await supabase.rpc('join_room_with_code', {
    room_code: code.toUpperCase(),
    user_uuid: userId
  })
  
  if (error) {
    return { data: null, error }
  }
  
  // The function returns an array, get the first result
  const result = data?.[0]
  
  if (!result?.success) {
    return { 
      data: null, 
      error: { message: result?.message || 'Failed to join room' }
    }
  }
  
  return { 
    data: { room_id: result.room_id }, 
    error: null 
  }
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

// Enhanced Real-time subscriptions with better error handling
export const subscribeToRooms = (callback: (payload: any) => void) => {
  const channel = supabase
    .channel('public:rooms')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'rooms' },
      (payload) => {
        console.log('Rooms table change:', payload)
        callback(payload)
      }
    )
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'room_members' },
      (payload) => {
        console.log('Room members table change:', payload)
        callback(payload)
      }
    )
    .subscribe((status) => {
      console.log('Rooms subscription status:', status)
    })

  return channel
}

// Enhanced room subscription with immediate updates
export const subscribeToRoom = (roomId: string, callbacks: {
  onTaskChange?: (payload: any) => void
  onChatMessage?: (payload: any) => void
  onMemberChange?: (payload: any) => void
  onStudySessionChange?: (payload: any) => void
}) => {
  console.log(`Setting up real-time subscription for room: ${roomId}`)
  
  const channel = supabase
    .channel(`room:${roomId}`)
    
  // Tasks subscription
  if (callbacks.onTaskChange) {
    channel.on('postgres_changes', 
      { event: '*', schema: 'public', table: 'tasks', filter: `room_id=eq.${roomId}` },
      (payload) => {
        console.log('Task change detected:', payload)
        callbacks.onTaskChange!(payload)
      }
    )
  }
  
  // Chat messages subscription
  if (callbacks.onChatMessage) {
    channel.on('postgres_changes',
      { event: '*', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
      (payload) => {
        console.log('Chat message change detected:', payload)
        callbacks.onChatMessage!(payload)
      }
    )
  }
  
  // Room members subscription
  if (callbacks.onMemberChange) {
    channel.on('postgres_changes',
      { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${roomId}` },
      (payload) => {
        console.log('Member change detected:', payload)
        callbacks.onMemberChange!(payload)
      }
    )
  }
  
  // Study sessions subscription
  if (callbacks.onStudySessionChange) {
    channel.on('postgres_changes',
      { event: '*', schema: 'public', table: 'study_sessions', filter: `room_id=eq.${roomId}` },
      (payload) => {
        console.log('Study session change detected:', payload)
        callbacks.onStudySessionChange!(payload)
      }
    )
  }
  
  channel.subscribe((status) => {
    console.log(`Room ${roomId} subscription status:`, status)
    if (status === 'SUBSCRIBED') {
      console.log(`✅ Successfully subscribed to room ${roomId} real-time updates`)
    } else if (status === 'CHANNEL_ERROR') {
      console.error(`❌ Failed to subscribe to room ${roomId} real-time updates`)
    }
  })

  return channel
}

export const subscribeToUserStats = (userId: string, callback: (payload: any) => void) => {
  const channel = supabase
    .channel(`user:${userId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'study_sessions', filter: `user_id=eq.${userId}` },
      (payload) => {
        console.log('User study sessions change:', payload)
        callback({ ...payload, table: 'study_sessions' })
      }
    )
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
      (payload) => {
        console.log('User profile change:', payload)
        callback({ ...payload, table: 'profiles' })
      }
    )
    .subscribe((status) => {
      console.log(`User ${userId} stats subscription status:`, status)
    })

  return channel
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

// Timer and focus tracking
export const startFocusSession = async (roomId: string, userId: string) => {
  const { data, error } = await supabase
    .from('study_sessions')
    .insert({
      room_id: roomId,
      user_id: userId,
      start_time: new Date().toISOString(),
      focus_time: 0,
      completed_tasks: 0,
      is_active: true
    })
    .select()
    .single()
  
  return { data, error }
}

export const updateFocusSession = async (sessionId: string, focusTime: number, completedTasks?: number) => {
  const updates: any = {
    focus_time: focusTime
  }
  
  if (completedTasks !== undefined) {
    updates.completed_tasks = completedTasks
  }
  
  const { data, error } = await supabase
    .from('study_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single()
  
  return { data, error }
}

// Validate room code in real-time
export const validateRoomCode = async (code: string) => {
  const { data, error } = await supabase.rpc('get_room_details_for_join', { 
    room_code: code.toUpperCase() 
  })
  
  // RPC returns an array of results, even if it's a single row, so we take the first element
  const roomData = data ? data[0] : null

  return { data: roomData, error }
}

// Task User Status functions
export const getTaskUserStatuses = async (taskId: string) => {
  const { data, error } = await supabase
    .from('task_user_status')
    .select('*')
    .eq('task_id', taskId)
  return { data, error }
}

export const upsertTaskUserStatus = async (taskId: string, userId: string, userName: string, status: string) => {
  const { data, error } = await supabase
    .from('task_user_status')
    .upsert([
      { task_id: taskId, user_id: userId, user_name: userName, status, updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ') }
    ], { onConflict: 'task_id,user_id' })
    .select()
    .single()
  return { data, error }
}

export const subscribeToTaskUserStatus = (taskId: string, callback: (payload: any) => void) => {
  const channel = supabase
    .channel(`task_user_status:${taskId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'task_user_status', filter: `task_id=eq.${taskId}` },
      (payload) => callback(payload)
    )
    .subscribe()
  return channel
}

// Task Activity Log functions
export const getTaskActivityLog = async (taskId: string) => {
  const { data, error } = await supabase
    .from('task_activity_log')
    .select('*')
    .eq('task_id', taskId)
    .order('timestamp', { ascending: false })
  return { data, error }
}

export const addTaskActivityLog = async (taskId: string, userId: string, userName: string, action: string) => {
  const { data, error } = await supabase
    .from('task_activity_log')
    .insert({
      task_id: taskId,
      user_id: userId,
      user_name: userName,
      action,
      timestamp: new Date().toISOString().slice(0, 19).replace('T', ' ')
    })
    .select()
    .single()
  return { data, error }
}

export const subscribeToTaskActivityLog = (taskId: string, callback: (payload: any) => void) => {
  const channel = supabase
    .channel(`task_activity_log:${taskId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'task_activity_log', filter: `task_id=eq.${taskId}` },
      (payload) => callback(payload)
    )
    .subscribe()
  return channel
}