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
import { mockRooms, mockUser } from '../data/mockData'
import { Task, ChatMessage, StudySession } from '../types'
import { TaskItem } from '../components/room/TaskItem'
import { ChatArea } from '../components/room/ChatArea'
import { MemberList } from '../components/room/MemberList'
import { TimerControls } from '../components/room/TimerControls'
import { RoomHeader } from '../components/room/RoomHeader'

export const StudyRoom = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  
  // Find room data
  const room = mockRooms.find(r => r.id === roomId)
  const currentUser = mockUser

  // State management
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Review JavaScript Closures',
      description: 'Go through closure examples and practice problems',
      duration: 45,
      assigneeId: currentUser.id,
      status: 'in-progress',
      createdAt: new Date().toISOString(),
      order: 0
    },
    {
      id: '2',
      title: 'Complete Array Methods Exercise',
      description: 'Practice map, filter, reduce methods',
      duration: 30,
      assigneeId: '2',
      status: 'pending',
      createdAt: new Date().toISOString(),
      order: 1
    },
    {
      id: '3',
      title: 'Study Async/Await Patterns',
      description: 'Learn modern asynchronous JavaScript',
      duration: 60,
      assigneeId: '3',
      status: 'completed',
      createdAt: new Date().toISOString(),
      order: 2
    }
  ])

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      userId: '2',
      userName: 'Sarah Chen',
      userAvatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      message: 'Hey everyone! Ready to tackle these JavaScript concepts?',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      type: 'message'
    },
    {
      id: '2',
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      message: 'Absolutely! I\'m working on the closures section now.',
      timestamp: new Date(Date.now() - 120000).toISOString(),
      type: 'message'
    }
  ])

  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showAddTask, setShowAddTask] = useState(false)
  
  // Timer state
  const [timerState, setTimerState] = useState({
    minutes: 25,
    seconds: 0,
    isRunning: false,
    mode: 'work' as 'work' | 'break',
    cycle: 1,
    totalCycles: 4
  })

  const [studySession, setStudySession] = useState<StudySession>({
    id: '1',
    roomId: roomId || '',
    startTime: new Date().toISOString(),
    participants: room?.members || [],
    totalFocusTime: 0,
    completedTasks: 0,
    isActive: true
  })

  // Audio settings
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [micEnabled, setMicEnabled] = useState(false)
  const [videoEnabled, setVideoEnabled] = useState(false)

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout>()

  // Redirect if room not found
  if (!room) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
        <Card className="text-center p-8">
          <h2 className="text-xl font-semibold text-white mb-4">Room Not Found</h2>
          <p className="text-dark-300 mb-6">The study room you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

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
              // Play notification sound (mock)
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

  // Task management functions
  const addTask = () => {
    if (!newTaskTitle.trim()) return

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      description: '',
      duration: 30,
      assigneeId: currentUser.id,
      status: 'pending',
      createdAt: new Date().toISOString(),
      order: tasks.length
    }

    setTasks(prev => [...prev, newTask])
    setNewTaskTitle('')
    setShowAddTask(false)

    // Add system message
    addSystemMessage(`${currentUser.name} added a new task: "${newTaskTitle}"`)
  }

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ))

    // Add system message for status changes
    if (updates.status) {
      const task = tasks.find(t => t.id === taskId)
      const assignee = room.members.find(m => m.id === task?.assigneeId)
      addSystemMessage(`${assignee?.name || 'Someone'} marked "${task?.title}" as ${updates.status}`)
    }
  }

  const deleteTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    setTasks(prev => prev.filter(t => t.id !== taskId))
    addSystemMessage(`Task "${task?.title}" was deleted`)
  }

  const reorderTasks = (startIndex: number, endIndex: number) => {
    const result = Array.from(tasks)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)
    
    // Update order property
    const reorderedTasks = result.map((task, index) => ({
      ...task,
      order: index
    }))
    
    setTasks(reorderedTasks)
  }

  // Chat functions
  const sendMessage = () => {
    if (!newMessage.trim()) return

    const message: ChatMessage = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      message: newMessage,
      timestamp: new Date().toISOString(),
      type: 'message'
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')
    setIsTyping(false)
  }

  const addSystemMessage = (message: string) => {
    const systemMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: 'system',
      userName: 'System',
      message,
      timestamp: new Date().toISOString(),
      type: 'system'
    }

    setMessages(prev => [...prev, systemMessage])
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
                    onUpdate={updateTask}
                    onDelete={deleteTask}
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