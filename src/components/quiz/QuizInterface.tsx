import { useState, useEffect, useRef } from 'react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Modal } from '../ui/Modal'
import { 
  Clock, ChevronLeft, ChevronRight, Flag, CheckCircle, 
  AlertCircle, Lightbulb, SkipForward, Play, Pause 
} from 'lucide-react'
import { Quiz, Question, QuizAnswer, QuizAttempt } from '../../types/quiz'

interface QuizInterfaceProps {
  quiz: Quiz
  onComplete: (attempt: QuizAttempt) => void
  onExit: () => void
}

export const QuizInterface = ({ quiz, onComplete, onExit }: QuizInterfaceProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, QuizAnswer>>({})
  const [timeRemaining, setTimeRemaining] = useState(quiz.timeLimit ? quiz.timeLimit * 60 : null)
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [showHint, setShowHint] = useState(false)
  const [hintsUsed, setHintsUsed] = useState<Record<string, number>>({})
  const [isReviewMode, setIsReviewMode] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  
  const startTime = useRef(Date.now())
  const timerRef = useRef<NodeJS.Timeout>()

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1
  const answeredQuestions = Object.keys(answers).length
  const progressPercentage = (answeredQuestions / quiz.questions.length) * 100

  // Timer effect
  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0 && !isPaused && !isReviewMode) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev && prev <= 1) {
            handleSubmitQuiz()
            return 0
          }
          return prev ? prev - 1 : null
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
  }, [timeRemaining, isPaused, isReviewMode])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswerChange = (answer: string | string[]) => {
    const questionTimeSpent = Math.floor((Date.now() - questionStartTime) / 1000)
    
    const newAnswer: QuizAnswer = {
      questionId: currentQuestion.id,
      answer,
      isCorrect: checkAnswer(currentQuestion, answer),
      timeSpent: questionTimeSpent,
      hintsUsed: hintsUsed[currentQuestion.id] || 0
    }

    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: newAnswer
    }))
  }

  const checkAnswer = (question: Question, answer: string | string[]): boolean => {
    if (Array.isArray(question.correctAnswer)) {
      if (Array.isArray(answer)) {
        return question.correctAnswer.every(correct => 
          answer.some(ans => ans.toLowerCase().trim() === correct.toLowerCase().trim())
        )
      } else {
        return question.correctAnswer.some(correct => 
          answer.toLowerCase().trim() === correct.toLowerCase().trim()
        )
      }
    } else {
      const userAnswer = Array.isArray(answer) ? answer[0] : answer
      return userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()
    }
  }

  const navigateToQuestion = (index: number) => {
    setCurrentQuestionIndex(index)
    setQuestionStartTime(Date.now())
    setShowHint(false)
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      navigateToQuestion(currentQuestionIndex + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      navigateToQuestion(currentQuestionIndex - 1)
    }
  }

  const handleUseHint = () => {
    setShowHint(true)
    setHintsUsed(prev => ({
      ...prev,
      [currentQuestion.id]: (prev[currentQuestion.id] || 0) + 1
    }))
  }

  const handleReviewMode = () => {
    setIsReviewMode(true)
    setIsPaused(true)
  }

  const handleSubmitQuiz = () => {
    const endTime = Date.now()
    const totalTimeSpent = Math.floor((endTime - startTime.current) / 1000)
    
    const answersArray = quiz.questions.map(question => 
      answers[question.id] || {
        questionId: question.id,
        answer: '',
        isCorrect: false,
        timeSpent: 0,
        hintsUsed: 0
      }
    )

    const correctAnswers = answersArray.filter(a => a.isCorrect).length
    const score = correctAnswers
    const percentage = Math.round((score / quiz.questions.length) * 100)

    const attempt: QuizAttempt = {
      id: `attempt_${Date.now()}`,
      quizId: quiz.id,
      userId: 'current-user', // This should come from auth context
      startedAt: new Date(startTime.current).toISOString(),
      completedAt: new Date().toISOString(),
      answers: answersArray,
      score,
      percentage,
      timeSpent: totalTimeSpent,
      status: 'completed',
      feedback: generateFeedback(answersArray, quiz, percentage, totalTimeSpent)
    }

    onComplete(attempt)
  }

  const generateFeedback = (answers: QuizAnswer[], quiz: Quiz, percentage: number, timeSpent: number) => {
    const grade = percentage >= 90 ? 'A+' : 
                  percentage >= 85 ? 'A' :
                  percentage >= 80 ? 'B+' :
                  percentage >= 75 ? 'B' :
                  percentage >= 70 ? 'C+' :
                  percentage >= 65 ? 'C' :
                  percentage >= 60 ? 'D' : 'F'

    const strengths: string[] = []
    const weaknesses: string[] = []
    const recommendations: string[] = []

    // Analyze performance
    if (percentage >= 80) {
      strengths.push('Excellent overall understanding')
    }
    if (percentage < 70) {
      weaknesses.push('Needs improvement in core concepts')
      recommendations.push('Review the fundamentals before attempting advanced topics')
    }

    const avgTimePerQuestion = timeSpent / quiz.questions.length
    if (avgTimePerQuestion < 30) {
      strengths.push('Quick problem-solving skills')
    } else if (avgTimePerQuestion > 120) {
      recommendations.push('Practice time management during quizzes')
    }

    return {
      overallScore: percentage,
      grade,
      strengths,
      weaknesses,
      recommendations,
      topicBreakdown: [{
        topic: quiz.topic,
        questionsAnswered: quiz.questions.length,
        correctAnswers: answers.filter(a => a.isCorrect).length,
        percentage,
        averageTime: avgTimePerQuestion
      }],
      timeAnalysis: {
        totalTime: timeSpent,
        averageTimePerQuestion: avgTimePerQuestion,
        fastestQuestion: Math.min(...answers.map(a => a.timeSpent)),
        slowestQuestion: Math.max(...answers.map(a => a.timeSpent)),
        timeEfficiency: avgTimePerQuestion < 60 ? 'excellent' : 
                       avgTimePerQuestion < 90 ? 'good' : 
                       avgTimePerQuestion < 120 ? 'average' : 'needs-improvement'
      }
    }
  }

  const renderQuestion = () => {
    const currentAnswer = answers[currentQuestion.id]?.answer

    switch (currentQuestion.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerChange(option)}
                className={`
                  w-full p-4 text-left rounded-lg border-2 transition-all duration-200
                  ${currentAnswer === option
                    ? 'border-primary-500 bg-primary-500/10 text-primary-300'
                    : 'border-dark-600 bg-dark-800/50 text-white hover:border-dark-500'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <div className={`
                    w-4 h-4 rounded-full border-2 flex items-center justify-center
                    ${currentAnswer === option ? 'border-primary-500' : 'border-dark-500'}
                  `}>
                    {currentAnswer === option && (
                      <div className="w-2 h-2 rounded-full bg-primary-500" />
                    )}
                  </div>
                  <span>{option}</span>
                </div>
              </button>
            ))}
          </div>
        )

      case 'true-false':
        return (
          <div className="grid grid-cols-2 gap-4">
            {['true', 'false'].map((option) => (
              <button
                key={option}
                onClick={() => handleAnswerChange(option)}
                className={`
                  p-6 rounded-lg border-2 transition-all duration-200 text-center
                  ${currentAnswer === option
                    ? 'border-primary-500 bg-primary-500/10 text-primary-300'
                    : 'border-dark-600 bg-dark-800/50 text-white hover:border-dark-500'
                  }
                `}
              >
                <div className="text-2xl mb-2">
                  {option === 'true' ? '✓' : '✗'}
                </div>
                <div className="font-medium capitalize">{option}</div>
              </button>
            ))}
          </div>
        )

      case 'fill-in-blank':
        return (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Type your answer here..."
              value={Array.isArray(currentAnswer) ? currentAnswer[0] || '' : currentAnswer || ''}
              onChange={(e) => handleAnswerChange([e.target.value])}
              className="w-full px-4 py-3 bg-dark-800/50 border border-dark-700 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-sm text-dark-400">
              Fill in the blank with the most appropriate answer
            </p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-hero-gradient">
      {/* Header */}
      <div className="bg-dark-900/90 backdrop-blur-xl border-b border-dark-700/50 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">{quiz.title}</h1>
            <p className="text-sm text-dark-300">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {timeRemaining !== null && (
              <div className={`
                flex items-center space-x-2 px-3 py-2 rounded-lg
                ${timeRemaining < 300 ? 'bg-red-500/20 text-red-400' : 'bg-dark-800 text-white'}
              `}>
                <Clock className="w-4 h-4" />
                <span className="font-mono">{formatTime(timeRemaining)}</span>
              </div>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
              icon={isPaused ? Play : Pause}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExitConfirm(true)}
            >
              Exit Quiz
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mt-4">
          <div className="w-full bg-dark-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-dark-400 mt-1">
            <span>{answeredQuestions} answered</span>
            <span>{Math.round(progressPercentage)}% complete</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <h3 className="text-lg font-semibold text-white mb-4">Questions</h3>
              <div className="grid grid-cols-5 lg:grid-cols-1 gap-2">
                {quiz.questions.map((_, index) => {
                  const isAnswered = answers[quiz.questions[index].id]
                  const isCurrent = index === currentQuestionIndex
                  
                  return (
                    <button
                      key={index}
                      onClick={() => navigateToQuestion(index)}
                      className={`
                        w-10 h-10 lg:w-full lg:h-auto lg:p-2 rounded-lg font-medium transition-all duration-200
                        ${isCurrent 
                          ? 'bg-primary-500 text-white' 
                          : isAnswered 
                            ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30'
                            : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
                        }
                      `}
                    >
                      <span className="lg:hidden">{index + 1}</span>
                      <span className="hidden lg:block">Question {index + 1}</span>
                      {isAnswered && !isCurrent && (
                        <CheckCircle className="w-4 h-4 ml-auto hidden lg:block" />
                      )}
                    </button>
                  )
                })}
              </div>
              
              <div className="mt-6 pt-4 border-t border-dark-700">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleReviewMode}
                  icon={Flag}
                >
                  Review Answers
                </Button>
              </div>
            </Card>
          </div>

          {/* Question Content */}
          <div className="lg:col-span-3">
            <Card className="mb-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-primary-500/20 text-primary-400 rounded text-xs font-medium">
                      {currentQuestion.difficulty.toUpperCase()}
                    </span>
                    <span className="px-2 py-1 bg-dark-700 text-dark-300 rounded text-xs">
                      {currentQuestion.points} pts
                    </span>
                  </div>
                  
                  {currentQuestion.hints && currentQuestion.hints.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleUseHint}
                      icon={Lightbulb}
                      disabled={showHint}
                    >
                      {showHint ? 'Hint Used' : 'Get Hint'}
                    </Button>
                  )}
                </div>

                <h2 className="text-xl font-semibold text-white mb-4">
                  {currentQuestion.question}
                </h2>

                {showHint && currentQuestion.hints && (
                  <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 font-medium">Hint</span>
                    </div>
                    <p className="text-yellow-200">{currentQuestion.hints[0]}</p>
                  </div>
                )}
              </div>

              {renderQuestion()}
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                icon={ChevronLeft}
              >
                Previous
              </Button>

              <div className="flex space-x-3">
                {!isLastQuestion ? (
                  <Button
                    onClick={handleNextQuestion}
                    icon={ChevronRight}
                    iconPosition="right"
                  >
                    Next Question
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmitQuiz}
                    variant="primary"
                    icon={Flag}
                  >
                    Submit Quiz
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      <Modal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        title="Exit Quiz"
        size="sm"
      >
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Are you sure you want to exit?
            </h3>
            <p className="text-dark-300">
              Your progress will be lost and you'll need to start over.
            </p>
          </div>
          <div className="flex justify-center space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowExitConfirm(false)}
            >
              Continue Quiz
            </Button>
            <Button
              variant="primary"
              onClick={onExit}
            >
              Exit Quiz
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}