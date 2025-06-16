import { useState, useEffect } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { PremiumGate } from '../premium/PremiumGate'
import { PremiumFeatureTooltip } from '../premium/PremiumFeatureTooltip'
import { 
  TrendingUp, Clock, Target, Trophy, Calendar, BookOpen,
  BarChart3, PieChart, Activity, Zap, Users, Brain, Crown, Lock
} from 'lucide-react'
import { StudyAnalytics, DailyStudyStats, TopicMasteryData } from '../../types/analytics'
import { LineChart, BarChart, PieChart as RechartsPieChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Line, Bar, Cell } from 'recharts'

interface AnalyticsDashboardProps {
  analytics: StudyAnalytics
  timeframe: 'week' | 'month' | 'year'
  onTimeframeChange: (timeframe: 'week' | 'month' | 'year') => void
}

export const AnalyticsDashboard = ({ analytics, timeframe, onTimeframeChange }: AnalyticsDashboardProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'topics' | 'goals'>('overview')

  const timeframes = [
    { id: 'week', name: 'This Week', icon: Calendar },
    { id: 'month', name: 'This Month', icon: BarChart3 },
    { id: 'year', name: 'This Year', icon: TrendingUp }
  ]

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Activity },
    { id: 'performance', name: 'Performance', icon: TrendingUp, premium: true },
    { id: 'topics', name: 'Topic Mastery', icon: BookOpen, premium: true },
    { id: 'goals', name: 'Goals', icon: Target }
  ]

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  const getInsightColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500/30 bg-red-500/10 text-red-400'
      case 'medium': return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
      default: return 'border-blue-500/30 bg-blue-500/10 text-blue-400'
    }
  }

  const getMasteryColor = (level: number) => {
    if (level >= 80) return 'text-green-400'
    if (level >= 60) return 'text-yellow-400'
    if (level >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  const chartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Study Analytics</h2>
          <p className="text-dark-300">Track your progress and identify areas for improvement</p>
        </div>
        
        {/* Timeframe Selector */}
        <div className="flex space-x-2">
          {timeframes.map((tf) => {
            const Icon = tf.icon
            return (
              <button
                key={tf.id}
                onClick={() => onTimeframeChange(tf.id as any)}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                  ${timeframe === tf.id
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                    : 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tf.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <Clock className="w-8 h-8 text-primary-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">
            {formatTime(analytics.dailyStats.reduce((sum, day) => sum + day.focusTime, 0))}
          </div>
          <p className="text-dark-400 text-sm">Total Focus Time</p>
          <div className="text-xs text-green-400 mt-1">
            +12% from last {timeframe}
          </div>
        </Card>
        
        <Card className="text-center">
          <Target className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">
            {analytics.dailyStats.reduce((sum, day) => sum + day.tasksCompleted, 0)}
          </div>
          <p className="text-dark-400 text-sm">Tasks Completed</p>
          <div className="text-xs text-green-400 mt-1">
            +8% from last {timeframe}
          </div>
        </Card>
        
        <Card className="text-center">
          <Brain className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">
            {analytics.quizPerformance.reduce((sum, quiz) => sum + quiz.averageScore, 0) / analytics.quizPerformance.length || 0}%
          </div>
          <p className="text-dark-400 text-sm">Avg Quiz Score</p>
          <div className="text-xs text-green-400 mt-1">
            +5% from last {timeframe}
          </div>
        </Card>
        
        <Card className="text-center">
          <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{analytics.streaks.currentStreak}</div>
          <p className="text-dark-400 text-sm">Current Streak</p>
          <div className="text-xs text-yellow-400 mt-1">
            Best: {analytics.streaks.longestStreak} days
          </div>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <PremiumFeatureTooltip
              key={tab.id}
              feature="analytics"
              title="Advanced Analytics"
              description="Get detailed insights into your study patterns, performance metrics, and topic mastery with premium analytics."
            >
              <button
                onClick={() => setActiveTab(tab.id as any)}
                disabled={tab.premium}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap relative
                  ${activeTab === tab.id
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                    : 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white'
                  }
                  ${tab.premium ? 'cursor-help' : ''}
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
                {tab.premium && (
                  <Crown className="w-3 h-3 text-primary-400" />
                )}
              </button>
            </PremiumFeatureTooltip>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Focus Time Chart */}
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Daily Focus Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="focusTime" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Task Completion */}
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Task Completion</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="tasksCompleted" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Study Insights */}
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-white mb-4">Study Insights</h3>
            <div className="space-y-3">
              {analytics.insights.slice(0, 5).map((insight) => (
                <div
                  key={insight.id}
                  className={`p-4 rounded-lg border ${getInsightColor(insight.priority)}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium mb-1">{insight.title}</h4>
                      <p className="text-sm opacity-80">{insight.description}</p>
                    </div>
                    {insight.actionable && (
                      <Button size="sm" variant="ghost">
                        Take Action
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'performance' && (
        <PremiumGate feature="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quiz Performance */}
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">Quiz Performance by Topic</h3>
              <div className="space-y-4">
                {analytics.quizPerformance.map((quiz, index) => (
                  <div key={quiz.topic} className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium capitalize">{quiz.topic}</p>
                      <p className="text-dark-400 text-sm">{quiz.totalQuizzes} quizzes</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{Math.round(quiz.averageScore)}%</p>
                      <div className={`text-xs ${
                        quiz.recentTrend === 'improving' ? 'text-green-400' :
                        quiz.recentTrend === 'declining' ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {quiz.recentTrend}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Collaboration Stats */}
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">Collaboration</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{analytics.collaborationStats.roomsJoined}</div>
                  <p className="text-dark-400 text-sm">Rooms Joined</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{analytics.collaborationStats.helpGiven}</div>
                  <p className="text-dark-400 text-sm">Help Given</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{analytics.collaborationStats.messagesExchanged}</div>
                  <p className="text-dark-400 text-sm">Messages</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{analytics.collaborationStats.teamworkScore}</div>
                  <p className="text-dark-400 text-sm">Teamwork Score</p>
                </div>
              </div>
            </Card>
          </div>
        </PremiumGate>
      )}

      {activeTab === 'topics' && (
        <PremiumGate feature="analytics">
          <div className="space-y-6">
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">Topic Mastery Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.topicMastery.map((topic) => (
                  <div key={topic.topic} className="p-4 bg-dark-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium capitalize">{topic.topic}</h4>
                      <span className={`text-sm font-bold ${getMasteryColor(topic.masteryLevel)}`}>
                        {topic.masteryLevel}%
                      </span>
                    </div>
                    
                    <div className="w-full bg-dark-700 rounded-full h-2 mb-3">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          topic.masteryLevel >= 80 ? 'bg-green-400' :
                          topic.masteryLevel >= 60 ? 'bg-yellow-400' :
                          topic.masteryLevel >= 40 ? 'bg-orange-400' : 'bg-red-400'
                        }`}
                        style={{ width: `${topic.masteryLevel}%` }}
                      />
                    </div>
                    
                    <div className="space-y-1 text-xs text-dark-400">
                      <div className="flex justify-between">
                        <span>Time spent:</span>
                        <span>{formatTime(topic.timeSpent)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tasks completed:</span>
                        <span>{topic.tasksCompleted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quiz average:</span>
                        <span>{Math.round(topic.quizAverage)}%</span>
                      </div>
                    </div>
                    
                    <div className={`mt-2 text-xs ${
                      topic.trend === 'improving' ? 'text-green-400' :
                      topic.trend === 'declining' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {topic.trend === 'improving' ? '📈' : topic.trend === 'declining' ? '📉' : '➡️'} {topic.trend}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </PremiumGate>
      )}

      {activeTab === 'goals' && (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Study Goals</h3>
              <Button size="sm" icon={Target}>
                Add Goal
              </Button>
            </div>
            
            <div className="space-y-4">
              {analytics.goals.map((goal) => {
                const progress = (goal.current / goal.target) * 100
                const isCompleted = goal.isCompleted
                
                return (
                  <div key={goal.id} className="p-4 bg-dark-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium">{goal.title}</h4>
                      <span className={`text-sm px-2 py-1 rounded ${
                        isCompleted ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {goal.type}
                      </span>
                    </div>
                    
                    <p className="text-dark-300 text-sm mb-3">{goal.description}</p>
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-dark-400 text-sm">
                        {goal.current} / {goal.target} {goal.unit}
                      </span>
                      <span className="text-white font-medium">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    
                    <div className="w-full bg-dark-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-green-400' : 'bg-primary-500'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-dark-400 text-xs">
                        Deadline: {new Date(goal.deadline).toLocaleDateString()}
                      </span>
                      {isCompleted && (
                        <span className="text-green-400 text-xs">✓ Completed</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}