import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Plus, Users, Lock, Globe, Tag, X } from 'lucide-react'
import { generateRoomCode } from '../../utils/roomUtils'
import { popularTags } from '../../data/mockData'

interface CreateRoomModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateRoom: (roomData: any) => void
}

export const CreateRoomModal = ({ isOpen, onClose, onCreateRoom }: CreateRoomModalProps) => {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: [] as string[],
    maxMembers: 10,
    isPrivate: false,
    code: generateRoomCode()
  })
  const [newTag, setNewTag] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Room name is required'
    } else if (formData.name.length < 3) {
      newErrors.name = 'Room name must be at least 3 characters'
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}
    
    if (formData.tags.length === 0) {
      newErrors.tags = 'At least one tag is required'
    }
    
    if (formData.maxMembers < 2 || formData.maxMembers > 50) {
      newErrors.maxMembers = 'Max members must be between 2 and 50'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const handleBack = () => {
    setStep(step - 1)
    setErrors({})
  }

  const handleSubmit = async () => {
    setLoading(true)
    
    try {
      onCreateRoom({
        name: formData.name,
        description: formData.description,
        tags: formData.tags,
        max_members: formData.maxMembers,
        is_private: formData.isPrivate
      })
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        tags: [],
        maxMembers: 10,
        isPrivate: false,
        code: generateRoomCode()
      })
      setStep(1)
      setErrors({})
      setLoading(false)
      onClose()
    } catch (error) {
      console.error('Error creating room:', error)
      setLoading(false)
    }
  }

  const addTag = (tag: string) => {
    const cleanTag = tag.toLowerCase().trim()
    if (cleanTag && !formData.tags.includes(cleanTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, cleanTag]
      }))
    }
    setNewTag('')
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleClose = () => {
    setStep(1)
    setErrors({})
    setFormData({
      name: '',
      description: '',
      tags: [],
      maxMembers: 10,
      isPrivate: false,
      code: generateRoomCode()
    })
    onClose()
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title="Create Study Room"
      size="lg"
    >
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

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
            
            <Input
              label="Room Name"
              placeholder="e.g., Advanced JavaScript Study Group"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              error={errors.name}
              required
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-dark-300">
                Description
              </label>
              <textarea
                placeholder="Describe what you'll be studying and what members can expect..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className={`
                  w-full px-4 py-3 bg-dark-800/50 border rounded-lg
                  text-white placeholder-dark-400
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                  transition-all duration-200 resize-none
                  ${errors.description ? 'border-red-500' : 'border-dark-700'}
                `}
              />
              {errors.description && (
                <p className="text-sm text-red-400">{errors.description}</p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Settings */}
        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">Room Settings</h3>
            
            {/* Tags */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-dark-300">
                Tags <span className="text-red-400">*</span>
              </label>
              
              {/* Selected Tags */}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 bg-primary-500/20 text-primary-300 rounded-full text-sm"
                    >
                      #{tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-primary-400 hover:text-primary-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add Tag Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag (e.g., javascript, math)"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag(newTag)
                    }
                  }}
                  icon={Tag}
                />
                <Button
                  onClick={() => addTag(newTag)}
                  disabled={!newTag.trim()}
                  size="md"
                >
                  Add
                </Button>
              </div>

              {/* Popular Tags */}
              <div className="space-y-2">
                <p className="text-sm text-dark-400">Popular tags:</p>
                <div className="flex flex-wrap gap-2">
                  {popularTags.slice(0, 12).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => addTag(tag)}
                      disabled={formData.tags.includes(tag)}
                      className={`
                        px-3 py-1 rounded-full text-sm transition-colors duration-200
                        ${formData.tags.includes(tag)
                          ? 'bg-primary-500/20 text-primary-300 cursor-not-allowed'
                          : 'bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-white'
                        }
                      `}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              {errors.tags && (
                <p className="text-sm text-red-400">{errors.tags}</p>
              )}
            </div>

            {/* Max Members */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-dark-300">
                Maximum Members
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="2"
                  max="50"
                  value={formData.maxMembers}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxMembers: parseInt(e.target.value) }))}
                  className="flex-1 h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <span className="text-white font-medium w-12 text-center">
                  {formData.maxMembers}
                </span>
              </div>
              {errors.maxMembers && (
                <p className="text-sm text-red-400">{errors.maxMembers}</p>
              )}
            </div>

            {/* Privacy Setting */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-dark-300">
                Privacy
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setFormData(prev => ({ ...prev, isPrivate: false }))}
                  className={`
                    p-4 rounded-lg border-2 transition-all duration-200
                    ${!formData.isPrivate
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-dark-600 bg-dark-800/50 hover:border-dark-500'
                    }
                  `}
                >
                  <Globe className={`w-6 h-6 mx-auto mb-2 ${!formData.isPrivate ? 'text-primary-400' : 'text-dark-400'}`} />
                  <p className={`font-medium ${!formData.isPrivate ? 'text-primary-300' : 'text-dark-300'}`}>
                    Public
                  </p>
                  <p className="text-sm text-dark-400 mt-1">
                    Anyone can discover and join
                  </p>
                </button>
                
                <button
                  onClick={() => setFormData(prev => ({ ...prev, isPrivate: true }))}
                  className={`
                    p-4 rounded-lg border-2 transition-all duration-200
                    ${formData.isPrivate
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-dark-600 bg-dark-800/50 hover:border-dark-500'
                    }
                  `}
                >
                  <Lock className={`w-6 h-6 mx-auto mb-2 ${formData.isPrivate ? 'text-primary-400' : 'text-dark-400'}`} />
                  <p className={`font-medium ${formData.isPrivate ? 'text-primary-300' : 'text-dark-300'}`}>
                    Private
                  </p>
                  <p className="text-sm text-dark-400 mt-1">
                    Invite-only with room code
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white mb-4">Review & Create</h3>
            
            <div className="bg-dark-800/50 rounded-lg p-6 space-y-4">
              <div>
                <h4 className="text-white font-medium mb-1">{formData.name}</h4>
                <p className="text-dark-300 text-sm">{formData.description}</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-primary-500/20 text-primary-300 rounded text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-dark-300">
                  <Users className="w-4 h-4 mr-2" />
                  Max {formData.maxMembers} members
                </div>
                <div className="flex items-center text-dark-300">
                  {formData.isPrivate ? (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Private
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4 mr-2" />
                      Public
                    </>
                  )}
                </div>
              </div>
              
              <div className="pt-4 border-t border-dark-700">
                <p className="text-sm text-dark-300 mb-2">Room Code:</p>
                <div className="flex items-center justify-between bg-dark-700 rounded-lg p-3">
                  <code className="text-primary-400 font-mono text-lg font-bold">
                    {formData.code}
                  </code>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, code: generateRoomCode() }))}
                    className="text-dark-400 hover:text-white text-sm transition-colors"
                  >
                    Generate New
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-6 border-t border-dark-700">
          <div>
            {step > 1 && (
              <Button variant="ghost" onClick={handleBack}>
                Back
              </Button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            {step < 3 ? (
              <Button onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                loading={loading}
                icon={Plus}
              >
                Create Room
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}