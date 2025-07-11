import { useState, useEffect, useCallback } from 'react'
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
  getUserStudyStats, subscribeToRooms, subscribeToUserStats, joinRoom,
  getUserGoals, addUserGoal, updateUserGoal, completeUserGoal
} from '../lib/supabase'
import { getRankProgress, getRankColor } from '../utils/roomUtils'
import { Room, RoomFilters as RoomFiltersType, User, RoomData, Profile } from '../types'
import { StudyStreakCard } from '../components/dashboard/StudyStreakCard'
import { StudyHeatmap } from '../components/dashboard/StudyHeatmap'
import { StudyHeatmapModal } from '../components/dashboard/StudyHeatmapModal'
import { useStudyStreak } from '../hooks/useStudyStreak'
import { getTodayStudyMinutes } from '../lib/supabase'
import { Modal } from '../components/ui/Modal'
import { Goal } from '../components/ui/Goal'
import { GoalForm } from '../components/ui/GoalForm'
import { StudyGoal } from '../types/analytics'

// Add local uuidv4 generator
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

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
    currentStreakDays: 0,
    joinedRoomsCount: 0,
    totalTasksCount: 0,
    totalVisitDays: 0
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

  const [showHeatmapModal, setShowHeatmapModal] = useState(false)
  const [todayStudyMinutes, setTodayStudyMinutes] = useState(0)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

  const {
    streakData,
    streakStats,
    loading: streakLoading,
    error: streakError,
    loadStreakData: refreshStreak
  } = useStudyStreak(authUser?.id || '', studyStats.totalFocusMinutes, user?.createdAt)

  // Debug log to verify streak stats
  console.log('Dashboard - streakStats:', streakStats, 'user?.id:', authUser?.id)

  const loadTodayMinutes = async () => {
    if (!authUser) return
    
    const { data } = await getTodayStudyMinutes(authUser.id)
    setTodayStudyMinutes(data || 0)
  }

  useEffect(() => {
    if (authUser) {
      loadTodayMinutes()
    }
  }, [authUser])

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
        
        // Calculate total days since signup
        const createdAt = profile?.created_at || user?.createdAt;
        setStudyStats(prev => ({ ...prev, totalVisitDays: calculateTotalVisitDays(createdAt) }));
        
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
          currentStreakDays: Number(stats.current_streak_days) || 0,
          joinedRoomsCount: Number(stats.joined_rooms_count) || 0,
          totalTasksCount: Number(stats.total_tasks_count) || 0,
          totalVisitDays: Number(stats.total_visit_days) || 0
        })
      }
    } catch (error) {
      console.error('Error loading study stats:', error)
    }
  }

  const loadRooms = useCallback(async () => {
    if (!authUser) return
    try {
      const { data: roomsData, error } = await getRooms(filters)
      if (error) {
        console.error('Error loading rooms:', error)
        setRooms([])
        return
      }
      if (roomsData) {
        const formattedRooms: Room[] = roomsData.map((room: any) => ({
          id: room.id,
          name: room.name,
          code: room.code,
          description: room.description,
          tags: room.tags,
          members: room.members?.map((member: any) => ({
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
        setRooms(formattedRooms.slice(0, 20)) // Only keep the most recent 20 rooms
      }
    } catch (error) {
      console.error('Error loading rooms:', error)
      setRooms([])
    }
  }, [filters, authUser, user])

  // Reload rooms when filters change
  useEffect(() => {
    if (authUser && user) {
      loadRooms()
    }
  }, [loadRooms])

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
        console.log('Study session changed, refreshing data...')
        loadStudyStats()
        // Refresh study streak data when study sessions change
        refreshStreak()
        // Reload today's study minutes
        loadTodayMinutes()
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

  // Add goals state
  const [goals, setGoals] = useState<StudyGoal[]>([])
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<StudyGoal | null>(null)

  // Only show incomplete goals in dashboard
  const activeGoals = goals.filter(g => !g.iscompleted)

  // Fetch goals from Supabase for this user (refetch after add/edit/complete)
  const fetchGoals = useCallback(async () => {
    if (!user) return;
    const { data, error } = await getUserGoals(user.id);
    if (error) {
      console.error('Supabase getUserGoals error:', error);
      alert('Failed to fetch goals: ' + error.message);
    }
    if (!error && Array.isArray(data)) {
      setGoals(data);
    }
  }, [user]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Add or update goal
  const handleSaveGoal = async (goal: Partial<StudyGoal>) => {
    if (!user) return;
    if (editingGoal) {
      // Update in Supabase
      const updatedGoal = { ...editingGoal, ...goal };
      await updateUserGoal(user.id, updatedGoal);
      setShowGoalForm(false);
      setEditingGoal(null);
      fetchGoals();
    } else {
      // Add to Supabase (let Supabase generate the id)
      // Remove id if present
      const { id, ...goalWithoutId } = goal;
      const newGoal: Omit<StudyGoal, 'id'> = {
        ...goalWithoutId,
        current: 0,
        iscompleted: false,
        createdat: new Date().toISOString(),
        userid: user.id,
      } as Omit<StudyGoal, 'id'>;
      const { data, error } = await addUserGoal(user.id, newGoal);
      if (error) {
        console.error('Supabase addUserGoal error:', error);
        alert('Failed to add goal: ' + error.message);
      }
      setShowGoalForm(false);
      setEditingGoal(null);
      fetchGoals();
    }
  };

  // Edit goal
  const handleEditGoal = (goal: StudyGoal) => {
    setEditingGoal(goal)
    setShowGoalForm(true)
  }

  // Mark goal as complete
  const handleCompleteGoal = async (goal: StudyGoal) => {
    if (!user) return;
    await completeUserGoal(user.id, goal.id);
    fetchGoals(); // Always reload from DB
  };

  // Helper to calculate total days since signup
  const calculateTotalVisitDays = (createdAt: string | undefined) => {
    if (!createdAt) return 1;
    const signupDate = new Date(createdAt);
    const today = new Date();
    today.setHours(0,0,0,0);
    signupDate.setHours(0,0,0,0);
    const diff = Math.floor((today.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24));
    return diff + 1;
  };

  // Helper to refresh streak and stats together
  const handleRefreshStreak = async () => {
    await loadStudyStats(); // update studyStats (including totalFocusMinutes)
    // Recalculate totalVisitDays after refresh
    const createdAt = user?.createdAt;
    setStudyStats(prev => ({ ...prev, totalVisitDays: calculateTotalVisitDays(createdAt) }));
    refreshStreak(); // then refresh streak with latest totalFocusMinutes
  }

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
  // Limit filteredRooms to 20 for rendering
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
  }).slice(0, 20)

  // Convert focus time from minutes to hours for display
  const studyHours = Math.round(studyStats.totalFocusMinutes / 60 * 10) / 10 // Round to 1 decimal place
  const todayMinutes = studyStats.todayFocusMinutes;
  const todayH = Math.floor(todayMinutes / 60);
  const todayM = todayMinutes % 60;
  const todayFormatted = `${todayH}h ${todayM}m`;

  const stats = [
    {
      name: 'Study Sessions',
      value: studyStats.joinedRoomsCount.toString(),
      change: studyStats.totalTasksCount > 0 ? `${studyStats.totalTasksCount} tasks` : 'No tasks',
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
      change: (
        <span>
          <span className="font-medium text-accent-400">{todayFormatted}</span> <span className="text-dark-400">today</span>
        </span>
      ),
      icon: Clock,
      color: 'text-accent-400'
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
        
        // Navigate to the room, passing the new member data to ensure
        // the user is immediately recognized as a member.
        navigate(`/room/${data.room_id}`, { state: { newMember: data.member } })
      }
    } catch (error) {
      console.error('Error joining room:', error)
    }
  }

  const handleJoinRoomById = async (roomId: string) => {
    if (!user) return

    try {
      // Use joinRoom for direct joins by roomId (public rooms)
      const { data, error } = await joinRoom(roomId, user.id)
      if (error) {
        console.error('Error joining room:', error)
        return
      }
      navigate(`/room/${roomId}`)
    } catch (error) {
      console.error('Error joining room:', error)
    }
  }

  const handleViewRoom = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId)
    if (room) {
      // Check if the current user is a member
      const isMember = room.members.some(member => member.id === user?.id)
      if (isMember) {
        navigate(`/room/${roomId}`)
        return
      }
      setSelectedRoom(room)
      setDetailsModalOpen(true)
    }
  }

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Sidebar />
      
      <div className="min-h-screen bg-hero-gradient lg:ml-64 p-2 sm:p-4 lg:p-8">
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
          <div className="mb-6 sm:mb-8">
            <RankProgress
              currentRank={gamificationStats.currentRank}
              nextRank={gamificationStats.nextRank}
              currentPoints={gamificationStats.totalPoints}
              progressPercentage={gamificationStats.progressToNextRank}
              showDetails={false}
            />
          </div>
        )}

        {/* Goals Section */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <Card className="p-0 bg-gradient-to-br from-dark-800/80 to-dark-900/90 shadow-2xl border-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 pt-6 pb-2 gap-2">
              <div className="flex items-center gap-3">
                <Target className="w-7 h-7 text-primary-400" />
                <h3 className="text-xl font-bold text-white tracking-tight">Your Active Study Goals</h3>
              </div>
              <Button size="lg" icon={Target} className="bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg hover:scale-105 transition-transform" onClick={() => { setShowGoalForm(true); setEditingGoal(null); }}>
                Add Goal
              </Button>
            </div>
            {activeGoals.length === 0 && (
              <div className="text-dark-300 text-center py-10 text-lg">No active goals. Add a new goal to get started!</div>
            )}
            <div className={`flex flex-row gap-4 px-6 pb-6 overflow-x-auto scrollbar-thin scrollbar-thumb-dark-700 scrollbar-track-dark-900 ${activeGoals.length === 1 ? 'justify-stretch' : ''}`}>
              {activeGoals.map(goal => (
                <div className={activeGoals.length === 1 ? 'w-full' : 'min-w-[340px] max-w-full flex-shrink-0'} key={goal.id}>
                  <Goal goal={goal} onEdit={handleEditGoal} onComplete={handleCompleteGoal} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8 overflow-x-auto scrollbar-hidden">
          {stats.map((stat, index) => (
            <div key={index} className="animate-slide-up min-w-[140px]" style={{ animationDelay: `${index * 0.1}s` }}>
              <Card className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-dark-400 mb-1">{stat.name}</p>
                    <p className="text-base sm:text-lg font-bold text-white">{stat.value}</p>
                    {typeof stat.change === 'string' ? (
                      <p className="text-xs sm:text-sm text-accent-400">{stat.change}</p>
                    ) : (
                      <div className="text-xs sm:text-sm">{stat.change}</div>
                    )}
                  </div>
                  <div className={`p-2 sm:p-3 bg-dark-800 rounded-xl ${stat.color}`}>
                    <stat.icon className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                </div>
              </Card>
            </div>
          ))}
          {/* Add Study Days as a fourth stat */}
          <div className="animate-slide-up min-w-[140px]" style={{ animationDelay: `${stats.length * 0.1}s` }}>
            <Card className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-dark-400 mb-1">Study Days</p>
                  <p className="text-base sm:text-lg font-bold text-white">{streakStats.totalStudyDays}</p>
                  <div className="text-xs sm:text-sm text-accent-400">Days with activity</div>
                </div>
                <div className="p-2 sm:p-3 bg-dark-800 rounded-xl text-primary-400">
                  <Calendar className="w-4 h-4 sm:w-6 sm:h-6" />
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="mb-6 sm:mb-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <StudyStreakCard
            streakStats={streakStats}
            todayMinutes={todayMinutes}
            totalVisitDays={studyStats.totalVisitDays}
            loading={streakLoading}
            error={streakError}
            onRefresh={handleRefreshStreak}
            onViewHeatmap={() => setShowHeatmapModal(true)}
          />
        </div>

        {/* Show heatmap only below streak card */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <StudyHeatmap data={Array.isArray(streakData) ? streakData : []} />
        </div>

        {/* Recent Achievements */}
        {gamificationStats && gamificationStats.achievements.length > 0 && (
          <Card className="mb-6 sm:mb-8 animate-slide-up p-3 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-white">Recent Achievements</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/achievements')}>
                View All
              </Button>
            </div>
            <div className="flex space-x-3 sm:space-x-4 overflow-x-auto pb-2 custom-scrollbar">
              {gamificationStats.achievements.slice(0, 5).map((achievement, index) => (
                <div
                  key={achievement.id}
                  className="flex-shrink-0 text-center p-2 sm:p-3 bg-dark-800/50 rounded-lg min-w-[120px]"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-accent-500 to-primary-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Award className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-white">{achievement.name}</p>
                  <p className="text-xs text-accent-400">+{achievement.points} pts</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-4 sm:mb-6 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                : 'text-dark-300 hover:text-white hover:bg-dark-800'
            }`}
          >
            My Rooms
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
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
          <div className="space-y-6 sm:space-y-8">
            {/* Recent Rooms */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white">Your Study Rooms</h2>
                {userRooms.length > 4 && (
                  <Button variant="ghost" size="sm">
                    View All ({userRooms.length})
                  </Button>
                )}
              </div>
              {recentRooms.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
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
                <Card className="text-center py-8 sm:py-12">
                  <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-dark-400 mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No Study Rooms Yet</h3>
                  <p className="text-dark-300 mb-6">
                    Create your first study room or join an existing one to get started
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
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
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white mb-4 sm:mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4">
                <button
                  onClick={() => setCreateRoomModal(true)}
                  className="p-3 sm:p-4 lg:p-6 bg-dark-800/50 rounded-lg hover:bg-dark-800/70 transition-colors duration-200 text-center group"
                >
                  <Plus className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-primary-400 mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-200" />
                  <p className="text-xs sm:text-sm lg:text-base text-white font-medium">Create Room</p>
                  <p className="text-xs text-dark-400">Start a new study session</p>
                </button>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="p-3 sm:p-4 lg:p-6 bg-dark-800/50 rounded-lg hover:bg-dark-800/70 transition-colors duration-200 text-center group"
                >
                  <Search className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-secondary-400 mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-200" />
                  <p className="text-xs sm:text-sm lg:text-base text-white font-medium">Discover</p>
                  <p className="text-xs text-dark-400">Find study partners</p>
                </button>
                <button 
                  onClick={() => navigate('/notes')}
                  className="p-3 sm:p-4 lg:p-6 bg-dark-800/50 rounded-lg hover:bg-dark-800/70 transition-colors duration-200 text-center group"
                >
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-accent-400 mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-200" />
                  <p className="text-xs sm:text-sm lg:text-base text-white font-medium">My Notes</p>
                  <p className="text-xs text-dark-400">Access your notes</p>
                </button>
                <button 
                  onClick={() => navigate('/under-development')}
                  className="p-3 sm:p-4 lg:p-6 bg-dark-800/50 rounded-lg hover:bg-dark-800/70 transition-colors duration-200 text-center group"
                >
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-primary-400 mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-200" />
                  <p className="text-xs sm:text-sm lg:text-base text-white font-medium">Goals</p>
                  <p className="text-xs text-dark-400">Track your progress</p>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Filters */}
            <Card>
              <RoomFilters filters={filters} onFiltersChange={setFilters} />
            </Card>
            {/* Rooms Grid */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white">
                  Discover Study Rooms
                  <span className="text-base sm:text-lg text-dark-400 ml-2">
                    ({filteredRooms.length} rooms)
                  </span>
                </h2>
              </div>
              {filteredRooms.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
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
                <Card className="text-center py-8 sm:py-12">
                  <Search className="w-12 h-12 sm:w-16 sm:h-16 text-dark-400 mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No Rooms Found</h3>
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

      {/* Room Details Modal */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title={selectedRoom?.name || 'Room Details'}
        size="md"
        titleClassName="text-3xl font-bold text-white"
      >
        {selectedRoom && (
          <div className="space-y-4">
            <div>
              <p className="text-dark-200 mb-2">{selectedRoom.description}</p>
            </div>
            <div>
              <span className="font-semibold text-white">Tags: </span>
              {selectedRoom.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedRoom.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center px-2 py-1 bg-primary-500/20 text-primary-300 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-dark-400">No tags</span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="font-semibold text-white">Members:</span>
              <span className="text-dark-200">{selectedRoom.members.length} / {selectedRoom.maxMembers}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-semibold text-white">Room Code:</span>
              <span className="text-dark-200">{selectedRoom.code}</span>
            </div>
          </div>
        )}
      </Modal>

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

      {/* Study Heatmap Modal */}
      <StudyHeatmapModal
        isOpen={showHeatmapModal}
        onClose={() => setShowHeatmapModal(false)}
        data={streakData}
        streakStats={streakStats}
      />

      {/* Goal Form Modal */}
      <Modal isOpen={showGoalForm} onClose={() => { setShowGoalForm(false); setEditingGoal(null); }} title={editingGoal ? 'Edit Goal' : 'Add Goal'}>
        <GoalForm initialGoal={editingGoal || {}} onSave={handleSaveGoal} onCancel={() => { setShowGoalForm(false); setEditingGoal(null); }} />
      </Modal>
    </div>
  )
}