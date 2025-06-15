import { useState } from 'react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Modal } from '../ui/Modal'
import { 
  Trophy, Star, Clock, Target, TrendingUp, RotateCcw, 
  Share2, Download, ChevronDown, ChevronUp, CheckCircle, 
  XCircle, AlertCircle, Lightbulb, Award
} from 'lucide-react'
import { QuizAttempt, Quiz } from '../../types/quiz'

interface QuizResultsProps {
  attempt: QuizAttempt
  quiz: Quiz
  onRetakeQuiz: () => void
  onBackToDashboard: () => void
  onShareResults?: () => void
}

export const QuizResults = ({ 
  attempt, 
  quiz, 
  onRetakeQuiz, 
  onBackToDashboard, 
  onShareResults 
}: QuizResultsProps) => {
  const [showDetailedReview, setShowDetailedReview] = useState(false)
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-400'
    if (grade.startsWith('B')) return 'text-blue-400'
    if (grade.startsWith('C')) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getPerformanceMessage = (percentage: number) => {
    if (percentage >= 90) return { message: 'Outstanding Performance!', icon: Trophy, color: 'text-yellow-400' }
    if (percentage >= 80) return { message: 'Excellent Work!', icon: Star, color: 'text-green-400' }
    if (percentage >= 70) return { message: 'Good Job!', icon: Target, color: 'text-blue-400' }
    if (percentage >= 60) return { message: 'Keep Practicing!', icon: TrendingUp, color: 'text-yellow-400' }
    return { message: 'Need More Study', icon: AlertCircle, color: 'text-red-400' }
  }

  const performance = getPerformanceMessage(attempt.percentage)
  const PerformanceIcon = performance.icon

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const correctAnswers = attempt.answers.filter(a => a.isCorrect).length
  const totalQuestions = attempt.answers.length

  return (
    <div className="min-h-screen bg-hero-gradient p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <PerformanceIcon className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Quiz Complete!</h1>
          <p className="text-dark-300">{quiz.title}</p>
        </div>

        {/* Score Overview */}
        <Card className="text-center">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className={`text-4xl font-bold mb-2 ${getGradeColor(attempt.feedback.grade)}`}>
                {attempt.feedback.grade}
              </div>
              <p className="text-dark-400">Grade</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">
                {attempt.percentage}%
              </div>
              <p className="text-dark-400">Score</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">
                {correctAnswers}/{totalQuestions}
              </div>
              <p className="text-dark-400">Correct</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">
                {formatTime(attempt.timeSpent)}
              </div>
              <p className="text-dark-400">Time</p>
            </div>
          </div>
          
          <div className={`mt-6 p-4 rounded-lg bg-dark-800/50 ${performance.color}`}>
            <p className="text-lg font-semibold">{performance.message}</p>
          </div>
        </Card>

        {/* Performance Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths & Weaknesses */}
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Performance Analysis</h3>
            
            {attempt.feedback.strengths.length > 0 && (
              <div className="mb-4">
                <h4 className="text-green-400 font-medium mb-2 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Strengths
                </h4>
                <ul className="space-y-1">
                  {attempt.feedback.strengths.map((strength, index) => (
                    <li key={index} className="text-dark-300 text-sm">• {strength}</li>
                  ))}
                </ul>
              </div>
            )}

            {attempt.feedback.weaknesses.length > 0 && (
              <div className="mb-4">
                <h4 className="text-yellow-400 font-medium mb-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Areas for Improvement
                </h4>
                <ul className="space-y-1">
                  {attempt.feedback.weaknesses.map((weakness, index) => (
                    <li key={index} className="text-dark-300 text-sm">• {weakness}</li>
                  ))}
                </ul>
              </div>
            )}

            {attempt.feedback.recommendations.length > 0 && (
              <div>
                <h4 className="text-blue-400 font-medium mb-2 flex items-center">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Recommendations
                </h4>
                <ul className="space-y-1">
                  {attempt.feedback.recommendations.map((rec, index) => (
                    <li key={index} className="text-dark-300 text-sm">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {/* Time Analysis */}
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Time Analysis</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-dark-300">Total Time:</span>
                <span className="text-white font-medium">{formatTime(attempt.feedback.timeAnalysis.totalTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-300">Avg per Question:</span>
                <span className="text-white font-medium">{formatTime(Math.round(attempt.feedback.timeAnalysis.averageTimePerQuestion))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-300">Fastest Question:</span>
                <span className="text-white font-medium">{formatTime(attempt.feedback.timeAnalysis.fastestQuestion)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-300">Slowest Question:</span>
                <span className="text-white font-medium">{formatTime(attempt.feedback.timeAnalysis.slowestQuestion)}</span>
              </div>
              
              <div className="pt-4 border-t border-dark-700">
                <div className="flex items-center justify-between">
                  <span className="text-dark-300">Time Efficiency:</span>
                  <span className={`font-medium capitalize ${
                    attempt.feedback.timeAnalysis.timeEfficiency === 'excellent' ? 'text-green-400' :
                    attempt.feedback.timeAnalysis.timeEfficiency === 'good' ? 'text-blue-400' :
                    attempt.feedback.timeAnalysis.timeEfficiency === 'average' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {attempt.feedback.timeAnalysis.timeEfficiency.replace('-', ' ')}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Detailed Review */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Question Review</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetailedReview(!showDetailedReview)}
              icon={showDetailedReview ? ChevronUp : ChevronDown}
            >
              {showDetailedReview ? 'Hide' : 'Show'} Details
            </Button>
          </div>

          {showDetailedReview && (
            <div className="space-y-4">
              {quiz.questions.map((question, index) => {
                const answer = attempt.answers.find(a => a.questionId === question.id)
                const isExpanded = expandedQuestion === question.id
                
                return (
                  <div key={question.id} className="border border-dark-700 rounded-lg p-4">
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedQuestion(isExpanded ? null : question.id)}
                    >
                      <div className="flex items-center space-x-3">
                        {answer?.isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                        <span className="text-white font-medium">
                          Question {index + 1}
                        </span>
                        <span className="text-sm text-dark-400">
                          ({formatTime(answer?.timeSpent || 0)})
                        </span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-dark-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>

                    {isExpanded && (
                      <div className="mt-4 space-y-3">
                        <p className="text-white">{question.question}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-dark-400 mb-1">Your Answer:</p>
                            <p className={`font-medium ${answer?.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                              {Array.isArray(answer?.answer) ? answer.answer.join(', ') : answer?.answer || 'No answer'}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-dark-400 mb-1">Correct Answer:</p>
                            <p className="text-green-400 font-medium">
                              {Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer}
                            </p>
                          </div>
                        </div>

                        <div className="bg-dark-800/50 rounded-lg p-3">
                          <p className="text-sm text-dark-400 mb-1">Explanation:</p>
                          <p className="text-dark-200">{question.explanation}</p>
                        </div>

                        {answer && answer.hintsUsed > 0 && (
                          <p className="text-xs text-yellow-400">
                            💡 {answer.hintsUsed} hint{answer.hintsUsed > 1 ? 's' : ''} used
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button
            onClick={onRetakeQuiz}
            icon={RotateCcw}
            size="lg"
          >
            Retake Quiz
          </Button>
          
          {onShareResults && (
            <Button
              variant="outline"
              onClick={onShareResults}
              icon={Share2}
              size="lg"
            >
              Share Results
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={onBackToDashboard}
            size="lg"
          >
            Back to Dashboard
          </Button>
        </div>

        {/* Achievement Notification */}
        {attempt.percentage >= 90 && (
          <Card className="border-yellow-500/30 bg-yellow-500/10 text-center">
            <Award className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">
              Achievement Unlocked!
            </h3>
            <p className="text-yellow-200">
              Quiz Champion - Score 90% or higher on a quiz
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}