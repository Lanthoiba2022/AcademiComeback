import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from '../components/dashboard/Sidebar'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { RoomCard } from '../components/rooms/RoomCard'
import { CreateRoomModal } from '../components/rooms/CreateRoomModal'
import { JoinRoomModal } from '../components/rooms/JoinRoomModal'
import { RoomFilters } from '../components/rooms/RoomFilters'
import { 
  Users, FileText, Calendar, TrendingUp, Clock, Star, Plus, UserPlus, 
  Search, Trophy, Target, Zap, BookOpen 
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getRooms, getProfile, createRoom, getRoomByCode, joinRoom } from '../lib/supabase'
import { getRankProgress, getRankColor } from '../utils/roomUtils'
import { Room, RoomFilters as RoomFiltersType, User, RoomData, Profile } from '../types'

export const Dashboard = () => {
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  
  const [user, setUser] = useState<User | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
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
        
        // If profile doesn't exist, redirect to profile page
        if (!profile || profileError) {
          console.log('Profile not found, redirecting to profile page')
          navigate('/profile')
          return
        }

        if (profile) {
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

        // Load rooms - temporarily disabled due to RLS policy issue
        // await loadRooms()
      } catch (error) {
        console.error('Error loading dashboard data:', error)
        // If there's an error loading profile, redirect to profile page
        navigate('/profile')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [authUser, navigate])

  const loadRooms = async () => {
    try {
      const { data: roomsData, error } = await getRooms(filters)
      
      // Handle the infinite recursion error gracefully
      if (error) {
        console.error('Error loading rooms (likely RLS policy issue):', error)
        setRooms([]) // Set empty array to prevent crashes
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
            id: member.user.id,
            name: member.user.full_name || 'User',
            email: '',
            avatar: member.user.avatar_url || undefined,
            totalPoints: member.user.total_points,
            rank: member.user.rank,
            achievements: member.user.achievements,
            createdAt: member.user.created_at
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
      setRooms([]) // Set empty array to prevent crashes
    }
  }

  // Reload rooms when filters change - temporarily disabled
  useEffect(() => {
    if (authUser && user) {
      // loadRooms() - Temporarily disabled due to RLS policy issue
    }
  }, [filters, authUser, user])

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
              Please complete your profile setup to access the dashboard.
            </p>
            <Button onClick={() => navigate('/profile')}>
              Complete Profile
            </Button>
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

  const stats = [
    {
      name: 'Study Sessions',
      value: userRooms.length.toString(),
      change: '+2 this week',
      icon: Users,
      color: 'text-primary-400'
    },
    {
      name: 'Total Points',
      value: user.totalPoints.toLocaleString(),
      change: `${rankProgress.current} rank`,
      icon: Trophy,
      color: 'text-secondary-400'
    },
    {
      name: 'Study Hours',
      value: '127',
      change: '+8.1% this week',
      icon: Clock,
      color: 'text-accent-400'
    },
    {
      name: 'Achievements',
      value: user.achievements.length.toString(),
      change: 'Latest: Helper',
      icon: Star,
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
        await loadRooms() // Reload rooms
        setCreateRoomModal(false)
      }
    } catch (error) {
      console.error('Error creating room:', error)
    }
  }

  const handleJoinRoom = async (code: string) => {
    try {
      const { data: room, error } = await getRoomByCode(code)
      if (error || !room) {
        console.error('Error finding room:', error)
        return
      }
      
      await joinRoom(room.id, user.id)
      await loadRooms() // Reload rooms
      setJoinRoomModal(false)
    } catch (error) {
      console.error('Error joining room:', error)
    }
  }

  const handleJoinRoomById = async (roomId: string) => {
    try {
      await joinRoom(roomId, user.id)
      await loadRooms() // Reload rooms
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

        {/* User Progress Card */}
        <Card className="mb-8 animate-slide-up">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary-500 flex items-center justify-center text-white text-xl font-bold">
                    {user.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">{user.name}</h3>
                <p className={`text-sm font-medium ${getRankColor(user.rank)}`}>
                  {user.rank} • {user.totalPoints.toLocaleString()} points
                </p>
              </div>
            </div>
            
            <div className="flex-1 max-w-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-dark-300">Progress to {rankProgress.next}</span>
                <span className="text-sm text-primary-400">{Math.round(rankProgress.progress)}%</span>
              </div>
              <div className="w-full bg-dark-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${rankProgress.progress}%` }}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              {user.achievements.slice(0, 3).map((achievement, index) => (
                <div
                  key={achievement}
                  className="w-8 h-8 bg-accent-500/20 rounded-full flex items-center justify-center"
                  title={achievement}
                >
                  <Star className="w-4 h-4 text-accent-400" />
                </div>
              ))}
            </div>
          </div>
        </Card>

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

        {/* Database Issue Notice */}
        {rooms.length === 0 && (
          <Card className="mb-6 border-l-4 border-yellow-500">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-400">Database Configuration Issue</h3>
                  <div className="mt-2 text-sm text-yellow-300">
                    <p>Room loading is temporarily disabled due to a database policy configuration issue. Please check your Supabase RLS policies for the room_members table.</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

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
    </div>
  )
}