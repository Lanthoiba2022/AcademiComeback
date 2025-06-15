export interface Quiz {
  id: string
  title: string
  description: string
  topic: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  questions: Question[]
  timeLimit?: number // in minutes
  passingScore: number // percentage
  createdAt: string
  createdBy?: string
  tags: string[]
  type: 'topic-review' | 'quick-assessment' | 'comprehensive-test' | 'practice-mode'
}

export interface Question {
  id: string
  type: 'multiple-choice' | 'true-false' | 'fill-in-blank' | 'short-answer'
  question: string
  options?: string[] // for multiple choice
  correctAnswer: string | string[] // can be multiple for fill-in-blank
  explanation: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  topic: string
  timeLimit?: number // in seconds
  hints?: string[]
  points: number
}

export interface QuizAttempt {
  id: string
  quizId: string
  userId: string
  startedAt: string
  completedAt?: string
  answers: QuizAnswer[]
  score: number
  percentage: number
  timeSpent: number // in seconds
  status: 'in-progress' | 'completed' | 'abandoned'
  feedback: QuizFeedback
}

export interface QuizAnswer {
  questionId: string
  answer: string | string[]
  isCorrect: boolean
  timeSpent: number
  hintsUsed: number
}

export interface QuizFeedback {
  overallScore: number
  grade: string // A+, A, B+, etc.
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  topicBreakdown: TopicPerformance[]
  timeAnalysis: TimeAnalysis
}

export interface TopicPerformance {
  topic: string
  questionsAnswered: number
  correctAnswers: number
  percentage: number
  averageTime: number
}

export interface TimeAnalysis {
  totalTime: number
  averageTimePerQuestion: number
  fastestQuestion: number
  slowestQuestion: number
  timeEfficiency: 'excellent' | 'good' | 'average' | 'needs-improvement'
}

export interface QuizStats {
  totalQuizzes: number
  averageScore: number
  bestScore: number
  totalTimeSpent: number
  favoriteTopics: string[]
  improvementAreas: string[]
  streakDays: number
  recentAttempts: QuizAttempt[]
}

export interface AIQuizGenerator {
  generateQuiz: (topic: string, difficulty: string, questionCount: number, type: string) => Promise<Quiz>
  generateQuestion: (topic: string, difficulty: string, type: string) => Promise<Question>
  getTopicSuggestions: (studyPlan?: string[]) => string[]
  getDifficultyRecommendation: (userStats: QuizStats) => 'beginner' | 'intermediate' | 'advanced'
}