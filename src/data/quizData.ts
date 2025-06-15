import { Question, Quiz } from '../types/quiz'

// Pre-built question banks for different topics
export const QUESTION_BANKS: Record<string, Question[]> = {
  javascript: [
    {
      id: 'js_1',
      type: 'multiple-choice',
      question: 'What is the correct way to declare a variable in JavaScript ES6?',
      options: ['var name = "John"', 'let name = "John"', 'const name = "John"', 'All of the above'],
      correctAnswer: 'All of the above',
      explanation: 'ES6 introduced let and const, but var is still valid. However, let and const are preferred for block scoping.',
      difficulty: 'beginner',
      topic: 'javascript',
      points: 10,
      hints: ['Think about block scoping', 'ES6 introduced new keywords']
    },
    {
      id: 'js_2',
      type: 'true-false',
      question: 'JavaScript is a statically typed language.',
      correctAnswer: 'false',
      explanation: 'JavaScript is dynamically typed, meaning variable types are determined at runtime.',
      difficulty: 'beginner',
      topic: 'javascript',
      points: 10
    },
    {
      id: 'js_3',
      type: 'fill-in-blank',
      question: 'The _____ method is used to add elements to the end of an array.',
      correctAnswer: ['push'],
      explanation: 'The push() method adds one or more elements to the end of an array and returns the new length.',
      difficulty: 'beginner',
      topic: 'javascript',
      points: 15
    },
    {
      id: 'js_4',
      type: 'multiple-choice',
      question: 'What does the "this" keyword refer to in JavaScript?',
      options: [
        'The current function',
        'The global object',
        'The object that owns the method',
        'It depends on the context'
      ],
      correctAnswer: 'It depends on the context',
      explanation: 'The "this" keyword refers to different objects depending on how it is used: in a method, in a function, alone, in an event, etc.',
      difficulty: 'intermediate',
      topic: 'javascript',
      points: 20
    },
    {
      id: 'js_5',
      type: 'multiple-choice',
      question: 'Which of the following is NOT a JavaScript data type?',
      options: ['undefined', 'boolean', 'float', 'symbol'],
      correctAnswer: 'float',
      explanation: 'JavaScript has number type for all numeric values. There is no separate float type.',
      difficulty: 'intermediate',
      topic: 'javascript',
      points: 20
    }
  ],
  
  react: [
    {
      id: 'react_1',
      type: 'multiple-choice',
      question: 'What is JSX in React?',
      options: [
        'A JavaScript library',
        'A syntax extension for JavaScript',
        'A CSS framework',
        'A database query language'
      ],
      correctAnswer: 'A syntax extension for JavaScript',
      explanation: 'JSX is a syntax extension for JavaScript that allows you to write HTML-like code in your JavaScript files.',
      difficulty: 'beginner',
      topic: 'react',
      points: 10
    },
    {
      id: 'react_2',
      type: 'true-false',
      question: 'React components must always return a single parent element.',
      correctAnswer: 'false',
      explanation: 'With React Fragments or React 16+, components can return multiple elements without a wrapper.',
      difficulty: 'intermediate',
      topic: 'react',
      points: 15
    },
    {
      id: 'react_3',
      type: 'fill-in-blank',
      question: 'The _____ hook is used to manage state in functional components.',
      correctAnswer: ['useState'],
      explanation: 'useState is a React Hook that lets you add state to functional components.',
      difficulty: 'beginner',
      topic: 'react',
      points: 15
    }
  ],

  mathematics: [
    {
      id: 'math_1',
      type: 'multiple-choice',
      question: 'What is the derivative of x²?',
      options: ['x', '2x', 'x²', '2x²'],
      correctAnswer: '2x',
      explanation: 'Using the power rule: d/dx(x²) = 2x¹ = 2x',
      difficulty: 'beginner',
      topic: 'mathematics',
      points: 10
    },
    {
      id: 'math_2',
      type: 'true-false',
      question: 'The integral of a constant is the constant times x plus C.',
      correctAnswer: 'true',
      explanation: '∫k dx = kx + C, where k is a constant and C is the constant of integration.',
      difficulty: 'beginner',
      topic: 'mathematics',
      points: 10
    },
    {
      id: 'math_3',
      type: 'multiple-choice',
      question: 'What is the limit of (sin x)/x as x approaches 0?',
      options: ['0', '1', '∞', 'undefined'],
      correctAnswer: '1',
      explanation: 'This is a fundamental limit in calculus: lim(x→0) (sin x)/x = 1',
      difficulty: 'intermediate',
      topic: 'mathematics',
      points: 20
    }
  ],

  science: [
    {
      id: 'sci_1',
      type: 'multiple-choice',
      question: 'What is the chemical symbol for gold?',
      options: ['Go', 'Gd', 'Au', 'Ag'],
      correctAnswer: 'Au',
      explanation: 'Au comes from the Latin word "aurum" meaning gold.',
      difficulty: 'beginner',
      topic: 'science',
      points: 10
    },
    {
      id: 'sci_2',
      type: 'true-false',
      question: 'Light travels faster in water than in air.',
      correctAnswer: 'false',
      explanation: 'Light travels slower in denser mediums. It travels fastest in vacuum, then air, then water.',
      difficulty: 'intermediate',
      topic: 'science',
      points: 15
    }
  ],

  history: [
    {
      id: 'hist_1',
      type: 'multiple-choice',
      question: 'In which year did World War II end?',
      options: ['1944', '1945', '1946', '1947'],
      correctAnswer: '1945',
      explanation: 'World War II ended in 1945 with the surrender of Japan in September.',
      difficulty: 'beginner',
      topic: 'history',
      points: 10
    },
    {
      id: 'hist_2',
      type: 'fill-in-blank',
      question: 'The _____ was a period of cultural, artistic, political and economic rebirth following the Middle Ages.',
      correctAnswer: ['Renaissance'],
      explanation: 'The Renaissance was a period in European history marking the transition from the Middle Ages to modernity.',
      difficulty: 'intermediate',
      topic: 'history',
      points: 15
    }
  ]
}

