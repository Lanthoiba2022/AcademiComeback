import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from '../components/dashboard/Sidebar'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { RoomCard } from '../components/rooms/RoomCard'
import { CreateRoomModal } from '../components/rooms/CreateRoomModal'
import { JoinRoomModal } from '../components/rooms/JoinRoomModal'
import { RoomFilters } from '../components/rooms/RoomFilters'
import { PointsNotification } from '../components/gamification/PointsNotification'
import { RankProgress } from '../components/gamification/RankProgress'
import { AchievementUnlock } from '../components/gamification/AchievementUnlock'
import { 
  Users, FileText, Calendar, TrendingUp, Clock, Star, Plus, UserPlus, 
  Search, Trophy, Target, Zap, BookOpen, Award, Flame
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useGamification } from '../hooks/useGamification'
import { 
  getRooms, getProfile, createRoom, joinRoomWithCode, createProfile,
  getUserStudyStats, subscribeToRooms, subscribeToUserStats
} from '../lib/supabase'
import { getRankProgress, getRankColor } from '../utils/roomUtils'
import { Room, RoomFilters as RoomFiltersType, User, RoomData, Profile } from '../types'

export const Dashboard = () => {
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const {
    stats: gamificationStats,
    achievements,
    pendingNotification,
    pendingAchievement,
    awardTaskCompletion,
    awardDailyStreak,
    clearNotification,
    clearAchievement
  } = useGamification()
  
  const [user, setUser] = useState<User | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [studyStats, setStudyStats] = useState({
    totalFocusMinutes: 0,
    totalSessions: 0,
    completedTasks: 0,
    activeSessions: 0,
    todayFocusMinutes: 0,
    thisWeekFocusMinutes: 0,
    currentStreakDays: 0
  })
  const [loading, setLoading] = useState(true)
  const [createRoomModal, setCreateRoomModal] = useState(false)
  const [joinRoomModal, setJoinRoomModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'discover'>('overview')
  const [filters, setFilters] = useState<RoomFiltersType>({
    search: '',
    tags: [],
    isActive: undefined,
    maxMembers: undefined
  })

  // Load user profile and rooms
  useEffect(() => {
    const loadData = async () => {
      if (!authUser) return

      try {
        // Load user profile
        const { data: profile, error: profileError } = await getProfile(authUser.id)
        
        // If profile doesn't exist, create one
        if (!profile || profileError) {
          console.log('Profile not found, creating new profile...')
          
          // Get user metadata from auth
          const fullName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User'
          
          const { data: newProfile, error: createError } = await createProfile(authUser.id, fullName, authUser.email || '')
          
          if (createError) {
            console.error('Error creating profile:', createError)
            navigate('/profile')
            return
          }
          
          if (newProfile) {
            setUser({
              id: newProfile.id,
              name: newProfile.full_name || 'User',
              email: authUser.email || '',
              avatar: newProfile.avatar_url || undefined,
              totalPoints: newProfile.total_points,
              rank: newProfile.rank,
              achievements: newProfile.achievements,
              createdAt: newProfile.created_at,
              university: newProfile.university || undefined,
              major: newProfile.major || undefined,
              year: newProfile.year || undefined,
              location: newProfile.location || undefined,
              bio: newProfile.bio || undefined
            })
          }
        } else {
          setUser({
            id: profile.id,
            name: profile.full_name || 'User',
            email: authUser.email || '',
            avatar: profile.avatar_url || undefined,
            totalPoints: profile.total_points,
            rank: profile.rank,
            achievements: profile.achievements,
            createdAt: profile.created_at,
            university: profile.university || undefined,
            major: profile.major || undefined,
            year: profile.year || undefined,
            location: profile.location || undefined,
            bio: profile.bio || undefined
          })
        }

        // Load study statistics
        await loadStudyStats()
        
        // Load rooms
        await loadRooms()
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [authUser, navigate])

  const loadStudyStats = async () => {
    if (!authUser) return
    
    try {
      const { data: stats, error } = await getUserStudyStats(authUser.id)
      
      if (error) {
        console.error('Error loading study stats:', error)
        return
      }
      
      if (stats) {
        setStudyStats({
          totalFocusMinutes: Number(stats.total_focus_minutes) || 0,
          totalSessions: Number(stats.total_sessions) || 0,
          completedTasks: Number(stats.completed_tasks) || 0,
          activeSessions: Number(stats.active_sessions) || 0,
          todayFocusMinutes: Number(stats.today_focus_minutes) || 0,
          thisWeekFocusMinutes: Number(stats.this_week_focus_minutes) || 0,
          currentStreakDays: Number(stats.current_streak_days) || 0
        })
      }
    } catch (error) {
      console.error('Error loading study stats:', error)
    }
  }

  const loadRooms = async () => {
    try {
      const { data: roomsData, error } = await getRooms(filters)
      
      if (error) {
        console.error('Error loading rooms:', error)
        setRooms([])
        return
      }
      
      if (roomsData) {
        const formattedRooms: Room[] = roomsData.map((room: RoomData) => ({
          id: room.id,
          name: room.name,
          code: room.code,
          description: room.description,
          tags: room.tags,
          members: room.members?.map(member => ({
            id: member.user?.id || '',
            name: member.user?.full_name || 'User',
            email: '',
            avatar: member.user?.avatar_url || undefined,
            totalPoints: member.user?.total_points || 0,
            rank: member.user?.rank || 'Beginner',
            achievements: member.user?.achievements || [],
            createdAt: member.user?.created_at || new Date().toISOString()
          })) || [],
          adminId: room.admin_id,
          maxMembers: room.max_members,
          isPrivate: room.is_private,
          isActive: room.is_active,
          createdAt: room.created_at,
          lastActivity: room.updated_at
        }))
        setRooms(formattedRooms)
      }
    } catch (error) {
      console.error('Error loading rooms:', error)
      setRooms([])
    }
  }

  // Reload rooms when filters change
  useEffect(() => {
    if (authUser && user) {
      loadRooms()
    }
  }, [filters, authUser, user])

  // Setup real-time subscriptions
  useEffect(() => {
    if (!authUser) return

    // Subscribe to rooms changes
    const roomsSubscription = subscribeToRooms((payload) => {
      console.log('Rooms real-time update:', payload)
      
      // Reload rooms when there are changes
      if (user) {
        loadRooms()
      }
    })

    // Subscribe to user stats changes
    const userStatsSubscription = subscribeToUserStats(authUser.id, (payload) => {
      console.log('User stats real-time update:', payload)
      
      // Reload stats when study sessions change
      if (payload.table === 'study_sessions') {
        loadStudyStats()
      }
      
      // Update user profile if it changed
      if (payload.table === 'profiles' && payload.new) {
        setUser(prev => prev ? {
          ...prev,
          totalPoints: payload.new.total_points,
          rank: payload.new.rank,
          achievements: payload.new.achievements
        } : null)
      }
    })

    return () => {
      if (roomsSubscription) {
        roomsSubscription.unsubscribe()
      }
      if (userStatsSubscription) {
        userStatsSubscription.unsubscribe()
      }
    }
  }, [authUser, user])

  if (loading) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-500 border-t-transparent"></div>
      </div>
    )
  }

  // If user is still null after loading, show error state
  if (!user) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center">
          <div className="p-8">
            <h2 className="text-xl font-semibold text-white mb-4">Profile Setup Required</h2>
            <p className="text-dark-300 mb-6">
              There was an issue setting up your profile. Please try again.
            </p>
            <div className="space-y-3">
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
              <Button variant="outline" onClick={() => navigate('/profile')}>
                Complete Profile Manually
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  const rankProgress = getRankProgress(user.totalPoints)
  const userRooms = rooms.filter(room => room.members.some(member => member.id === user.id))
  const recentRooms = userRooms.slice(0, 4)

  // Filter rooms for discovery
  const filteredRooms = rooms.filter(room => {
    if (filters.search && !room.name.toLowerCase().includes(filters.search.toLowerCase()) && 
        !room.description.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    
    if (filters.tags.length > 0 && !filters.tags.some(tag => room.tags.includes(tag))) {
      return false
    }
    
    if (filters.isActive !== undefined && room.isActive !== filters.isActive) {
      return false
    }
    
    if (filters.maxMembers !== undefined) {
      if (filters.maxMembers === 10 && room.maxMembers > 10) return false
      if (filters.maxMembers === 25 && room.maxMembers <= 10) return false
    }
    
    return true
  })

  // Convert focus time from minutes to hours for display
  const studyHours = Math.round(studyStats.totalFocusMinutes / 60 * 10) / 10 // Round to 1 decimal place
  const todayHours = Math.round(studyStats.todayFocusMinutes / 60 * 10) / 10

  const stats = [
    {
      name: 'Study Sessions',
      value: studyStats.totalSessions.toString(),
      change: studyStats.activeSessions > 0 ? `${studyStats.activeSessions} active` : 'No active sessions',
      icon: Users,
      color: 'text-primary-400'
    },
    {
      name: 'Total Points',
      value: gamificationStats?.totalPoints.toLocaleString() || '0',
      change: `${gamificationStats?.currentRank.name || 'Beginner'} rank`,
      icon: Trophy,
      color: 'text-secondary-400'
    },
    {
      name: 'Focus Time',
      value: `${studyHours}h`,
      change: `${todayHours}h today`,
      icon: Clock,
      color: 'text-accent-400'
    },
    {
      name: 'Study Streak',
      value: `${studyStats.currentStreakDays}d`,
      change: studyStats.currentStreakDays > 0 ? 'Keep it up!' : 'Start today!',
      icon: Flame,
      color: 'text-primary-400'
    }
  ]

  const handleCreateRoom = async (roomData: any) => {
    try {
      const { data, error } = await createRoom({
        ...roomData,
        admin_id: user.id
      })
      
      if (error) {
        console.error('Error creating room:', error)
        return
      }
      
      if (data) {
        // Room will be updated via real-time subscription
        setCreateRoomModal(false)
        
        // Navigate to the new room
        navigate(`/room/${data.id}`)
      }
    } catch (error) {
      console.error('Error creating room:', error)
    }
  }

  const handleJoinRoom = async (code: string) => {
    try {
      const { data, error } = await joinRoomWithCode(code, user.id)
      
      if (error) {
        console.error('Error joining room:', error)
        return
      }
      
      if (data?.room_id) {
        setJoinRoomModal(false)
        
        // Navigate to the room
        navigate(`/room/${data.room_id}`)
      }
    } catch (error) {
      console.error('Error joining room:', error)
    }
  }

  const handleJoinRoomById = async (roomId: string) => {
    try {
      // For direct room joins (from room cards), we still use the old method
      // since we already have the room ID
      navigate(`/room/${roomId}`)
    } catch (error) {
      console.error('Error joining room:', error)
    }
  }

  const handleViewRoom = (roomId: string) => {
    navigate(`/room/${roomId}`)
  }

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Sidebar />
      
      <div className="lg:ml-64 p-4 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                Welcome back, {user.name.split(' ')[0]}!
              </h1>
              <p className="text-dark-300">Ready to continue your learning journey?</p>
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-3">
              <Button
                onClick={() => setCreateRoomModal(true)}
                icon={Plus}
                size="lg"
                className="flex-1 lg:flex-none"
              >
                Create Room
              </Button>
              <Button
                onClick={() => setJoinRoomModal(true)}
                variant="outline"
                icon={UserPlus}
                size="lg"
                className="flex-1 lg:flex-none"
              >
                Join Room
              </Button>
            </div>
          </div>
        </div>

        {/* Gamification Section */}
        {gamificationStats && (
          <div className="mb-8">
            <RankProgress
              currentRank={gamificationStats.currentRank}
              nextRank={gamificationStats.nextRank}
              currentPoints={gamificationStats.totalPoints}
              progressPercentage={gamificationStats.progressToNextRank}
              showDetails={false}
            />
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-dark-400 mb-1">{stat.name}</p>
                  <p className="text-lg lg:text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs lg:text-sm text-accent-400">{stat.change}</p>
                </div>
                <div className={`p-2 lg:p-3 bg-dark-800 rounded-xl ${stat.color}`}>
                  <stat.icon className="w-4 h-4 lg:w-6 lg:h-6" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Recent Achievements */}
        {gamificationStats && gamificationStats.achievements.length > 0 && (
          <Card className="mb-8 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Recent Achievements</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/achievements')}>
                View All
              </Button>
            </div>
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {gamificationStats.achievements.slice(0, 5).map((achievement, index) => (
                <div
                  key={achievement.id}
                  className="flex-shrink-0 text-center p-3 bg-dark-800/50 rounded-lg"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-primary-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-medium text-white">{achievement.name}</p>
                  <p className="text-xs text-accent-400">+{achievement.points} pts</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 lg:px-6 py-3 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                : 'text-dark-300 hover:text-white hover:bg-dark-800'
            }`}
          >
            My Rooms
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-4 lg:px-6 py-3 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
              activeTab === 'discover'
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                : 'text-dark-300 hover:text-white hover:bg-dark-800'
            }`}
          >
            Discover Rooms
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' ? (
          <div className="space-y-8">
            {/* Recent Rooms */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl lg:text-2xl font-semibold text-white">Your Study Rooms</h2>
                {userRooms.length > 4 && (
                  <Button variant="ghost" size="sm">
                    View All ({userRooms.length})
                  </Button>
                )}
              </div>
              
              {recentRooms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                  {recentRooms.map((room, index) => (
                    <div
                      key={room.id}
                      className="animate-slide-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <RoomCard
                        room={room}
                        onJoinRoom={handleJoinRoomById}
                        onViewRoom={handleViewRoom}
                        currentUserId={user.id}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-dark-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Study Rooms Yet</h3>
                  <p className="text-dark-300 mb-6">
                    Create your first study room or join an existing one to get started
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <Button onClick={() => setCreateRoomModal(true)} icon={Plus}>
                      Create Room
                    </Button>
                    <Button onClick={() => setJoinRoomModal(true)} variant="outline" icon={UserPlus}>
                      Join Room
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            {/* Quick Actions Grid */}
            <div>
              <h2 className="text-xl lg:text-2xl font-semibold text-white mb-6">Quick Actions</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setCreateRoomModal(true)}
                  className="p-4 lg:p-6 bg-dark-800/50 rounded-lg hover:bg-dark-800/70 transition-colors duration-200 text-center group"
                >
                  <Plus className="w-6 lg:w-8 h-6 lg:h-8 text-primary-400 mx-auto mb-3 group-hover:scale-110 transition-transform duration-200" />
                  <p className="text-white font-medium text-sm lg:text-base">Create Room</p>
                  <p className="text-xs lg:text-sm text-dark-400">Start a new study session</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('discover')}
                  className="p-4 lg:p-6 bg-dark-800/50 rounded-lg hover:bg-dark-800/70 transition-colors duration-200 text-center group"
                >
                  <Search className="w-6 lg:w-8 h-6 lg:h-8 text-secondary-400 mx-auto mb-3 group-hover:scale-110 transition-transform duration-200" />
                  <p className="text-white font-medium text-sm lg:text-base">Discover</p>
                  <p className="text-xs lg:text-sm text-dark-400">Find study partners</p>
                </button>
                
                <button 
                  onClick={() => navigate('/under-development')}
                  className="p-4 lg:p-6 bg-dark-800/50 rounded-lg hover:bg-dark-800/70 transition-colors duration-200 text-center group"
                >
                  <FileText className="w-6 lg:w-8 h-6 lg:h-8 text-accent-400 mx-auto mb-3 group-hover:scale-110 transition-transform duration-200" />
                  <p className="text-white font-medium text-sm lg:text-base">My Notes</p>
                  <p className="text-xs lg:text-sm text-dark-400">Access your notes</p>
                </button>
                
                <button 
                  onClick={() => navigate('/under-development')}
                  className="p-4 lg:p-6 bg-dark-800/50 rounded-lg hover:bg-dark-800/70 transition-colors duration-200 text-center group"
                >
                  <Target className="w-6 lg:w-8 h-6 lg:h-8 text-primary-400 mx-auto mb-3 group-hover:scale-110 transition-transform duration-200" />
                  <p className="text-white font-medium text-sm lg:text-base">Goals</p>
                  <p className="text-xs lg:text-sm text-dark-400">Track your progress</p>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Filters */}
            <Card>
              <RoomFilters filters={filters} onFiltersChange={setFilters} />
            </Card>

            {/* Rooms Grid */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl lg:text-2xl font-semibold text-white">
                  Discover Study Rooms
                  <span className="text-base lg:text-lg text-dark-400 ml-2">
                    ({filteredRooms.length} rooms)
                  </span>
                </h2>
              </div>
              
              {filteredRooms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                  {filteredRooms.map((room, index) => (
                    <div
                      key={room.id}
                      className="animate-slide-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <RoomCard
                        room={room}
                        onJoinRoom={handleJoinRoomById}
                        onViewRoom={handleViewRoom}
                        currentUserId={user.id}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <Search className="w-16 h-16 text-dark-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Rooms Found</h3>
                  <p className="text-dark-300 mb-6">
                    Try adjusting your filters or create a new room
                  </p>
                  <Button onClick={() => setCreateRoomModal(true)} icon={Plus}>
                    Create New Room
                  </Button>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateRoomModal
        isOpen={createRoomModal}
        onClose={() => setCreateRoomModal(false)}
        onCreateRoom={handleCreateRoom}
      />
      
      <JoinRoomModal
        isOpen={joinRoomModal}
        onClose={() => setJoinRoomModal(false)}
        onJoinRoom={handleJoinRoom}
      />

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