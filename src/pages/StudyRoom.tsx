import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { PointsNotification } from '../components/gamification/PointsNotification'
import { AchievementUnlock } from '../components/gamification/AchievementUnlock'
import { 
  Users, Settings, MessageSquare, Plus, Play, Pause, RotateCcw, 
  Clock, CheckCircle, Circle, AlertCircle, Send, Mic, MicOff,
  Video, VideoOff, MoreVertical, Edit3, Trash2, User, Timer,
  Volume2, VolumeX, ArrowLeft, Crown, Dot
} from 'lucide-react'
import { Task, ChatMessage, StudySession, User as UserType, Room } from '../types'
import { TaskItem } from '../components/room/TaskItem'
import { ChatArea } from '../components/room/ChatArea'
import { ChatProvider, useChat } from '../contexts/ChatContext'
import { MemberList } from '../components/room/MemberList'
import { TimerControls } from '../components/room/TimerControls'
import { RoomHeader } from '../components/room/RoomHeader'
import { useAuth } from '../contexts/AuthContext'
import { useGamification } from '../hooks/useGamification'
import { 
  getRoomById, getTasks, createTask, updateTask, deleteTask, 
  getRoomTotalStudyTime, getUserStudyStats, startFocusSession, 
  updateFocusSession, endStudySession, subscribeToRoom, updateUserPresence,
  getProfile
} from '../lib/supabase'