export const QUIZ_TEMPLATES: Quiz[] = [
  {
    id: 'js_basics',
    title: 'JavaScript Fundamentals',
    description: 'Test your knowledge of basic JavaScript concepts',
    topic: 'javascript',
    difficulty: 'beginner',
    questions: QUESTION_BANKS.javascript.filter(q => q.difficulty === 'beginner'),
    timeLimit: 15,
    passingScore: 70,
    createdAt: new Date().toISOString(),
    tags: ['javascript', 'programming', 'basics'],
    type: 'topic-review'
  },
  {
    id: 'react_intro',
    title: 'React Introduction',
    description: 'Learn the basics of React framework',
    topic: 'react',
    difficulty: 'beginner',
    questions: QUESTION_BANKS.react,
    timeLimit: 10,
    passingScore: 75,
    createdAt: new Date().toISOString(),
    tags: ['react', 'frontend', 'javascript'],
    type: 'topic-review'
  },
  {
    id: 'quick_math',
    title: 'Quick Math Assessment',
    description: 'A quick 5-minute math quiz',
    topic: 'mathematics',
    difficulty: 'beginner',
    questions: QUESTION_BANKS.mathematics.slice(0, 3),
    timeLimit: 5,
    passingScore: 60,
    createdAt: new Date().toISOString(),
    tags: ['mathematics', 'calculus'],
    type: 'quick-assessment'
  }
]

export const TOPIC_SUGGESTIONS = [
  'JavaScript', 'React', 'Python', 'Mathematics', 'Calculus', 'Physics', 
  'Chemistry', 'Biology', 'History', 'Literature', 'Economics', 'Psychology',
  'Computer Science', 'Data Structures', 'Algorithms', 'Machine Learning',
  'Statistics', 'Linear Algebra', 'Organic Chemistry', 'World History'
]

export const DIFFICULTY_DESCRIPTIONS = {
  beginner: 'Perfect for getting started with the basics',
  intermediate: 'For those with some knowledge looking to advance',
  advanced: 'Challenging questions for experienced learners'
}

