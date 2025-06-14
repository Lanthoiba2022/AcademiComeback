import { Sidebar } from '../components/dashboard/Sidebar'
import { Card } from '../components/ui/Card'
import { Users, FileText, Calendar, TrendingUp, Clock, Star } from 'lucide-react'

const stats = [
  {
    name: 'Study Sessions',
    value: '12',
    change: '+4.5%',
    icon: Users,
    color: 'text-primary-400'
  },
  {
    name: 'Notes Created',
    value: '48',
    change: '+12.3%',
    icon: FileText,
    color: 'text-secondary-400'
  },
  {
    name: 'Hours Studied',
    value: '127',
    change: '+8.1%',
    icon: Clock,
    color: 'text-accent-400'
  },
  {
    name: 'Achievement Score',
    value: '85%',
    change: '+2.4%',
    icon: TrendingUp,
    color: 'text-primary-400'
  }
]

const recentSessions = [
  {
    name: 'Calculus Study Group',
    participants: 5,
    time: '2 hours ago',
    subject: 'Mathematics'
  },
  {
    name: 'Chemistry Lab Review',
    participants: 3,
    time: '5 hours ago',
    subject: 'Chemistry'
  },
  {
    name: 'History Essay Discussion',
    participants: 7,
    time: '1 day ago',
    subject: 'History'
  }
]

export const Dashboard = () => {
  return (
    <div className="min-h-screen bg-hero-gradient">
      <Sidebar />
      
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back!</h1>
          <p className="text-dark-300">Here's what's happening with your studies today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-dark-400 mb-1">{stat.name}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-accent-400">{stat.change} from last week</p>
                </div>
                <div className={`p-3 bg-dark-800 rounded-xl ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Sessions */}
          <Card className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Recent Sessions</h2>
              <button className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {recentSessions.map((session, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-dark-800/50 rounded-lg hover:bg-dark-800/70 transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary-500/20 rounded-lg">
                      <Users className="w-4 h-4 text-primary-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{session.name}</p>
                      <p className="text-sm text-dark-400">{session.subject} • {session.participants} participants</p>
                    </div>
                  </div>
                  <span className="text-sm text-dark-400">{session.time}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 bg-dark-800/50 rounded-lg hover:bg-dark-800/70 transition-colors duration-200 text-center group">
                <Users className="w-8 h-8 text-primary-400 mx-auto mb-2 group-hover:scale-110 transition-transform duration-200" />
                <p className="text-white font-medium">Join Room</p>
                <p className="text-sm text-dark-400">Find study partners</p>
              </button>
              <button className="p-4 bg-dark-800/50 rounded-lg hover:bg-dark-800/70 transition-colors duration-200 text-center group">
                <FileText className="w-8 h-8 text-secondary-400 mx-auto mb-2 group-hover:scale-110 transition-transform duration-200" />
                <p className="text-white font-medium">New Note</p>
                <p className="text-sm text-dark-400">Start taking notes</p>
              </button>
              <button className="p-4 bg-dark-800/50 rounded-lg hover:bg-dark-800/70 transition-colors duration-200 text-center group">
                <Calendar className="w-8 h-8 text-accent-400 mx-auto mb-2 group-hover:scale-110 transition-transform duration-200" />
                <p className="text-white font-medium">Schedule</p>
                <p className="text-sm text-dark-400">Plan study time</p>
              </button>
              <button className="p-4 bg-dark-800/50 rounded-lg hover:bg-dark-800/70 transition-colors duration-200 text-center group">
                <Star className="w-8 h-8 text-primary-400 mx-auto mb-2 group-hover:scale-110 transition-transform duration-200" />
                <p className="text-white font-medium">Goals</p>
                <p className="text-sm text-dark-400">Track progress</p>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}