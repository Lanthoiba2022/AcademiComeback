import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { PremiumGate } from '../premium/PremiumGate'
import { PremiumFeatureTooltip } from '../premium/PremiumFeatureTooltip'
import { 
  Brain, Plus, Search, Filter, Clock, Trophy, Target, 
  TrendingUp, BookOpen, Zap, FileText, Star, Play,
  Calendar, BarChart3, Crown, Lock
} from 'lucide-react'
import { Quiz, QuizAttempt, QuizStats } from '../../types/quiz'
import { QUIZ_TEMPLATES, TOPIC_SUGGESTIONS } from '../../data/quizData'
import { QuizGenerator } from './QuizGenerator'

interface QuizDashboardProps {
  onStartQuiz: (quiz: Quiz) => void
  userStats?: QuizStats
  recentAttempts?: QuizAttempt[]
}

export const QuizDashboard = ({ onStartQuiz, userStats, recentAttempts = [] }: QuizDashboardProps) => {
  const [showGenerator, setShowGenerator] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>(QUIZ_TEMPLATES)

  const filteredQuizzes = availableQuizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTopic = selectedTopic === 'all' || quiz.topic === selectedTopic
    const matchesDifficulty = selectedDifficulty === 'all' || quiz.difficulty === selectedDifficulty
    
    return matchesSearch && matchesTopic && matchesDifficulty
  })

  const handleQuizGenerated = (quiz: Quiz) => {
    setAvailableQuizzes(prev => [quiz, ...prev])
  }

  const getQuizTypeIcon = (type: string) => {
    switch (type) {
      case 'quick-assessment': return Zap
      case 'comprehensive-test': return FileText
      case 'practice-mode': return Target
      default: return BookOpen
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-500/20'
      case 'intermediate': return 'text-yellow-400 bg-yellow-500/20'
      case 'advanced': return 'text-red-400 bg-red-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-2 mb-4 md:flex-row md:items-center md:justify-between md:text-left md:gap-0">
        <div className="flex flex-col items-center md:items-start">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-1">Quiz Center</h2>
          <p className="text-dark-300 text-base md:text-lg">Test your knowledge and track your progress</p>
        </div>
        <PremiumGate feature="ai" showUpgradePrompt={false}>
          <Button
            onClick={() => setShowGenerator(true)}
            icon={Brain}
            size="lg"
            className="bg-gradient-to-r from-purple-500 to-pink-500 mt-3 md:mt-0"
          >
            Generate AI Quiz
          </Button>
        </PremiumGate>
      </div>

      {/* Stats Overview */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 mb-2">
          <Card className="text-center">
            <Trophy className="w-7 h-7 md:w-8 md:h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-xl md:text-2xl font-bold text-white">{userStats.totalQuizzes}</div>
            <p className="text-dark-400 text-xs md:text-sm">Quizzes Taken</p>
          </Card>
          <Card className="text-center">
            <Target className="w-7 h-7 md:w-8 md:h-8 text-green-400 mx-auto mb-2" />
            <div className="text-xl md:text-2xl font-bold text-white">{Math.round(userStats.averageScore)}%</div>
            <p className="text-dark-400 text-xs md:text-sm">Average Score</p>
          </Card>
          <Card className="text-center">
            <Star className="w-7 h-7 md:w-8 md:h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-xl md:text-2xl font-bold text-white">{userStats.bestScore}%</div>
            <p className="text-dark-400 text-xs md:text-sm">Best Score</p>
          </Card>
          <Card className="text-center">
            <Clock className="w-7 h-7 md:w-8 md:h-8 text-purple-400 mx-auto mb-2" />
            <div className="text-xl md:text-2xl font-bold text-white">{formatTime(userStats.totalTimeSpent)}</div>
            <p className="text-dark-400 text-xs md:text-sm">Time Spent</p>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 mb-2">
        <PremiumFeatureTooltip
          feature="ai"
          title="AI Quiz Generation"
          description="Create personalized quizzes using AI based on your study topics and difficulty preferences."
        >
          <button
            onClick={() => setShowGenerator(true)}
            className="w-full p-4 md:p-6 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 border border-primary-500/30 rounded-2xl shadow-md hover:scale-105 transition-transform duration-200 text-center group relative"
          >
            <PremiumGate feature="ai" showUpgradePrompt={false} fallback={
              <div className="absolute top-2 right-2">
                <Crown className="w-4 h-4 text-primary-400" />
              </div>
            } />
            <Brain className="w-7 h-7 md:w-8 md:h-8 text-primary-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="text-white font-semibold mb-1 text-base md:text-lg">AI Quiz</h3>
            <p className="text-dark-300 text-xs md:text-sm">Generate custom quiz</p>
          </button>
        </PremiumFeatureTooltip>
        <button
          onClick={() => {
            const quickQuiz = availableQuizzes.find(q => q.type === 'quick-assessment')
            if (quickQuiz) onStartQuiz(quickQuiz)
          }}
          className="w-full p-4 md:p-6 bg-gradient-to-br from-accent-500/20 to-primary-500/20 border border-accent-500/30 rounded-2xl shadow-md hover:scale-105 transition-transform duration-200 text-center group"
        >
          <Zap className="w-7 h-7 md:w-8 md:h-8 text-accent-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="text-white font-semibold mb-1 text-base md:text-lg">Quick Quiz</h3>
          <p className="text-dark-300 text-xs md:text-sm">5 questions, 2 minutes</p>
        </button>
        <button
          onClick={() => {
            const practiceQuiz = availableQuizzes.find(q => q.type === 'practice-mode')
            if (practiceQuiz) onStartQuiz(practiceQuiz)
          }}
          className="w-full p-4 md:p-6 bg-gradient-to-br from-secondary-500/20 to-accent-500/20 border border-secondary-500/30 rounded-2xl shadow-md hover:scale-105 transition-transform duration-200 text-center group"
        >
          <Target className="w-7 h-7 md:w-8 md:h-8 text-secondary-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="text-white font-semibold mb-1 text-base md:text-lg">Practice</h3>
          <p className="text-dark-300 text-xs md:text-sm">Untimed with hints</p>
        </button>
        <button className="w-full p-4 md:p-6 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl shadow-md hover:scale-105 transition-transform duration-200 text-center group">
          <BarChart3 className="w-7 h-7 md:w-8 md:h-8 text-yellow-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
          <h3 className="text-white font-semibold mb-1 text-base md:text-lg">Analytics</h3>
          <p className="text-dark-300 text-xs md:text-sm">View progress</p>
        </button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search quizzes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>
          
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="px-4 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Topics</option>
            {TOPIC_SUGGESTIONS.map(topic => (
              <option key={topic} value={topic.toLowerCase()}>{topic}</option>
            ))}
          </select>
          
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-4 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </Card>

      {/* Available Quizzes */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Available Quizzes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuizzes.map((quiz, index) => {
            const TypeIcon = getQuizTypeIcon(quiz.type)
            
            return (
              <Card 
                key={quiz.id}
                className="hover:scale-105 transition-transform duration-200 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <TypeIcon className="w-6 h-6 text-primary-400" />
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(quiz.difficulty)}`}>
                    {quiz.difficulty}
                  </span>
                </div>
                
                <h4 className="text-lg font-semibold text-white mb-2">{quiz.title}</h4>
                <p className="text-dark-300 text-sm mb-4 line-clamp-2">{quiz.description}</p>
                
                <div className="flex items-center justify-between text-sm text-dark-400 mb-4">
                  <span>{quiz.questions.length} questions</span>
                  {quiz.timeLimit && (
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {quiz.timeLimit}min
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {quiz.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-1 bg-dark-700 text-dark-300 rounded text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
                
                <Button
                  onClick={() => onStartQuiz(quiz)}
                  className="w-full"
                  icon={Play}
                >
                  Start Quiz
                </Button>
              </Card>
            )
          })}
        </div>

        {filteredQuizzes.length === 0 && (
          <div className="text-center py-12">
            <Brain className="w-16 h-16 text-dark-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Quizzes Found</h3>
            <p className="text-dark-300 mb-4">Try adjusting your filters or create a new quiz</p>
            <PremiumGate feature="ai">
              <Button onClick={() => setShowGenerator(true)} icon={Plus}>
                Generate New Quiz
              </Button>
            </PremiumGate>
          </div>
        )}
      </div>

      {/* Recent Attempts */}
      {recentAttempts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Recent Attempts</h3>
          <div className="space-y-3">
            {recentAttempts.slice(0, 5).map((attempt) => {
              const quiz = availableQuizzes.find(q => q.id === attempt.quizId)
              if (!quiz) return null
              
              return (
                <Card key={attempt.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      attempt.percentage >= 80 ? 'bg-green-500/20 text-green-400' :
                      attempt.percentage >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {attempt.percentage}%
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{quiz.title}</h4>
                      <p className="text-dark-400 text-sm">
                        {new Date(attempt.completedAt!).toLocaleDateString()} • 
                        Grade: {attempt.feedback.grade}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-white font-medium">{attempt.score}/{quiz.questions.length}</p>
                    <p className="text-dark-400 text-sm">{formatTime(attempt.timeSpent)}</p>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Quiz Generator Modal */}
      <PremiumGate feature="ai">
        <QuizGenerator
          isOpen={showGenerator}
          onClose={() => setShowGenerator(false)}
          onQuizGenerated={handleQuizGenerated}
        />
      </PremiumGate>
    </div>
  )
}