export const QUIZ_TYPES = {
  'topic-review': {
    name: 'Topic Review',
    description: 'Comprehensive review of a specific topic',
    icon: 'BookOpen',
    defaultQuestions: 10,
    defaultTime: 20
  },
  'quick-assessment': {
    name: 'Quick Assessment',
    description: '5 questions in 2 minutes',
    icon: 'Zap',
    defaultQuestions: 5,
    defaultTime: 2
  },
  'comprehensive-test': {
    name: 'Comprehensive Test',
    description: '20+ questions with detailed analysis',
    icon: 'FileText',
    defaultQuestions: 25,
    defaultTime: 45
  },
  'practice-mode': {
    name: 'Practice Mode',
    description: 'Untimed practice with hints',
    icon: 'Target',
    defaultQuestions: 15,
    defaultTime: null
  }
}

// AI Quiz Generator Mock Implementation
export class MockAIQuizGenerator {
  generateQuiz = async (
    topic: string, 
    difficulty: 'beginner' | 'intermediate' | 'advanced', 
    questionCount: number, 
    type: string
  ): Promise<Quiz> => {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const topicKey = topic.toLowerCase()
    const availableQuestions = QUESTION_BANKS[topicKey] || QUESTION_BANKS.javascript
    
    // Filter by difficulty and select random questions
    const filteredQuestions = availableQuestions.filter(q => q.difficulty === difficulty)
    const selectedQuestions = this.shuffleArray([...filteredQuestions]).slice(0, questionCount)
    
    // If not enough questions of the specified difficulty, add from other difficulties
    if (selectedQuestions.length < questionCount) {
      const remainingQuestions = availableQuestions.filter(q => q.difficulty !== difficulty)
      const additionalQuestions = this.shuffleArray(remainingQuestions).slice(0, questionCount - selectedQuestions.length)
      selectedQuestions.push(...additionalQuestions)
    }
    
    const quizTypeInfo = QUIZ_TYPES[type as keyof typeof QUIZ_TYPES] || QUIZ_TYPES['topic-review']
    
    return {
      id: `quiz_${Date.now()}`,
      title: `${topic} ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Quiz`,
      description: `AI-generated ${difficulty} level quiz on ${topic}`,
      topic: topicKey,
      difficulty,
      questions: selectedQuestions,
      timeLimit: quizTypeInfo.defaultTime,
      passingScore: difficulty === 'beginner' ? 60 : difficulty === 'intermediate' ? 70 : 80,
      createdAt: new Date().toISOString(),
      tags: [topicKey, difficulty, 'ai-generated'],
      type: type as any
    }
  }

  generateQuestion = async (
    topic: string, 
    difficulty: 'beginner' | 'intermediate' | 'advanced', 
    type: string
  ): Promise<Question> => {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const topicKey = topic.toLowerCase()
    const availableQuestions = QUESTION_BANKS[topicKey] || QUESTION_BANKS.javascript
    const filteredQuestions = availableQuestions.filter(q => 
      q.difficulty === difficulty && q.type === type
    )
    
    if (filteredQuestions.length === 0) {
      // Fallback to any question from the topic
      const fallbackQuestions = availableQuestions.filter(q => q.difficulty === difficulty)
      return fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)]
    }
    
    return filteredQuestions[Math.floor(Math.random() * filteredQuestions.length)]
  }

  getTopicSuggestions = (studyPlan?: string[]): string[] => {
    if (studyPlan && studyPlan.length > 0) {
      // Return suggestions based on study plan
      return studyPlan.slice(0, 5)
    }
    return TOPIC_SUGGESTIONS.slice(0, 8)
  }

  getDifficultyRecommendation = (userStats: any): 'beginner' | 'intermediate' | 'advanced' => {
    if (!userStats || userStats.averageScore < 60) return 'beginner'
    if (userStats.averageScore < 80) return 'intermediate'
    return 'advanced'
  }

  private shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
}

export const aiQuizGenerator = new MockAIQuizGenerator()