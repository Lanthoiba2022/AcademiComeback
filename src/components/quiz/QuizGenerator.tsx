import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card } from '../ui/Card'
import { Brain, Zap, BookOpen, FileText, Target, Loader, Sparkles } from 'lucide-react'
import { Quiz } from '../../types/quiz'
import { TOPIC_SUGGESTIONS, DIFFICULTY_DESCRIPTIONS, QUIZ_TYPES, aiQuizGenerator } from '../../data/quizData'

interface QuizGeneratorProps {
  isOpen: boolean
  onClose: () => void
  onQuizGenerated: (quiz: Quiz) => void
  studyPlan?: string[]
}

export const QuizGenerator = ({ isOpen, onClose, onQuizGenerated, studyPlan }: QuizGeneratorProps) => {
  const [step, setStep] = useState(1)
  const [generating, setGenerating] = useState(false)
  const [formData, setFormData] = useState({
    topic: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    questionCount: 10,
    type: 'topic-review',
    timeLimit: 20
  })

  const topicSuggestions = aiQuizGenerator.getTopicSuggestions(studyPlan)

  const handleGenerate = async () => {
    setGenerating(true)
    
    try {
      const quiz = await aiQuizGenerator.generateQuiz(
        formData.topic,
        formData.difficulty,
        formData.questionCount,
        formData.type
      )
      
      onQuizGenerated(quiz)
      onClose()
      resetForm()
    } catch (error) {
      console.error('Error generating quiz:', error)
    } finally {
      setGenerating(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setFormData({
      topic: '',
      difficulty: 'beginner',
      questionCount: 10,
      type: 'topic-review',
      timeLimit: 20
    })
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const getQuizTypeIcon = (type: string) => {
    const icons = { BookOpen, Zap, FileText, Target }
    const iconName = QUIZ_TYPES[type as keyof typeof QUIZ_TYPES]?.icon as keyof typeof icons
    return icons[iconName] || BookOpen
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="AI Quiz Generator" size="lg">
      <div className="space-y-6">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-4">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${step >= stepNumber 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-dark-700 text-dark-400'
                }
              `}>
                {stepNumber}
              </div>
              {stepNumber < 3 && (
                <div className={`
                  w-12 h-0.5 mx-2
                  ${step > stepNumber ? 'bg-primary-500' : 'bg-dark-700'}
                `} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Topic Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Brain className="w-16 h-16 text-primary-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Choose Your Topic</h3>
              <p className="text-dark-300">What would you like to be quizzed on?</p>
            </div>

            <Input
              label="Topic"
              placeholder="Enter a topic (e.g., JavaScript, Mathematics, History)"
              value={formData.topic}
              onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
            />

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-3">
                Suggested Topics
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {topicSuggestions.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setFormData(prev => ({ ...prev, topic }))}
                    className={`
                      p-3 rounded-lg text-sm font-medium transition-all duration-200
                      ${formData.topic === topic
                        ? 'bg-primary-500 text-white'
                        : 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white'
                      }
                    `}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Quiz Configuration */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Target className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Configure Your Quiz</h3>
              <p className="text-dark-300">Customize the difficulty and format</p>
            </div>

            {/* Quiz Type */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-3">
                Quiz Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(QUIZ_TYPES).map(([key, type]) => {
                  const Icon = getQuizTypeIcon(key)
                  return (
                    <button
                      key={key}
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        type: key,
                        questionCount: type.defaultQuestions,
                        timeLimit: type.defaultTime || 20
                      }))}
                      className={`
                        p-4 rounded-lg border-2 transition-all duration-200 text-left
                        ${formData.type === key
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-dark-600 bg-dark-800/50 hover:border-dark-500'
                        }
                      `}
                    >
                      <Icon className={`w-6 h-6 mb-2 ${formData.type === key ? 'text-primary-400' : 'text-dark-400'}`} />
                      <h4 className={`font-medium mb-1 ${formData.type === key ? 'text-primary-300' : 'text-white'}`}>
                        {type.name}
                      </h4>
                      <p className="text-sm text-dark-400">{type.description}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-3">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(DIFFICULTY_DESCRIPTIONS).map(([level, description]) => (
                  <button
                    key={level}
                    onClick={() => setFormData(prev => ({ ...prev, difficulty: level as any }))}
                    className={`
                      p-4 rounded-lg border-2 transition-all duration-200 text-center
                      ${formData.difficulty === level
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-dark-600 bg-dark-800/50 hover:border-dark-500'
                      }
                    `}
                  >
                    <div className={`text-lg font-bold mb-1 ${
                      formData.difficulty === level ? 'text-primary-300' : 'text-white'
                    }`}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </div>
                    <p className="text-xs text-dark-400">{description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Question Count and Time Limit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Number of Questions
                </label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={formData.questionCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              {formData.type !== 'practice-mode' && (
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Time Limit (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={formData.timeLimit}
                    onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Review and Generate */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Sparkles className="w-16 h-16 text-accent-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Review & Generate</h3>
              <p className="text-dark-300">AI is ready to create your personalized quiz</p>
            </div>

            <Card className="bg-dark-800/50">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-dark-300">Topic:</span>
                  <span className="text-white font-medium">{formData.topic}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-300">Type:</span>
                  <span className="text-white font-medium">
                    {QUIZ_TYPES[formData.type as keyof typeof QUIZ_TYPES].name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-300">Difficulty:</span>
                  <span className="text-white font-medium capitalize">{formData.difficulty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-300">Questions:</span>
                  <span className="text-white font-medium">{formData.questionCount}</span>
                </div>
                {formData.type !== 'practice-mode' && (
                  <div className="flex justify-between">
                    <span className="text-dark-300">Time Limit:</span>
                    <span className="text-white font-medium">{formData.timeLimit} minutes</span>
                  </div>
                )}
              </div>
            </Card>

            {generating && (
              <div className="text-center py-8">
                <Loader className="w-8 h-8 text-primary-400 mx-auto mb-4 animate-spin" />
                <p className="text-white font-medium">AI is generating your quiz...</p>
                <p className="text-dark-400 text-sm">This may take a few seconds</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t border-dark-700">
          <div>
            {step > 1 && !generating && (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button variant="outline" onClick={handleClose} disabled={generating}>
              Cancel
            </Button>
            {step < 3 ? (
              <Button 
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !formData.topic.trim()}
              >
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleGenerate}
                loading={generating}
                icon={Brain}
                disabled={!formData.topic.trim()}
              >
                Generate Quiz
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}