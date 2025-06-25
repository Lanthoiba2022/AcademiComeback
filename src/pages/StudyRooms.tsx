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
  Users, Plus, UserPlus, Search, BookOpen, Sparkles, 
  Crown, Star, Clock, Users2, Target, Zap, TrendingUp,
  Filter, Grid, List, RefreshCw, Rocket, Lightbulb
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { 
  getRooms, getProfile, createRoom, joinRoomWithCode, createProfile,
  subscribeToRooms, subscribeToUserStats, joinRoom
} from '../lib/supabase'
import { Room, RoomFilters as RoomFiltersType, User, Profile, RoomData } from '../types'
import { Modal } from '../components/ui/Modal'

export const StudyRooms = () => {
  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  
  const [user, setUser] = useState<User | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [createRoomModal, setCreateRoomModal] = useState(false)
  const [joinRoomModal, setJoinRoomModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'my-rooms' | 'discover'>('my-rooms')
  const [filters, setFilters] = useState<RoomFiltersType>({
    search: '',
    tags: [],
    isActive: undefined,
    maxMembers: undefined
  })
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

  useEffect(() => {
    const initializeUser = async () => {
      if (!authUser) return

      try {
        // Get or create user profile
        let { data: profile } = await getProfile(authUser.id)
        
        if (!profile) {
          const { data: newProfile } = await createProfile(
            authUser.id,
            authUser.user_metadata?.full_name || 'Anonymous User',
            authUser.email || ''
          )
          profile = newProfile
        }

        if (profile) {
          setUser(profile)
        }
      } catch (error) {
        console.error('Error initializing user:', error)
      }
    }

    initializeUser()
  }, [authUser])

  const loadRooms = async () => {
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
        setRooms(formattedRooms)
      }
    } catch (error) {
      console.error('Error loading rooms:', error)
      setRooms([])
    } finally {
      setLoading(false)
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

  const handleCreateRoom = async (roomData: any) => {
    if (!user) return

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
        setCreateRoomModal(false)
        navigate(`/room/${data.id}`)
      }
    } catch (error) {
      console.error('Error creating room:', error)
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
      setSelectedRoom(room)
      setDetailsModalOpen(true)
    }
  }

  const handleJoinRoom = async (roomCode: string) => {
    if (!user) return

    try {
      const { data, error } = await joinRoomWithCode(roomCode, user.id)
      
      if (error) {
        console.error('Error joining room:', error)
        return
      }
      
      if (data) {
        setJoinRoomModal(false)
        navigate(`/room/${data.room_id}`)
      }
    } catch (error) {
      console.error('Error joining room:', error)
    }
  }

  const handleEnterRoom = (roomId: string) => {
    navigate(`/room/${roomId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-hero-gradient">
        <Sidebar />
        <div className="lg:ml-64 p-4 lg:p-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-500 border-t-transparent"></div>
          </div>
        </div>
      </div>
    )
  }

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

  const userRooms = rooms.filter(room => room.members.some(member => member.id === user.id))
  const adminRooms = userRooms.filter(room => room.adminId === user.id)
  const memberRooms = userRooms.filter(room => room.adminId !== user.id)

  // Filter rooms for discovery (exclude user's own rooms)
  const filteredRooms = rooms.filter(room => {
    // Don't show user's own rooms in discovery
    if (room.members.some(member => member.id === user.id)) {
      return false
    }
    
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

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Sidebar />
      
      <div className="lg:ml-64 p-4 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col items-center text-center gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between sm:text-left sm:gap-0">
            <div className="flex flex-col items-center sm:items-start">
              <h1 className="flex items-center justify-center text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1">
                <Users className="w-7 h-7 sm:w-8 sm:h-8 text-primary-400 mr-2" />
                Study Rooms
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-accent-400 ml-2 animate-pulse" />
              </h1>
              <p className="text-dark-300 text-base sm:text-lg max-w-xs sm:max-w-none">
                Collaborate, learn, and achieve your goals together
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none mx-auto sm:mx-0 mb-4">
            <Button
              onClick={() => setCreateRoomModal(true)}
              icon={Plus}
              className="w-full sm:w-auto bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600"
            >
              Create Room
            </Button>
            <Button
              onClick={() => setJoinRoomModal(true)}
              variant="outline"
              icon={UserPlus}
              className="w-full sm:w-auto"
            >
              Join Room
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-primary-500/20 to-primary-600/20 border-primary-500/30">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-300 text-sm">My Rooms</p>
                  <p className="text-2xl font-bold text-white">{userRooms.length}</p>
                </div>
                <BookOpen className="w-8 h-8 text-primary-400" />
              </div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-secondary-500/20 to-secondary-600/20 border-secondary-500/30">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-300 text-sm">Admin Rooms</p>
                  <p className="text-2xl font-bold text-white">{adminRooms.length}</p>
                </div>
                <Crown className="w-8 h-8 text-secondary-400" />
              </div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-accent-500/20 to-accent-600/20 border-accent-500/30">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-300 text-sm">Total Rooms</p>
                  <p className="text-2xl font-bold text-white">
                    {rooms.filter(r => r.isActive).length}
                  </p>
                </div>
                <Users className="w-8 h-8 text-accent-400" />
              </div>
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-300 text-sm">Available</p>
                  <p className="text-2xl font-bold text-white">{filteredRooms.length}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('my-rooms')}
            className={`px-4 lg:px-6 py-3 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
              activeTab === 'my-rooms'
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
        {activeTab === 'my-rooms' ? (
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
              
              {userRooms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                  {userRooms.map((room, index) => (
                    <div
                      key={room.id}
                      className="animate-slide-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <RoomCard
                        room={room}
                        onJoinRoom={handleJoinRoomById}
                        onViewRoom={handleEnterRoom}
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
                  <BookOpen className="w-6 lg:w-8 h-6 lg:h-8 text-accent-400 mx-auto mb-3 group-hover:scale-110 transition-transform duration-200" />
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
                        onJoinRoom={() => handleJoinRoomById(room.id)}
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

        {activeTab === 'discover' && (
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
        )}
      </div>
    </div>
  )
} 