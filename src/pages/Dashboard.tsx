import { useState } from 'react'
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
import { mockUser, mockRooms } from '../data/mockData'
import { getRankProgress, getRankColor } from '../utils/roomUtils'
import { Room, RoomFilters as RoomFiltersType } from '../types'
import { useNavigate } from 'react-router-dom'

export const Dashboard = () => {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState<Room[]>(mockRooms)
  const [createRoomModal, setCreateRoomModal] = useState(false)
  const [joinRoomModal, setJoinRoomModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'discover'>('overview')
  const [filters, setFilters] = useState<RoomFiltersType>({
    search: '',
    tags: [],
    isActive: undefined,
    maxMembers: undefined
  })

  const user = mockUser
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

  const handleCreateRoom = (roomData: any) => {
    const newRoom: Room = {
      ...roomData,
      members: [user]
    }
    setRooms(prev => [newRoom, ...prev])
  }

  const handleJoinRoom = (code: string) => {
    // Find room by code and add user to members
    setRooms(prev => prev.map(room => 
      room.code === code 
        ? { ...room, members: [...room.members, user] }
        : room
    ))
  }

  const handleJoinRoomById = (roomId: string) => {
    setRooms(prev => prev.map(room => 
      room.id === roomId 
        ? { ...room, members: [...room.members, user] }
        : room
    ))
  }

  const handleViewRoom = (roomId: string) => {
    navigate(`/room/${roomId}`)
  }

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Sidebar />
      
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
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
              >
                Create Room
              </Button>
              <Button
                onClick={() => setJoinRoomModal(true)}
                variant="outline"
                icon={UserPlus}
                size="lg"
              >
                Join Room
              </Button>
            </div>
          </div>
        </div>

        {/* User Progress Card */}
        <Card className="mb-8 animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full overflow-hidden">
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
            
            <div className="flex-1 max-w-md mx-8">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-dark-400 mb-1">{stat.name}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-accent-400">{stat.change}</p>
                </div>
                <div className={`p-3 bg-dark-800 rounded-xl ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'overview'
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                : 'text-dark-300 hover:text-white hover:bg-dark-800'
            }`}
          >
            My Rooms
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
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
                <h2 className="text-2xl font-semibold text-white">Your Study Rooms</h2>
                {userRooms.length > 4 && (
                  <Button variant="ghost" size="sm">
                    View All ({userRooms.length})
                  </Button>
                )}
              </div>
              
              {recentRooms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                  <div className="flex justify-center gap-3">
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
              <h2 className="text-2xl font-semibold text-white mb-6">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setCreateRoomModal(true)}
                  className="p-6 bg-dark-800/50 rounded-lg hover:bg-dark-800/70 transition-colors duration-200 text-center group"
                >
                  <Plus className="w-8 h-8 text-primary-400 mx-auto mb-3 group-hover:scale-110 transition-transform duration-200" />
                  <p className="text-white font-medium">Create Room</p>
                  <p className="text-sm text-dark-400">Start a new study session</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('discover')}
                  className="p-6 bg-dark-800/50 rounded-lg hover:bg-dark-800/70 transition-colors duration-200 text-center group"
                >
                  <Search className="w-8 h-8 text-secondary-400 mx-auto mb-3 group-hover:scale-110 transition-transform duration-200" />
                  <p className="text-white font-medium">Discover</p>
                  <p className="text-sm text-dark-400">Find study partners</p>
                </button>
                
                <button className="p-6 bg-dark-800/50 rounded-lg hover:bg-dark-800/70 transition-colors duration-200 text-center group">
                  <FileText className="w-8 h-8 text-accent-400 mx-auto mb-3 group-hover:scale-110 transition-transform duration-200" />
                  <p className="text-white font-medium">My Notes</p>
                  <p className="text-sm text-dark-400">Access your notes</p>
                </button>
                
                <button className="p-6 bg-dark-800/50 rounded-lg hover:bg-dark-800/70 transition-colors duration-200 text-center group">
                  <Target className="w-8 h-8 text-primary-400 mx-auto mb-3 group-hover:scale-110 transition-transform duration-200" />
                  <p className="text-white font-medium">Goals</p>
                  <p className="text-sm text-dark-400">Track your progress</p>
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
                <h2 className="text-2xl font-semibold text-white">
                  Discover Study Rooms
                  <span className="text-lg text-dark-400 ml-2">
                    ({filteredRooms.length} rooms)
                  </span>
                </h2>
              </div>
              
              {filteredRooms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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