// Wrapper component to access chat context
const StudyRoomContent = ({ 
  room, 
  currentUser, 
  roomId, 
  tasks, 
  timerState,
  onBack,
  audioEnabled,
  micEnabled,
  videoEnabled,
  onToggleAudio,
  onToggleMic,
  onToggleVideo,
  showAddTask,
  setShowAddTask,
  newTaskTitle,
  setNewTaskTitle,
  addTask,
  updateTaskHandler,
  deleteTaskHandler,
  reorderTasks,
  toggleTimer,
  resetTimer,
  setCustomTimer,
  roomTotalStudyTime,
  userTodayFocusTime,
  pendingNotification,
  pendingAchievement,
  clearNotification,
  clearAchievement
}: {
  room: Room
  currentUser: UserType
  roomId: string
  tasks: Task[]
  timerState: any
  onBack: () => void
  audioEnabled: boolean
  micEnabled: boolean
  videoEnabled: boolean
  onToggleAudio: () => void
  onToggleMic: () => void
  onToggleVideo: () => void
  showAddTask: boolean
  setShowAddTask: (value: boolean) => void
  newTaskTitle: string
  setNewTaskTitle: (value: string) => void
  addTask: () => Promise<void>
  updateTaskHandler: (taskId: string, updates: Partial<Task>) => Promise<void>
  deleteTaskHandler: (taskId: string) => Promise<void>
  reorderTasks: (startIndex: number, endIndex: number) => void
  toggleTimer: () => Promise<void>
  resetTimer: () => void
  setCustomTimer: (minutes: number, mode: 'work' | 'break', label?: string, cycles?: number) => void
  roomTotalStudyTime: number
  userTodayFocusTime: number
  pendingNotification: any
  pendingAchievement: any
  clearNotification: () => void
  clearAchievement: () => void
}) => {
  const { sendActivityMessage } = useChat()

  // Enhanced task handlers with activity messages
  const handleTaskComplete = async (taskId: string, updates: Partial<Task>) => {
    await updateTaskHandler(taskId, updates)
    
    if (updates.status === 'completed') {
      const task = tasks.find((t: Task) => t.id === taskId)
      await sendActivityMessage('Task Completed', {
        message: `${currentUser.name} completed task: "${task?.title}"`
      })
    }
  }

  const handleTaskDelete = async (taskId: string) => {
    const task = tasks.find((t: Task) => t.id === taskId)
    await deleteTaskHandler(taskId)
    await sendActivityMessage('Task Deleted', {
      message: `${currentUser.name} deleted task: "${task?.title}"`
    })
  }

  const handleTaskCreate = async () => {
    await addTask()
    await sendActivityMessage('Task Created', {
      message: `${currentUser.name} created a new task`
    })
  }

  const handleTimerStart = async () => {
    await toggleTimer()
    if (!timerState.isRunning) {
      await sendActivityMessage('Timer Started', {
        message: `${currentUser.name} started a ${timerState.mode} timer for ${timerState.minutes} minutes`
      })
    }
  }

  const handleTimerStop = async () => {
    await toggleTimer()
    if (timerState.isRunning) {
      await sendActivityMessage('Timer Stopped', {
        message: `${currentUser.name} stopped the timer`
      })
    }
  }

  const completedTasksCount = tasks.filter((t: Task) => t.status === 'completed').length
  const totalTasks = tasks.length
  const progressPercentage = totalTasks > 0 ? (completedTasksCount / totalTasks) * 100 : 0

  return (
    <div className="min-h-screen bg-hero-gradient">
      {/* Room Header */}
      <RoomHeader 
        room={room}
        onBack={onBack}
        audioEnabled={audioEnabled}
        micEnabled={micEnabled}
        videoEnabled={videoEnabled}
        onToggleAudio={onToggleAudio}
        onToggleMic={onToggleMic}
        onToggleVideo={onToggleVideo}
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
                    onKeyPress={(e) => e.key === 'Enter' && handleTaskCreate()}
                    className="flex-1"
                  />
                  <Button onClick={handleTaskCreate} disabled={!newTaskTitle.trim()}>
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
                .sort((a: Task, b: Task) => a.order - b.order)
                .map((task: Task, index: number) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    members={room.members}
                    onUpdate={handleTaskComplete}
                    onDelete={handleTaskDelete}
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
            currentUser={currentUser}
            roomId={roomId || ''}
          />
        </div>
      </div>

      {/* Bottom Timer Bar */}
      <div className="h-20 bg-dark-900/90 backdrop-blur-xl border-t border-dark-700/50">
        <TimerControls
          timerState={timerState}
          onToggleTimer={timerState.isRunning ? handleTimerStop : handleTimerStart}
          onResetTimer={resetTimer}
          onSetCustomTimer={setCustomTimer}
          audioEnabled={audioEnabled}
          onToggleAudio={onToggleAudio}
          roomTotalStudyTime={roomTotalStudyTime}
          userTodayFocusTime={userTodayFocusTime}
        />
      </div>

      {/* Gamification Notifications */}
      <PointsNotification
        points={pendingNotification?.points || 0}
        reason={pendingNotification?.reason || ''}
        isVisible={!!pendingNotification}
        onComplete={clearNotification}
      />

      <AchievementUnlock
        achievement={pendingAchievement}
        isOpen={!!pendingAchievement}
        onClose={clearAchievement}
      />
    </div>
  )
}

export const StudyRoom = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const {
    awardTaskCompletion: useGamificationAwardTaskCompletion,
    awardHelpGiven,
    pendingNotification,
    pendingAchievement,
    clearNotification,
    clearAchievement
  } = useGamification()
  
  // State management
  const [room, setRoom] = useState<Room | null>(null)
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showAddTask, setShowAddTask] = useState(false)
  const [studySession, setStudySession] = useState<StudySession | null>(null)
  const [roomTotalStudyTime, setRoomTotalStudyTime] = useState(0)
  const [userTodayFocusTime, setUserTodayFocusTime] = useState(0)
  
  // Timer state
  const [timerState, setTimerState] = useState({
    minutes: 25,
    seconds: 0,
    isRunning: false,
    mode: 'work' as 'work' | 'break',
    cycle: 1,
    totalCycles: 4,
    label: undefined as string | undefined,
    totalElapsed: 0 // Total elapsed time in seconds for this session
  })

  // Audio settings
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [micEnabled, setMicEnabled] = useState(false)
  const [videoEnabled, setVideoEnabled] = useState(false)

  // Refs
  const subscriptionRef = useRef<any>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const currentSessionId = useRef<string | null>(null)
  const sessionStartTime = useRef<Date | null>(null)

  // Helper function to reload tasks with user data
  const reloadTasks = async () => {
    if (!roomId) return
    
    try {
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
        console.log('✅ Tasks reloaded:', transformedTasks.length, 'tasks')
      }
    } catch (error) {
      console.error('Error reloading tasks:', error)
    }
  }

  // Helper function to reload room data
  const reloadRoomData = async () => {
    if (!roomId) return
    
    try {
      const { data: roomData, error: roomError } = await getRoomById(roomId)
      if (roomError || !roomData) {
        console.error('Error loading room:', roomError)
        return
      }

      // Transform room data to match expected format
      const transformedRoom: Room = {
        id: roomData.id,
        name: roomData.name,
        code: roomData.code,
        description: roomData.description,
        tags: roomData.tags,
        members: roomData.members?.map((member: any) => ({
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
      console.log('✅ Room data reloaded:', transformedRoom.name)
    } catch (error) {
      console.error('Error reloading room data:', error)
    }
  }

  // Load room data and setup real-time subscriptions
  useEffect(() => {
    if (!roomId || !authUser) return

    const loadRoomData = async () => {
      try {
        console.log('🔄 Loading room data for room:', roomId)
        
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
        await reloadRoomData()

        // Load tasks
        await reloadTasks()

        // Load room total study time
        const { data: totalTime } = await getRoomTotalStudyTime(roomId)
        if (totalTime) {
          setRoomTotalStudyTime(Number(totalTime))
        }

        // Load user today focus time
        if (profile) {
          const { data: userStats } = await getUserStudyStats(profile.id)
          if (userStats) {
            setUserTodayFocusTime(Number(userStats.today_focus_minutes) || 0)
          }

          // Update user presence
          await updateUserPresence(roomId, profile.id, true)
        }

        setLoading(false)
        console.log('✅ Room data loaded successfully')
      } catch (error) {
        console.error('Error loading room data:', error)
        navigate('/dashboard')
      }
    }

    loadRoomData()

    // Setup enhanced real-time subscription with specific callbacks
    console.log('🔗 Setting up real-time subscriptions...')
    subscriptionRef.current = subscribeToRoom(roomId, {
      onTaskChange: (payload) => {
        console.log('📝 Task change received:', payload.eventType, payload.new?.title || payload.old?.title)
        
        if (payload.eventType === 'INSERT' && payload.new) {
          // Add new task immediately
          const newTask: Task = {
            id: payload.new.id,
            title: payload.new.title,
            description: payload.new.description || '',
            duration: payload.new.duration || 30,
            assigneeId: payload.new.assignee_id,
            status: payload.new.status || 'pending',
            createdAt: payload.new.created_at,
            order: payload.new.order_index || 0,
            roomId: payload.new.room_id,
            createdBy: payload.new.created_by
          }
          setTasks(prev => [...prev, newTask])
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          // Update existing task immediately
          setTasks(prev => prev.map(task => 
            task.id === payload.new.id 
              ? { 
                  ...task, 
                  title: payload.new.title,
                  description: payload.new.description || task.description,
                  duration: payload.new.duration || task.duration,
                  status: payload.new.status || task.status,
                  order: payload.new.order_index || task.order,
                  assigneeId: payload.new.assignee_id || task.assigneeId
                }
              : task
          ))
        } else if (payload.eventType === 'DELETE' && payload.old) {
          // Remove deleted task immediately
          setTasks(prev => prev.filter(task => task.id !== payload.old.id))
        }
      },
      
      onChatMessage: (payload) => {
        console.log('💬 Chat message received:', payload.eventType, payload.new?.message?.substring(0, 50))
        
        // Chat messages are now handled by the ChatProvider
      },
      
      onMemberChange: (payload) => {
        console.log('👥 Member change received:', payload.eventType)
        
        // Reload room data to get updated member list
        reloadRoomData()
      },
      
      onStudySessionChange: (payload) => {
        console.log('⏱️ Study session change received:', payload.eventType)
        
        // Update room total study time when sessions change
        if (roomId) {
          getRoomTotalStudyTime(roomId).then(({ data: totalTime }) => {
            if (totalTime) {
              setRoomTotalStudyTime(Number(totalTime))
            }
          })
        }
        
        // Update user today focus time if it's the current user's session
        if (authUser && payload.new?.user_id === authUser.id) {
          getUserStudyStats(authUser.id).then(({ data: userStats }) => {
            if (userStats) {
              setUserTodayFocusTime(Number(userStats.today_focus_minutes) || 0)
            }
          })
        }
      }
    })

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up room subscriptions...')
      
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
      
      // Update user presence to offline when leaving
      if (authUser && roomId) {
        updateUserPresence(roomId, authUser.id, false)
      }

      // End current study session if active
      if (currentSessionId.current && sessionStartTime.current) {
        const focusTime = Math.floor((Date.now() - sessionStartTime.current.getTime()) / 1000 / 60)
        const completedTasks = tasks.filter(t => t.status === 'completed').length
        endStudySession(currentSessionId.current, focusTime, completedTasks)
      }
    }
  }, [roomId, authUser, navigate])

  // Timer effect
  useEffect(() => {
    if (timerState.isRunning) {
      timerRef.current = setInterval(() => {
        setTimerState(prev => {
          const newState = { ...prev }
          
          // Increment total elapsed time
          newState.totalElapsed = prev.totalElapsed + 1
          
          if (prev.seconds > 0) {
            newState.seconds = prev.seconds - 1
          } else if (prev.minutes > 0) {
            newState.minutes = prev.minutes - 1
            newState.seconds = 59
          } else {
            // Timer finished
            if (audioEnabled) {
              console.log('⏰ Timer finished!')
              // Here you could play a sound notification
            }
            
            const nextMode = prev.mode === 'work' ? 'break' : 'work'
            const nextMinutes = nextMode === 'work' ? 25 : prev.cycle % 4 === 0 ? 15 : 5
            const nextCycle = prev.mode === 'break' ? prev.cycle + 1 : prev.cycle
            
            newState.minutes = nextMinutes
            newState.seconds = 0
            newState.isRunning = false
            newState.mode = nextMode
            newState.cycle = nextCycle > prev.totalCycles ? 1 : nextCycle
            newState.label = undefined
            newState.totalElapsed = 0
          }
          
          return newState
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

  if (loading || !room || !currentUser) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-500 border-t-transparent"></div>
      </div>
    )
  }

  // Task management functions
  const addTask = async () => {
    if (!newTaskTitle.trim() || !roomId || !currentUser) return

    try {
      const { data, error } = await createTask({
        room_id: roomId,
        title: newTaskTitle.trim(),
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
      
      if (data) {
        setNewTaskTitle('')
        setShowAddTask(false)
        
        // Award points for task creation
        useGamificationAwardTaskCompletion(10)
      }
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const updateTaskHandler = async (taskId: string, updates: Partial<Task>) => {
    try {
      console.log('📝 Updating task:', taskId, updates)
      
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

      // Award points for task completion
      if (updates.status === 'completed') {
        const task = tasks.find(t => t.id === taskId)
        const assignee = room.members.find(m => m.id === task?.assigneeId)
        
        if (task && assignee?.id === currentUser.id) {
          useGamificationAwardTaskCompletion(task.duration)
        }
      }
      
      console.log('✅ Task updated successfully')
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const deleteTaskHandler = async (taskId: string) => {
    try {
      console.log('🗑️ Deleting task:', taskId)
      
      const { error } = await deleteTask(taskId)
      
      if (error) {
        console.error('Error deleting task:', error)
        return
      }
      
      console.log('✅ Task deleted successfully')
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const reorderTasks = (startIndex: number, endIndex: number) => {
    // Implementation for task reordering
    console.log('Reordering tasks:', startIndex, 'to', endIndex)
  }

  // Timer management functions
  const toggleTimer = async () => {
    const wasRunning = timerState.isRunning
    
    if (!wasRunning) {
      // Starting timer
      setTimerState(prev => ({ ...prev, isRunning: true }))
      
      // Start focus session
      if (roomId && currentUser) {
        const { data: session } = await startFocusSession(roomId, currentUser.id)
        if (session) {
          currentSessionId.current = session.id
          sessionStartTime.current = new Date()
        }
      }
    } else {
      // Pausing timer
      setTimerState(prev => ({ ...prev, isRunning: false }))
      
      // Update focus session
      if (currentSessionId.current) {
        const focusTime = Math.floor(timerState.totalElapsed / 60)
        await updateFocusSession(currentSessionId.current, focusTime)
      }
    }
  }

  const resetTimer = () => {
    setTimerState(prev => ({
      ...prev,
      minutes: 25,
      seconds: 0,
      isRunning: false,
      mode: 'work',
      cycle: 1,
      totalElapsed: 0
    }))
    
    // Reset session tracking
    sessionStartTime.current = null
    
    // End current session if active
    if (currentSessionId.current) {
      const focusTime = Math.floor(timerState.totalElapsed / 60)
      const completedTasks = tasks.filter(t => t.status === 'completed').length
      endStudySession(currentSessionId.current, focusTime, completedTasks)
      currentSessionId.current = null
    }
  }

  const setCustomTimer = (minutes: number, mode: 'work' | 'break', label?: string, cycles?: number) => {
    setTimerState(prev => ({
      ...prev,
      minutes,
      seconds: 0,
      mode,
      label,
      isRunning: false,
      totalElapsed: 0,
      cycle: 1,
      totalCycles: cycles || prev.totalCycles
    }))
    
    // Reset session tracking
    sessionStartTime.current = null
    
    // End current session if active
    if (currentSessionId.current) {
      const focusTime = Math.floor(timerState.totalElapsed / 60)
      const completedTasks = tasks.filter(t => t.status === 'completed').length
      endStudySession(currentSessionId.current, focusTime, completedTasks)
      currentSessionId.current = null
    }
  }

  return (
    <ChatProvider 
      currentUser={currentUser}
      roomId={roomId || ''}
      wsUrl={import.meta.env.VITE_WS_URL || 'ws://localhost:3001'}
    >
      <StudyRoomContent
        room={room}
        currentUser={currentUser}
        roomId={roomId || ''}
        tasks={tasks}
        timerState={timerState}
        onBack={() => navigate('/dashboard')}
        audioEnabled={audioEnabled}
        micEnabled={micEnabled}
        videoEnabled={videoEnabled}
        onToggleAudio={() => setAudioEnabled(!audioEnabled)}
        onToggleMic={() => setMicEnabled(!micEnabled)}
        onToggleVideo={() => setVideoEnabled(!videoEnabled)}
        showAddTask={showAddTask}
        setShowAddTask={setShowAddTask}
        newTaskTitle={newTaskTitle}
        setNewTaskTitle={setNewTaskTitle}
        addTask={addTask}
        updateTaskHandler={updateTaskHandler}
        deleteTaskHandler={deleteTaskHandler}
        reorderTasks={reorderTasks}
        toggleTimer={toggleTimer}
        resetTimer={resetTimer}
        setCustomTimer={setCustomTimer}
        roomTotalStudyTime={roomTotalStudyTime}
        userTodayFocusTime={userTodayFocusTime}
        pendingNotification={pendingNotification}
        pendingAchievement={pendingAchievement}
        clearNotification={clearNotification}
        clearAchievement={clearAchievement}
      />
    </ChatProvider>
  )
}