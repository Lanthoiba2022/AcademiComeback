import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Auth functions (keep existing ones)
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

// Profile functions (keep existing ones)
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
  const { data: existingProfile, error: checkError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()

  if (checkError || !existingProfile) {
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

// Study session functions (keep existing ones)
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

// Room functions (keep existing ones but add the missing ones)
export const createRoom = async (roomData: any) => {
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
  
  const roomIds = roomsData.map(room => room.id)
  
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
  
  const adminIds = [...new Set(roomsData.map(room => room.admin_id))]
  const { data: adminProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, total_points, rank, achievements, created_at')
    .in('id', adminIds)
  
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
  
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, total_points, rank, achievements, created_at')
    .eq('id', roomData.admin_id)
    .single()
  
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
  
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, total_points, rank, achievements, created_at')
    .eq('id', roomData.admin_id)
    .single()
  
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

export const joinRoomWithCode = async (code: string, userId: string) => {
  const { data, error } = await supabase.rpc('join_room_with_code', {
    room_code: code.toUpperCase(),
    user_uuid: userId
  })
  
  if (error) {
    return { data: null, error }
  }
  
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

// **IMPROVED Task functions with proper status mapping**
const uiStatusToDbStatus = (status: string) => {
  switch (status) {
    case 'Todo': return 'pending'
    case 'In Progress': return 'in-progress'
    case 'In Review': return 'in-review'
    case 'Completed': return 'completed'
    default: return 'pending'
  }
}

const dbStatusToUiStatus = (status: string) => {
  switch (status) {
    case 'pending': return 'Todo'
    case 'in-progress': return 'In Progress'
    case 'in-review': return 'In Review'
    case 'completed': return 'Completed'
    default: return 'Todo'
  }
}

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
  
  if (data) {
    // Transform database status to UI status
    const transformedData = data.map(task => ({
      ...task,
      status: dbStatusToUiStatus(task.status)
    }))
    return { data: transformedData, error }
  }
  
  return { data, error }
}

export const createTask = async (taskData: any) => {
  // Transform UI status to database status
  const dbTaskData = {
    ...taskData,
    status: uiStatusToDbStatus(taskData.status || 'Todo')
  }
  
  const { data, error } = await supabase
    .from('tasks')
    .insert(dbTaskData)
    .select(`
      *,
      assignee:profiles!assignee_id(*),
      creator:profiles!created_by(*)
    `)
    .single()
  
  if (data && !error) {
    // Transform back to UI status
    const transformedData = {
      ...data,
      status: dbStatusToUiStatus(data.status)
    }
    return { data: transformedData, error }
  }
  
  return { data, error }
}

export const updateTask = async (taskId: string, updates: any) => {
  // Transform UI status to database status if status is being updated
  const dbUpdates = { ...updates }
  if (updates.status) {
    dbUpdates.status = uiStatusToDbStatus(updates.status)
  }
  
  const { data, error } = await supabase
    .from('tasks')
    .update(dbUpdates)
    .eq('id', taskId)
    .select(`
      *,
      assignee:profiles!assignee_id(*),
      creator:profiles!created_by(*)
    `)
    .single()
  
  if (data && !error) {
    // Transform back to UI status
    const transformedData = {
      ...data,
      status: dbStatusToUiStatus(data.status)
    }
    return { data: transformedData, error }
  }
  
  return { data, error }
}

export const deleteTask = async (taskId: string) => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
  
  return { error }
}

// Chat functions (keep existing ones)
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

// **ENHANCED Real-time subscriptions**
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

export const subscribeToRoom = (roomId: string, callbacks: {
  onTaskChange?: (payload: any) => void
  onChatMessage?: (payload: any) => void
  onMemberChange?: (payload: any) => void
  onStudySessionChange?: (payload: any) => void
  onTaskUserStatusChange?: (payload: any) => void
  onTaskActivityChange?: (payload: any) => void
}) => {
  console.log(`🔗 Setting up comprehensive real-time subscription for room: ${roomId}`)
  
  const channel = supabase
    .channel(`room:${roomId}`)
    
  // Tasks subscription with status transformation
  if (callbacks.onTaskChange) {
    channel.on('postgres_changes', 
      { event: '*', schema: 'public', table: 'tasks', filter: `room_id=eq.${roomId}` },
      (payload) => {
        console.log('📝 Task change detected:', payload)
        
        // Transform database status to UI status in the payload
        if (payload.new) {
          payload.new.status = dbStatusToUiStatus(payload.new.status)
        }
        if (payload.old) {
          payload.old.status = dbStatusToUiStatus(payload.old.status)
        }
        
        callbacks.onTaskChange!(payload)
      }
    )
  }
  
  // Task User Status subscription
  if (callbacks.onTaskUserStatusChange) {
    channel.on('postgres_changes',
      { event: '*', schema: 'public', table: 'task_user_status' },
      (payload) => {
        console.log('👤 Task user status change detected:', payload)
        callbacks.onTaskUserStatusChange!(payload)
      }
    )
  }
  
  // Task Activity Log subscription
  if (callbacks.onTaskActivityChange) {
    channel.on('postgres_changes',
      { event: '*', schema: 'public', table: 'task_activity_log' },
      (payload) => {
        console.log('📋 Task activity change detected:', payload)
        callbacks.onTaskActivityChange!(payload)
      }
    )
  }
  
  // Chat messages subscription
  if (callbacks.onChatMessage) {
    channel.on('postgres_changes',
      { event: '*', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
      (payload) => {
        console.log('💬 Chat message change detected:', payload)
        callbacks.onChatMessage!(payload)
      }
    )
  }
  
  // Room members subscription
  if (callbacks.onMemberChange) {
    channel.on('postgres_changes',
      { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${roomId}` },
      (payload) => {
        console.log('👥 Member change detected:', payload)
        callbacks.onMemberChange!(payload)
      }
    )
  }
  
  // Study sessions subscription
  if (callbacks.onStudySessionChange) {
    channel.on('postgres_changes',
      { event: '*', schema: 'public', table: 'study_sessions', filter: `room_id=eq.${roomId}` },
      (payload) => {
        console.log('⏱️ Study session change detected:', payload)
        callbacks.onStudySessionChange!(payload)
      }
    )
  }
  
  channel.subscribe((status) => {
    console.log(`🔔 Room ${roomId} subscription status:`, status)
    if (status === 'SUBSCRIBED') {
      console.log(`✅ Successfully subscribed to room ${roomId} comprehensive real-time updates`)
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

// Timer and focus tracking (keep existing ones)
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

export const validateRoomCode = async (code: string) => {
  const { data, error } = await supabase.rpc('get_room_details_for_join', { 
    room_code: code.toUpperCase() 
  })
  
  const roomData = data ? data[0] : null

  return { data: roomData, error }
}

// **ENHANCED Task User Status functions**
export const getTaskUserStatuses = async (taskId: string) => {
  const { data, error } = await supabase
    .from('task_user_status')
    .select('*')
    .eq('task_id', taskId)
    .order('updated_at', { ascending: false })
  return { data, error }
}

export const upsertTaskUserStatus = async (taskId: string, userId: string, userName: string, status: string) => {
  const { data, error } = await supabase
    .from('task_user_status')
    .upsert([
      { 
        task_id: taskId, 
        user_id: userId, 
        user_name: userName, 
        status, 
        updated_at: new Date().toISOString()
      }
    ], { 
      onConflict: 'task_id,user_id',
      ignoreDuplicates: false 
    })
    .select()
  
  // Also log the activity
  if (!error) {
    await addTaskActivityLog(taskId, userId, userName, `Changed status to ${status}`)
  }
  
  return { data, error }
}

export const subscribeToTaskUserStatus = (taskId: string, callback: (payload: any) => void) => {
  const channel = supabase
    .channel(`task_user_status:${taskId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'task_user_status', filter: `task_id=eq.${taskId}` },
      (payload) => {
        console.log('Task user status change:', payload)
        callback(payload)
      }
    )
    .subscribe((status) => {
      console.log(`Task user status subscription for ${taskId}:`, status)
    })
  return channel
}

// **ENHANCED Task Activity Log functions**
export const getTaskActivityLog = async (taskId: string) => {
  const { data, error } = await supabase
    .from('task_activity_log')
    .select('*')
    .eq('task_id', taskId)
    .order('timestamp', { ascending: false })
    .limit(50) // Limit to recent 50 activities
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
      timestamp: new Date().toISOString()
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
      (payload) => {
        console.log('Task activity log change:', payload)
        callback(payload)
      }
    )
    .subscribe((status) => {
      console.log(`Task activity log subscription for ${taskId}:`, status)
    })
  return channel
}

export const getUserRoomTodayFocusTime = async (userId: string, roomId: string) => {
  const { data, error } = await supabase.rpc('get_user_room_today_focus_time', {
    user_uuid: userId,
    room_uuid: roomId
  })
  return { data, error }
}

export const getStudyStreakData = async (userId: string, startDate: Date, endDate: Date) => {
  try {
    const { data, error } = await supabase
      .rpc('get_study_streak_data', {
        p_user_id: userId,
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString()
      })

    return { data, error }
  } catch (error) {
    console.error('Error fetching study streak data:', error)
    return { data: null, error }
  }
}


export const getTodayStudyMinutes = async (userId: string) => {
  try {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    const { data, error } = await supabase
      .from('study_sessions')
      .select('focus_minutes')
      .eq('user_id', userId)
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfDay.toISOString())
      .not('focus_minutes', 'is', null)

    if (error) return { data: 0, error }

    const totalMinutes = data?.reduce((sum, session) => sum + (session.focus_minutes || 0), 0) || 0
    return { data: totalMinutes, error: null }
  } catch (error) {
    console.error('Error fetching today study minutes:', error)
    return { data: 0, error }
  }
}
