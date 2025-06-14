import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { 
  Users, Settings, MessageSquare, Plus, Play, Pause, RotateCcw, 
  Clock, CheckCircle, Circle, AlertCircle, Send, Mic, MicOff,
  Video, VideoOff, MoreVertical, Edit3, Trash2, User, Timer,
  Volume2, VolumeX, ArrowLeft, Crown, Dot
} from 'lucide-react'
import { Task, ChatMessage, StudySession, User as UserType, Room } from '../types'
import { TaskItem } from '../components/room/TaskItem'
import { ChatArea } from '../components/room/ChatArea'
import { MemberList } from '../components/room/MemberList'
import { TimerControls } from '../components/room/TimerControls'
import { RoomHeader } from '../components/room/RoomHeader'
import { useAuth } from '../contexts/AuthContext'
import { 
  getRoomById, getTasks, createTask, updateTask, deleteTask,
  getChatMessages, sendChatMessage, subscribeToRoom, updateUserPresence,
  getProfile, createStudySession, updateStudySession
} from '../lib/supabase'

export const StudyRoom = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  
  // State management
  const [room, setRoom] = useState<Room | null>(null)
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showAddTask, setShowAddTask] = useState(false)
  const [studySession, setStudySession] = useState<StudySession | null>(null)
  
  // Timer state
  const [timerState, setTimerState] = useState({
    minutes: 25,
    seconds: 0,
    isRunning: false,
    mode: 'work' as 'work' | 'break',
    cycle: 1,
    totalCycles: 4
  })

  // Audio settings
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [micEnabled, setMicEnabled] = useState(false)
  const [videoEnabled, setVideoEnabled] = useState(false)

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout>()
  const subscriptionRef = useRef<any>(null)

  // Load room data and setup real-time subscriptions
  useEffect(() => {
    if (!roomId || !authUser) return

    const loadRoomData = async () => {
      try {
        // Load current user profile
        const { data: profile } = await getProfile(authUser.id)
        if (profile) {
          setCurrentUser({
            id: profile.id,
            name: profile.full_name || 'User',
            email: authUser.email || '',
            avatar: profile.avatar_url || undefined,
            totalPoints: profile.total_points,
            rank: profile.rank,
            achievements: profile.achievements,
            createdAt: profile.created_at
          })
        }

        // Load room data
        const { data: roomData, error: roomError } = await getRoomById(roomId)
        if (roomError || !roomData) {
          console.error('Error loading room:', roomError)
          navigate('/dashboard')
          return
        }

        // Transform room data to match expected format
        const transformedRoom: Room = {
          id: roomData.id,
          name: roomData.name,
          code: roomData.code,
          description: roomData.description,
          tags: roomData.tags,
          members: roomData.members?.map(member => ({
            id: member.user?.id || '',
            name: member.user?.full_name || 'User',
            email: '',
            avatar: member.user?.avatar_url || undefined,
            totalPoints: member.user?.total_points || 0,
            rank: member.user?.rank || 'Beginner',
            achievements: member.user?.achievements || [],
            createdAt: member.user?.created_at || new Date().toISOString()
          })) || [],
          adminId: roomData.admin_id,
          maxMembers: roomData.max_members,
          isPrivate: roomData.is_private,
          isActive: roomData.is_active,
          createdAt: roomData.created_at,
          lastActivity: roomData.updated_at
        }

        setRoom(transformedRoom)

        // Load tasks
        const { data: tasksData } = await getTasks(roomId)
        if (tasksData) {
          const transformedTasks: Task[] = tasksData.map(task => ({
            id: task.id,
            title: task.title,
            description: task.description,
            duration: task.duration,
            assigneeId: task.assignee_id,
            status: task.status,
            createdAt: task.created_at,
            order: task.order_index,
            roomId: task.room_id,
            createdBy: task.created_by
          }))
          setTasks(transformedTasks)
        }

        // Load chat messages
        const { data: messagesData } = await getChatMessages(roomId)
        if (messagesData) {
          const transformedMessages: ChatMessage[] = messagesData.map(msg => ({
            id: msg.id,
            userId: msg.user_id,
            userName: msg.user?.full_name || 'User',
            userAvatar: msg.user?.avatar_url || undefined,
            message: msg.message,
            timestamp: msg.created_at,
            type: msg.message_type,
            roomId: msg.room_id
          }))
          setMessages(transformedMessages)
        }

        // Create or update study session
        if (profile) {
          const { data: sessionData } = await createStudySession({
            room_id: roomId,
            user_id: profile.id,
            start_time: new Date().toISOString(),
            focus_time: 0,
            completed_tasks: 0,
            is_active: true
          })

          if (sessionData) {
            setStudySession({
              id: sessionData.id,
              roomId: sessionData.room_id,
              startTime: sessionData.start_time,
              participants: transformedRoom.members,
              totalFocusTime: sessionData.focus_time,
              completedTasks: sessionData.completed_tasks,
              isActive: sessionData.is_active
            })
          }

          // Update user presence
          await updateUserPresence(roomId, profile.id, true)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error loading room data:', error)
        navigate('/dashboard')
      }
    }

    loadRoomData()

    // Setup real-time subscription
    subscriptionRef.current = subscribeToRoom(roomId, (payload) => {
      console.log('Real-time update:', payload)
      
      if (payload.table === 'tasks') {
        if (payload.eventType === 'INSERT') {
          const newTask: Task = {
            id: payload.new.id,
            title: payload.new.title,
            description: payload.new.description,
            duration: payload.new.duration,
            assigneeId: payload.new.assignee_id,
            status: payload.new.status,
            createdAt: payload.new.created_at,
            order: payload.new.order_index,
            roomId: payload.new.room_id,
            createdBy: payload.new.created_by
          }
          setTasks(prev => [...prev, newTask])
        } else if (payload.eventType === 'UPDATE') {
          setTasks(prev => prev.map(task => 
            task.id === payload.new.id 
              ? { ...task, ...payload.new, order: payload.new.order_index }
              : task
          ))
        } else if (payload.eventType === 'DELETE') {
          setTasks(prev => prev.filter(task => task.id !== payload.old.id))
        }
      } else if (payload.table === 'chat_messages') {
        if (payload.eventType === 'INSERT') {
          // Reload messages to get user data
          getChatMessages(roomId).then(({ data: messagesData }) => {
            if (messagesData) {
              const transformedMessages: ChatMessage[] = messagesData.map(msg => ({
                id: msg.id,
                userId: msg.user_id,
                userName: msg.user?.full_name || 'User',
                userAvatar: msg.user?.avatar_url || undefined,
                message: msg.message,
                timestamp: msg.created_at,
                type: msg.message_type,
                roomId: msg.room_id
              }))
              setMessages(transformedMessages)
            }
          })
        }
      }
    })

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
      
      // Update user presence to offline when leaving
      if (authUser && roomId) {
        updateUserPresence(roomId, authUser.id, false)
      }
    }
  }, [roomId, authUser, navigate])

  // Timer effect
  useEffect(() => {
    if (timerState.isRunning) {
      timerRef.current = setInterval(() => {
        setTimerState(prev => {
          if (prev.seconds > 0) {
            return { ...prev, seconds: prev.seconds - 1 }
          } else if (prev.minutes > 0) {
            return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
          } else {
            // Timer finished
            if (audioEnabled) {
              console.log('Timer finished!')
            }
            
            const nextMode = prev.mode === 'work' ? 'break' : 'work'
            const nextMinutes = nextMode === 'work' ? 25 : prev.cycle % 4 === 0 ? 15 : 5
            const nextCycle = prev.mode === 'break' ? prev.cycle + 1 : prev.cycle
            
            return {
              ...prev,
              minutes: nextMinutes,
              seconds: 0,
              isRunning: false,
              mode: nextMode,
              cycle: nextCycle > prev.totalCycles ? 1 : nextCycle
            }
          }
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [timerState.isRunning, audioEnabled])

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Simulate typing indicators
  useEffect(() => {
    let timeout: NodeJS.Timeout
    if (isTyping) {
      timeout = setTimeout(() => {
        setIsTyping(false)
      }, 3000)
    }
    return () => clearTimeout(timeout)
  }, [isTyping])

  if (loading || !room || !currentUser) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-500 border-t-transparent"></div>
      </div>
    )
  }

  // Task management functions
  const addTask = async () => {
    if (!newTaskTitle.trim() || !roomId) return

    try {
      const { data, error } = await createTask({
        room_id: roomId,
        title: newTaskTitle,
        description: '',
        duration: 30,
        assignee_id: currentUser.id,
        status: 'pending',
        order_index: tasks.length,
        created_by: currentUser.id
      })

      if (error) {
        console.error('Error creating task:', error)
        return
      }

      setNewTaskTitle('')
      setShowAddTask(false)
      addSystemMessage(`${currentUser.name} added a new task: "${newTaskTitle}"`)
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const updateTaskHandler = async (taskId: string, updates: Partial<Task>) => {
    try {
      const dbUpdates: any = {}
      
      if (updates.title !== undefined) dbUpdates.title = updates.title
      if (updates.description !== undefined) dbUpdates.description = updates.description
      if (updates.duration !== undefined) dbUpdates.duration = updates.duration
      if (updates.status !== undefined) dbUpdates.status = updates.status
      if (updates.assigneeId !== undefined) dbUpdates.assignee_id = updates.assigneeId
      if (updates.order !== undefined) dbUpdates.order_index = updates.order

      const { error } = await updateTask(taskId, dbUpdates)
      
      if (error) {
        console.error('Error updating task:', error)
        return
      }

      // Add system message for status changes
      if (updates.status) {
        const task = tasks.find(t => t.id === taskId)
        const assignee = room.members.find(m => m.id === task?.assigneeId)
        addSystemMessage(`${assignee?.name || 'Someone'} marked "${task?.title}" as ${updates.status}`)
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const deleteTaskHandler = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      const { error } = await deleteTask(taskId)
      
      if (error) {
        console.error('Error deleting task:', error)
        return
      }

      addSystemMessage(`Task "${task?.title}" was deleted`)
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const reorderTasks = (startIndex: number, endIndex: number) => {
    // This would need more complex implementation for real drag-and-drop
    console.log('Reorder tasks:', startIndex, endIndex)
  }

  // Chat functions
  const sendMessage = async () => {
    if (!newMessage.trim() || !roomId) return

    try {
      const { error } = await sendChatMessage({
        room_id: roomId,
        user_id: currentUser.id,
        message: newMessage,
        message_type: 'message'
      })

      if (error) {
        console.error('Error sending message:', error)
        return
      }

      setNewMessage('')
      setIsTyping(false)
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const addSystemMessage = async (message: string) => {
    if (!roomId) return

    try {
      await sendChatMessage({
        room_id: roomId,
        user_id: null,
        message,
        message_type: 'system'
      })
    } catch (error) {
      console.error('Error sending system message:', error)
    }
  }

  // Timer functions
  const toggleTimer = () => {
    setTimerState(prev => ({ ...prev, isRunning: !prev.isRunning }))
    
    if (!timerState.isRunning) {
      addSystemMessage(`${currentUser.name} started the ${timerState.mode} timer`)
    } else {
      addSystemMessage(`${currentUser.name} paused the timer`)
    }
  }

  const resetTimer = () => {
    setTimerState(prev => ({
      ...prev,
      minutes: prev.mode === 'work' ? 25 : prev.cycle % 4 === 0 ? 15 : 5,
      seconds: 0,
      isRunning: false
    }))
    addSystemMessage(`${currentUser.name} reset the timer`)
  }

  const completedTasksCount = tasks.filter(t => t.status === 'completed').length
  const totalTasks = tasks.length
  const progressPercentage = totalTasks > 0 ? (completedTasksCount / totalTasks) * 100 : 0

  return (
    <div className="min-h-screen bg-hero-gradient">
      {/* Room Header */}
      <RoomHeader 
        room={room}
        onBack={() => navigate('/dashboard')}
        audioEnabled={audioEnabled}
        micEnabled={micEnabled}
        videoEnabled={videoEnabled}
        onToggleAudio={() => setAudioEnabled(!audioEnabled)}
        onToggleMic={() => setMicEnabled(!micEnabled)}
        onToggleVideo={() => setVideoEnabled(!videoEnabled)}
      />

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar - Members */}
        <div className="w-64 bg-card-gradient backdrop-blur-xl border-r border-dark-700/50">
          <MemberList 
            members={room.members}
            currentUserId={currentUser.id}
            adminId={room.adminId}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Study Plan Header */}
          <div className="p-6 border-b border-dark-700/50 bg-dark-900/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Study Plan</h2>
                <p className="text-dark-300 text-sm">
                  {completedTasksCount} of {totalTasks} tasks completed
                </p>
              </div>
              <Button
                onClick={() => setShowAddTask(true)}
                icon={Plus}
                size="sm"
              >
                Add Task
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-dark-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Tasks List */}
          <div className="flex-1 p-6 overflow-y-auto">
            {showAddTask && (
              <Card className="mb-4 animate-slide-down">
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter task title..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTask()}
                    className="flex-1"
                  />
                  <Button onClick={addTask} disabled={!newTaskTitle.trim()}>
                    Add
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowAddTask(false)
                      setNewTaskTitle('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}

            <div className="space-y-3">
              {tasks
                .sort((a, b) => a.order - b.order)
                .map((task, index) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    members={room.members}
                    onUpdate={updateTaskHandler}
                    onDelete={deleteTaskHandler}
                    onReorder={reorderTasks}
                    index={index}
                  />
                ))}
            </div>

            {tasks.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-dark-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No tasks yet</h3>
                <p className="text-dark-300 mb-4">Add your first task to get started</p>
                <Button onClick={() => setShowAddTask(true)} icon={Plus}>
                  Add Task
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Chat */}
        <div className="w-80 bg-card-gradient backdrop-blur-xl border-l border-dark-700/50">
          <ChatArea
            messages={messages}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            onSendMessage={sendMessage}
            isTyping={isTyping}
            setIsTyping={setIsTyping}
            typingUsers={typingUsers}
            currentUser={currentUser}
            chatEndRef={chatEndRef}
          />
        </div>
      </div>

      {/* Bottom Timer Bar */}
      <div className="h-20 bg-dark-900/90 backdrop-blur-xl border-t border-dark-700/50">
        <TimerControls
          timerState={timerState}
          onToggleTimer={toggleTimer}
          onResetTimer={resetTimer}
          audioEnabled={audioEnabled}
          onToggleAudio={() => setAudioEnabled(!audioEnabled)}
        />
      </div>
    </div>
  )
}