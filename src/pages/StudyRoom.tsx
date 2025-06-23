import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { PointsNotification } from '../components/gamification/PointsNotification'
import { AchievementUnlock } from '../components/gamification/AchievementUnlock'
import { 
  Users, Settings, MessageSquare, Plus, Play, Pause, RotateCcw, 
  Clock, CheckCircle, Circle, AlertCircle, Send, Mic, MicOff,
  Video, VideoOff, MoreVertical, Edit3, Trash2, User, Timer,
  Volume2, VolumeX, ArrowLeft, Crown, Dot, Menu
} from 'lucide-react'
import { Task, ChatMessage, StudySession, User as UserType, Room, TaskStatus, TaskPriority } from '../types'
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
  getProfile, upsertTaskUserStatus, addTaskActivityLog, getUserRoomTodayFocusTime
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
  newTaskDescription,
  setNewTaskDescription,
  newTaskPriority,
  setNewTaskPriority,
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
  newTaskDescription: string
  setNewTaskDescription: (value: string) => void
  newTaskPriority: TaskPriority
  setNewTaskPriority: (value: TaskPriority) => void
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
  const [showMembers, setShowMembers] = useState(false)
  const [showChat, setShowChat] = useState(false)

  // Enhanced task handlers with activity messages and user status tracking
  const handleTaskComplete = async (taskId: string, updates: Partial<Task>): Promise<void> => {
    await updateTaskHandler(taskId, updates)
    
    // Update user's individual status for this task
    if (updates.status) {
      await upsertTaskUserStatus(taskId, currentUser.id, currentUser.name, updates.status)
    }
    
    if (updates.status === 'Completed') {
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

  const completedTasksCount = tasks.filter((t: Task) => t.status === 'Completed').length
  const totalTasks = tasks.length
  const progressPercentage = totalTasks > 0 ? (completedTasksCount / totalTasks) * 100 : 0

  return (
    <div className="min-h-screen bg-hero-gradient relative w-full max-w-full overflow-x-hidden">
      {/* Room Header + Mobile Menu */}
      <div className="relative w-full max-w-full overflow-x-hidden">
        <RoomHeader 
          room={room}
          currentUser={currentUser}
          onBack={onBack}
          audioEnabled={audioEnabled}
          micEnabled={micEnabled}
          videoEnabled={videoEnabled}
          onToggleAudio={onToggleAudio}
          onToggleMic={onToggleMic}
          onToggleVideo={onToggleVideo}
        />
        <div className="flex gap-2 sm:hidden absolute right-2 top-1/2 -translate-y-1/2 z-30">
          {/* Floating Chat Button */}
          <button
            className="relative bg-primary-600 rounded-full p-3 shadow-lg flex items-center justify-center"
            onClick={() => setShowChat(true)}
            aria-label="Open Chat"
          >
            <MessageSquare className="w-5 h-5 text-white" />
            {/* Example badge for new messages */}
            {/* <span className="absolute -top-1 -right-1 bg-red-500 text-xs text-white rounded-full px-1.5 py-0.5">2</span> */}
          </button>
        </div>
      </div>
      {/* Mobile Chat Drawer */}
      <div className={`fixed inset-0 z-50 bg-black/60 transition-all duration-300 ${showChat ? 'block' : 'hidden'}`} onClick={() => setShowChat(false)} />
      <div className={`fixed right-0 top-0 h-full w-full max-w-full bg-card-gradient z-50 shadow-xl transition-transform duration-300 ${showChat ? 'translate-x-0' : 'translate-x-full'} sm:hidden`}>
        <div className="flex items-center justify-between p-3 border-b border-dark-700/50">
          <h3 className="text-base font-semibold text-white">Chat</h3>
          <Button variant="ghost" size="sm" icon={Menu} onClick={() => setShowChat(false)} />
        </div>
        <div className="h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar">
          <ChatArea currentUser={currentUser} roomId={roomId || ''} />
        </div>
      </div>
      {/* Main Layout */}
      <div className="flex h-[calc(100vh-80px)] sm:flex-row flex-col w-full max-w-full overflow-x-hidden">
        {/* Left Sidebar - Members (hidden on mobile) */}
        <div className="w-64 bg-card-gradient backdrop-blur-xl border-r border-dark-700/50 hidden sm:block">
          <MemberList 
            members={room.members}
            currentUserId={currentUser.id}
            adminId={room.adminId}
          />
        </div>
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 w-full max-w-full overflow-x-hidden">
          {/* Study Plan Header */}
          <div className="p-2 sm:p-6 border-b border-dark-700/50 bg-dark-900/50 w-full max-w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 w-full max-w-full">
              <div>
                <h2 className="text-base sm:text-xl font-semibold text-white">Study Plan</h2>
                <p className="text-xs sm:text-sm text-dark-300">
                  {completedTasksCount} of {totalTasks} tasks completed
                </p>
              </div>
              <Button
                onClick={() => setShowAddTask(true)}
                icon={Plus}
                size="sm"
                className="w-full sm:w-auto"
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
          <div className="flex-1 p-2 sm:p-6 overflow-y-auto custom-scrollbar w-full max-w-full pb-24 sm:pb-0">
            {showAddTask && (
              <Card className="mb-4 animate-slide-down">
                <div className="flex flex-col gap-3">
                  <Input
                    placeholder="Enter task title..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleTaskCreate()}
                    className="flex-1 text-sm py-2"
                  />
                  <textarea
                    placeholder="Enter task description (optional)..."
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none text-sm"
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <label className="text-xs sm:text-sm text-dark-400">Priority:</label>
                    <select
                      value={newTaskPriority}
                      onChange={e => setNewTaskPriority(e.target.value as TaskPriority)}
                      className="px-2 py-1 rounded border text-xs sm:text-sm w-full sm:w-auto"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button onClick={handleTaskCreate} disabled={!newTaskTitle.trim()} className="text-xs sm:text-sm py-2 w-full sm:w-auto">
                      Add
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowAddTask(false)
                        setNewTaskTitle('')
                        setNewTaskDescription('')
                        setNewTaskPriority('Medium')
                      }}
                      className="text-xs sm:text-sm py-2 w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            )}
            <div className="space-y-3 w-full max-w-full">
              {tasks
                .sort((a: Task, b: Task) => a.order - b.order)
                .map((task: Task, index: number) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    members={room.members}
                    onUpdate={handleTaskComplete}
                    onDelete={handleTaskDelete}
                    index={index}
                    currentUserId={currentUser.id}
                  />
                ))}
            </div>
            {tasks.length === 0 && (
              <div className="text-center py-8 sm:py-12">
                <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-dark-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">No tasks yet</h3>
                <p className="text-dark-300 text-xs sm:text-base mb-3 sm:mb-4">Add your first task to get started</p>
                <Button onClick={() => setShowAddTask(true)} icon={Plus} className="w-full sm:w-auto text-xs sm:text-sm py-2">
                  Add Task
                </Button>
              </div>
            )}
          </div>
        </div>
        {/* Right Sidebar - Chat (hidden on mobile) */}
        <div className="w-80 bg-card-gradient backdrop-blur-xl border-l border-dark-700/50 hidden sm:block">
          <ChatArea
            currentUser={currentUser}
            roomId={roomId || ''}
          />
        </div>
      </div>
      {/* Bottom Timer Bar (fixed only on mobile) */}
      <div className="h-20 bg-dark-900/90 backdrop-blur-xl border-t border-dark-700/50 w-full max-w-full sm:static z-40 fixed bottom-0 left-0 sm:relative sm:z-auto">
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
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user: authUser } = useAuth()
  const {
    awardPoints,
    awardTaskCompletion,
    awardDailyStreak,
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
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('Medium')
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
    totalElapsed: 0
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
  const roomRef = useRef<Room | null>(null)

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
          status: task.status as TaskStatus, // Status is already transformed in supabase.ts
          createdAt: task.created_at,
          order: task.order_index,
          roomId: task.room_id,
          createdBy: task.created_by,
          priority: (task.priority as TaskPriority) || 'Medium',
          creatorName: (task.creator?.full_name || task.creator_name || 'Unknown')
        }))
        setTasks(transformedTasks)
        console.log('✅ Tasks reloaded:', transformedTasks.length, 'tasks')
      }
    } catch (error) {
      console.error('Error reloading tasks:', error)
    }
  }

  const reloadRoomData = useCallback(async () => {
    if (!roomId) return
    
    try {
      console.log('🔄 Reloading room data for room:', roomId)
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
          id: member.user?.id || member.user_id || '',
          name: member.user?.full_name || 'User',
          email: member.user?.email || '',
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
      roomRef.current = transformedRoom
      console.log('✅ Room data reloaded:', transformedRoom.name, 'Members:', transformedRoom.members.length)
    } catch (error) {
      console.error('Error reloading room data:', error)
    }
  }, [roomId])

  // Load room data and setup real-time subscriptions
  useEffect(() => {
    if (!roomId || !authUser) return

    const loadInitialData = async () => {
      setLoading(true)
      console.log('🔄 Loading initial room data for room:', roomId)

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

      await reloadRoomData()
      
      // If a new member just joined (data passed from navigation),
      // add them to the room state immediately to prevent race conditions.
      if (location.state?.newMember && roomRef.current) {
        const { newMember } = location.state
        if (!roomRef.current.members.some(m => m.id === newMember.user.id)) {
          const transformedMember = {
            id: newMember.user.id,
            name: newMember.user.full_name,
            email: newMember.user.email || '',
            avatar: newMember.user.avatar_url,
            totalPoints: newMember.user.total_points,
            rank: newMember.user.rank,
            achievements: newMember.user.achievements,
            createdAt: newMember.user.created_at
          };
          
          setRoom(prevRoom => {
            if (!prevRoom) return null;
            const updatedMembers = [...prevRoom.members, transformedMember];
            const updatedRoom = { ...prevRoom, members: updatedMembers };
            roomRef.current = updatedRoom;
            console.log('✅ Instantly added new member to room state:', transformedMember.name)
            return updatedRoom;
          });
        }
      }

      // Load other data
      await reloadTasks()
      const { data: totalTime } = await getRoomTotalStudyTime(roomId)
      setRoomTotalStudyTime(Number(totalTime) || 0)

      if (profile) {
        getUserRoomTodayFocusTime(profile.id, roomId).then(({ data: todayFocus }) => {
          setUserTodayFocusTime(Number(todayFocus) || 0)
        })
        await updateUserPresence(roomId, profile.id, true)
      }

      setLoading(false)
      console.log('✅ Initial room data loaded.')
    }

    loadInitialData()

    // **ENHANCED real-time subscription with comprehensive callbacks**
    console.log('🔗 Setting up comprehensive real-time subscriptions...')
    subscriptionRef.current = subscribeToRoom(roomId, {
      onTaskChange: (payload) => {
        console.log('📝 Task change received:', payload.eventType, payload.new?.title || payload.old?.title)
        // Always update state from real-time event, even for the user who made the change
        if (payload.eventType === 'INSERT' && payload.new) {
          // Find creator name from members if not present
          let creatorName = payload.new.creator_name || 'Unknown';
          if (!payload.new.creator_name && room && room.members) {
            const found = room.members.find(m => m.id === payload.new.created_by);
            if (found) creatorName = found.name;
          }
          const newTask: Task = {
            id: payload.new.id,
            title: payload.new.title,
            description: payload.new.description || '',
            duration: payload.new.duration || 30,
            assigneeId: payload.new.assignee_id,
            status: payload.new.status as TaskStatus,
            createdAt: payload.new.created_at,
            order: payload.new.order_index || 0,
            roomId: payload.new.room_id,
            createdBy: payload.new.created_by,
            priority: (payload.new.priority as TaskPriority) || 'Medium',
            creatorName
          }
          setTasks(prev => {
            // Prevent duplicate insertions
            if (prev.some(task => task.id === newTask.id)) return prev
            // Remove any temp task with same title and creator (optimistic UI)
            const filtered = prev.filter(task => !(task.title === newTask.title && task.createdBy === newTask.createdBy && task.id.startsWith('temp-')))
            return [...filtered, newTask].sort((a, b) => a.order - b.order)
          })
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          setTasks(prev => prev.map(task =>
            task.id === payload.new.id
              ? {
                  ...task,
                  title: payload.new.title,
                  description: payload.new.description || task.description,
                  duration: payload.new.duration || task.duration,
                  status: payload.new.status as TaskStatus,
                  order: payload.new.order_index || task.order,
                  assigneeId: payload.new.assignee_id || task.assigneeId,
                  priority: (payload.new.priority as TaskPriority) || task.priority,
                  creatorName: payload.new.creator_name || (room && room.members ? (room.members.find(m => m.id === payload.new.created_by)?.name || task.creatorName) : task.creatorName)
                }
              : task
          ))
        } else if (payload.eventType === 'DELETE' && payload.old) {
          setTasks(prev => prev.filter(task => task.id !== payload.old.id))
        }
      },
      
      onTaskUserStatusChange: (payload) => {
        console.log('👤 Task user status change received:', payload.eventType)
        // This can be used to update individual user status indicators in TaskItem
        // For now, we'll just log it, but you can extend TaskItem to show individual statuses
      },
      
      onTaskActivityChange: (payload) => {
        console.log('📋 Task activity change received:', payload.eventType)
        // This can be used to show activity feeds or notifications
      },
      
      onChatMessage: (payload) => {
        console.log('💬 Chat message received:', payload.eventType)
        // Chat messages are handled by the ChatProvider
      },
      
      onMemberChange: (payload) => {
        console.log('👥 Member change received:', payload.eventType, payload.new || payload.old)
        // Simple reload is sufficient now.
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
        if (authUser) {
          getUserRoomTodayFocusTime(authUser.id, roomId).then(({ data: todayFocus }) => {
            setUserTodayFocusTime(Number(todayFocus) || 0)
          })
        }
      }
    })

    // Handle page unload to mark user as offline
    const handleBeforeUnload = async () => {
      if (authUser && roomId) {
        try {
          // Use navigator.sendBeacon for reliable delivery during page unload
          const data = {
            room_id: roomId,
            user_id: authUser.id,
            status: 'offline',
            last_seen: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          // Send to a cleanup endpoint or directly to Supabase
          navigator.sendBeacon(
            `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/chat_presence`,
            JSON.stringify(data)
          )
        } catch (error) {
          console.error('Error marking user offline on page unload:', error)
        }
      }
    }

    // Add event listeners for page unload
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handleBeforeUnload)

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up room subscriptions...')
      
      // Remove event listeners
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handleBeforeUnload)
      
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
      
      // Update user presence to offline when leaving
      if (authUser && roomId) {
        updateUserPresence(roomId, authUser.id, false)
      }

      // End current study session if active
      if (currentSessionId.current && sessionStartTime.current) {
        // Only count focus time if mode is 'work'
        if (timerState.mode === 'work') {
          const focusTime = Math.floor((Date.now() - sessionStartTime.current.getTime()) / 1000 / 60)
          const completedTasks = tasks.filter(t => t.status === 'Completed').length
          endStudySession(currentSessionId.current, focusTime, completedTasks)
          // Award points for focus time
          if (focusTime > 0) {
            awardPoints(focusTime * 2, 'Focus Session', 'task_complete', { duration: focusTime })
          }
        }
      }
    }
  }, [roomId, authUser, reloadRoomData, location.state])

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
            
            // Handle focus time tracking when timer finishes automatically
            if (currentSessionId.current && sessionStartTime.current && prev.mode === 'work') {
              const focusTime = Math.floor((Date.now() - sessionStartTime.current.getTime()) / 1000 / 60)
              const completedTasks = tasks.filter(t => t.status === 'Completed').length
              
              // End the current study session
              endStudySession(currentSessionId.current, focusTime, completedTasks).then(() => {
                // Award points for focus time
                if (focusTime > 0) {
                  awardPoints(focusTime * 2, 'Focus Session', 'task_complete', { duration: focusTime })
                }
                
                // Update user's today focus time
                if (authUser && roomId) {
                  getUserRoomTodayFocusTime(authUser.id, roomId).then(({ data: todayFocus }) => {
                    setUserTodayFocusTime(Number(todayFocus) || 0)
                  })
                }
              })
              
              // Reset session tracking
              currentSessionId.current = null
              sessionStartTime.current = null
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
  }, [timerState.isRunning, audioEnabled, tasks, authUser, roomId])

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

    const now = new Date().toISOString()
    // Create a temporary task object for optimistic UI
    const tempTask: Task = {
      id: 'temp-' + Math.random().toString(36).substr(2, 9),
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim(),
      duration: 30,
      assigneeId: currentUser.id,
      status: 'Todo',
      createdAt: now,
      order: tasks.length,
      roomId: roomId,
      createdBy: currentUser.id,
      priority: newTaskPriority,
      creatorName: currentUser.name
    }
    setTasks(prev => [...prev, tempTask])

    try {
      const { data, error } = await createTask({
        room_id: roomId,
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim(),
        duration: 30,
        assignee_id: currentUser.id,
        status: 'Todo', // Will be transformed to 'pending' in supabase.ts
        order_index: tasks.length,
        created_by: currentUser.id,
        created_at: now,
        updated_at: now,
        priority: newTaskPriority
      })
      
      if (error) {
        // Remove the optimistic task if error
        setTasks(prev => prev.filter(t => t.id !== tempTask.id))
        console.error('Error creating task:', error)
        return
      }
      
      if (data) {
        // Remove the temporary task and let real-time subscription handle the real one
        setTasks(prev => prev.filter(t => t.id !== tempTask.id))
        
        setNewTaskTitle('')
        setNewTaskDescription('')
        setNewTaskPriority('Medium')
        setShowAddTask(false)
        
        // Award points for task creation
        awardTaskCompletion(30)
        
        // Set all users' statuses to 'Todo' for the new task
        if (room && room.members) {
          room.members.forEach(member => {
            upsertTaskUserStatus(data.id, member.id, member.name, 'Todo')
          })
        }
        
        // Log the activity
        await addTaskActivityLog(data.id, currentUser.id, currentUser.name, 'Created task')
      }
    } catch (error) {
      setTasks(prev => prev.filter(t => t.id !== tempTask.id))
      console.error('Error creating task:', error)
    }
  }

  const updateTaskHandler = async (taskId: string, updates: Partial<Task>) => {
    // Optimistically update the task in local state
    const prevTasks = [...tasks]
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, ...updates } : task
    ))
    
    try {
      console.log('📝 Updating task:', taskId, updates)
      const dbUpdates: any = { ...updates }
      if (updates.status) {
        dbUpdates.status = updates.status
      }
      
      const { data, error } = await updateTask(taskId, dbUpdates)
      
      if (error) {
        // Revert to previous tasks on error
        setTasks(prevTasks)
        console.error('Error updating task:', error)
        return
      }
      
      if (data) {
        // Update local state with returned data
        setTasks(prev => prev.map(task =>
          task.id === taskId ? { ...task, ...data } : task
        ))
        
        // Log the activity
        if (updates.status) {
          await addTaskActivityLog(taskId, currentUser.id, currentUser.name, `Changed status to ${updates.status}`)
        }
        
        // Award points for task completion
        if (updates.status === 'Completed') {
          awardTaskCompletion(data.duration || 30)
        }
      }
    } catch (error) {
      setTasks(prevTasks)
      console.error('Error updating task:', error)
    }
  }

  const deleteTaskHandler = async (taskId: string) => {
    const prevTasks = [...tasks]
    setTasks(prev => prev.filter(task => task.id !== taskId))
    
    try {
      const { error } = await deleteTask(taskId)
      if (error) {
        setTasks(prevTasks)
        console.error('Error deleting task:', error)
      } else {
        // Log the activity
        await addTaskActivityLog(taskId, currentUser.id, currentUser.name, 'Deleted task')
      }
    } catch (error) {
      setTasks(prevTasks)
      console.error('Error deleting task:', error)
    }
  }

  const reorderTasks = (startIndex: number, endIndex: number) => {
    const result = Array.from(tasks)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)

    // Update order index locally
    const updatedTasks = result.map((task, index) => ({ ...task, order: index }))
    setTasks(updatedTasks)

    // TODO: Persist order changes to backend if needed
    // You could batch update all task orders here
  }

  const toggleTimer = async () => {
    if (timerState.isRunning) {
      // Stop timer
      setTimerState(prev => ({ ...prev, isRunning: false }))
      if (currentSessionId.current && sessionStartTime.current) {
        // Only count focus time if mode is 'work'
        if (timerState.mode === 'work') {
          const focusTime = Math.floor((Date.now() - sessionStartTime.current.getTime()) / 1000 / 60)
          const completedTasks = tasks.filter(t => t.status === 'Completed').length
          await endStudySession(currentSessionId.current, focusTime, completedTasks)
          // Award points for focus time
          if (focusTime > 0) {
            awardPoints(focusTime * 2, 'Focus Session', 'task_complete', { duration: focusTime })
          }
        }
        currentSessionId.current = null
        sessionStartTime.current = null
      }
    } else {
      // Start timer
      setTimerState(prev => ({ ...prev, isRunning: true }))
      const { data, error } = await startFocusSession(roomId || '', currentUser?.id || '')
      if (data && !error) {
        currentSessionId.current = data.id
        sessionStartTime.current = new Date()
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
      label: undefined,
      totalElapsed: 0
    }))
  }

  const setCustomTimer = (minutes: number, mode: 'work' | 'break', label?: string, cycles?: number) => {
    setTimerState(prev => ({
      ...prev,
      minutes,
      seconds: 0,
      mode,
      label,
      totalCycles: cycles || prev.totalCycles
    }))
  }

  const onBack = () => {
    navigate('/dashboard')
  }

  return (
    <ChatProvider
      roomId={roomId || ''}
      currentUser={currentUser}
      wsUrl={(import.meta.env.VITE_SUPABASE_URL || '').replace(/^http/, 'ws')}
    >
      <StudyRoomContent
        room={room!}
        currentUser={currentUser!}
        roomId={roomId || ''}
        tasks={tasks}
        timerState={timerState}
        onBack={onBack}
        audioEnabled={audioEnabled}
        micEnabled={micEnabled}
        videoEnabled={videoEnabled}
        onToggleAudio={() => setAudioEnabled(prev => !prev)}
        onToggleMic={() => setMicEnabled(prev => !prev)}
        onToggleVideo={() => setVideoEnabled(prev => !prev)}
        showAddTask={showAddTask}
        setShowAddTask={setShowAddTask}
        newTaskTitle={newTaskTitle}
        setNewTaskTitle={setNewTaskTitle}
        newTaskDescription={newTaskDescription}
        setNewTaskDescription={setNewTaskDescription}
        newTaskPriority={newTaskPriority}
        setNewTaskPriority={setNewTaskPriority}
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
