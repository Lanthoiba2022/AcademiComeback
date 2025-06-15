import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from '../components/dashboard/Sidebar'
import { QuizDashboard } from '../components/quiz/QuizDashboard'
import { QuizInterface } from '../components/quiz/QuizInterface'
import { QuizResults } from '../components/quiz/QuizResults'
import { PointsNotification } from '../components/gamification/PointsNotification'
import { AchievementUnlock } from '../components/gamification/AchievementUnlock'
import { Quiz, QuizAttempt } from '../types/quiz'
import { useGamification } from '../hooks/useGamification'

type QuizPageState = 'dashboard' | 'taking-quiz' | 'results'

export const QuizPage = () => {
  const navigate = useNavigate()
  const [pageState, setPageState] = useState<QuizPageState>('dashboard')
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null)
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null>(null)
  
  const {
    awardQuizCompletion,
    pendingNotification,
    pendingAchievement,
    clearNotification,
    clearAchievement
  } = useGamification()

  const handleStartQuiz = (quiz: Quiz) => {
    setCurrentQuiz(quiz)
    setPageState('taking-quiz')
  }

  const handleQuizComplete = (attempt: QuizAttempt) => {
    setCurrentAttempt(attempt)
    setPageState('results')
    
    // Award points for quiz completion
    awardQuizCompletion(attempt.percentage)
  }

  const handleRetakeQuiz = () => {
    if (currentQuiz) {
      setPageState('taking-quiz')
    }
  }

  const handleBackToDashboard = () => {
    setPageState('dashboard')
    setCurrentQuiz(null)
    setCurrentAttempt(null)
  }

  const handleExitQuiz = () => {
    setPageState('dashboard')
    setCurrentQuiz(null)
  }

  const handleShareResults = () => {
    if (currentAttempt && currentQuiz) {
      const shareText = `I just scored ${currentAttempt.percentage}% on "${currentQuiz.title}" quiz! 🎯`
      
      if (navigator.share) {
        navigator.share({
          title: 'Quiz Results',
          text: shareText,
          url: window.location.href
        })
      } else {
        navigator.clipboard.writeText(shareText)
        // Show a toast notification that text was copied
      }
    }
  }

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Sidebar />
      
      <div className="lg:ml-64">
        {pageState === 'dashboard' && (
          <div className="p-4 lg:p-8">
            <QuizDashboard onStartQuiz={handleStartQuiz} />
          </div>
        )}

        {pageState === 'taking-quiz' && currentQuiz && (
          <QuizInterface
            quiz={currentQuiz}
            onComplete={handleQuizComplete}
            onExit={handleExitQuiz}
          />
        )}

        {pageState === 'results' && currentAttempt && currentQuiz && (
          <QuizResults
            attempt={currentAttempt}
            quiz={currentQuiz}
            onRetakeQuiz={handleRetakeQuiz}
            onBackToDashboard={handleBackToDashboard}
            onShareResults={handleShareResults}
          />
        )}
      </div>

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