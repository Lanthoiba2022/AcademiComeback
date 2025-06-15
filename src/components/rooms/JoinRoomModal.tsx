import { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { UserPlus, Hash, CheckCircle, AlertCircle, Loader, Lock, Users } from 'lucide-react'
import { validateRoomCode } from '../../lib/supabase'

interface JoinRoomModalProps {
  isOpen: boolean
  onClose: () => void
  onJoinRoom: (code: string) => void
}

export const JoinRoomModal = ({ isOpen, onClose, onJoinRoom }: JoinRoomModalProps) => {
  const [roomCode, setRoomCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState('')
  const [validRoom, setValidRoom] = useState<any>(null)

  // Real-time validation as user types
  useEffect(() => {
    const validateCode = async () => {
      if (roomCode.length === 6) {
        setValidating(true)
        setError('')
        setValidRoom(null)
        
        try {
          const { data, error } = await validateRoomCode(roomCode)
          
          if (error || !data) {
            setError('Room not found. Please check the code and try again.')
            setValidRoom(null)
          } else if (!data.can_join) {
            if (!data.is_active) {
              setError('This room is not currently active.')
            } else if (data.member_count >= data.max_members) {
              setError('This room is full.')
            } else {
              setError('Unable to join this room.')
            }
            setValidRoom(null)
          } else {
            setValidRoom(data)
            setError('')
          }
        } catch (err) {
          setError('Failed to validate room code')
          setValidRoom(null)
        } finally {
          setValidating(false)
        }
      } else {
        setError('')
        setValidRoom(null)
        setValidating(false)
      }
    }

    const debounceTimer = setTimeout(validateCode, 300)
    return () => clearTimeout(debounceTimer)
  }, [roomCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!roomCode.trim()) {
      setError('Please enter a room code')
      return
    }

    if (roomCode.length !== 6) {
      setError('Room code must be 6 characters')
      return
    }

    if (!validRoom) {
      setError('Please enter a valid room code')
      return
    }

    setLoading(true)
    setError('')

    try {
      onJoinRoom(roomCode.toUpperCase())
      setRoomCode('')
      setValidRoom(null)
      setLoading(false)
      onClose()
    } catch (error) {
      setError('Failed to join room. Please try again.')
      setLoading(false)
    }
  }

  const handleClose = () => {
    setRoomCode('')
    setError('')
    setValidRoom(null)
    setValidating(false)
    onClose()
  }

  const handleCodeChange = (value: string) => {
    const cleanValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setRoomCode(cleanValue)
  }

  const getInputStatus = () => {
    if (roomCode.length === 0) return 'default'
    if (roomCode.length < 6) return 'typing'
    if (validating) return 'validating'
    if (validRoom) return 'valid'
    if (error) return 'invalid'
    return 'default'
  }

  const inputStatus = getInputStatus()

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title="Join Study Room"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-primary-400" />
          </div>
          <p className="text-dark-300">
            Enter the 6-character room code to join a study session
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-dark-300">
            Room Code
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="ABC123"
              value={roomCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              className={`
                w-full px-4 py-3 bg-dark-800/50 border rounded-lg
                text-white placeholder-dark-400 text-center text-lg font-mono tracking-wider
                focus:outline-none focus:ring-2 transition-all duration-200
                ${inputStatus === 'valid' ? 'border-green-500 focus:ring-green-500' : ''}
                ${inputStatus === 'invalid' ? 'border-red-500 focus:ring-red-500' : ''}
                ${inputStatus === 'default' || inputStatus === 'typing' ? 'border-dark-700 focus:ring-primary-500' : ''}
                ${inputStatus === 'validating' ? 'border-yellow-500 focus:ring-yellow-500' : ''}
              `}
              maxLength={6}
              autoComplete="off"
            />
            
            {/* Status Icons */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {inputStatus === 'validating' && (
                <Loader className="w-5 h-5 text-yellow-400 animate-spin" />
              )}
              {inputStatus === 'valid' && (
                <CheckCircle className="w-5 h-5 text-green-400" />
              )}
              {inputStatus === 'invalid' && (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
          </div>

          {/* Status Messages */}
          {validRoom && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-green-400 text-sm mb-2">
                <CheckCircle className="w-4 h-4" />
                <span>Found room: <strong>{validRoom.name}</strong></span>
              </div>
              <div className="space-y-1 text-xs text-green-300">
                {validRoom.is_private && (
                  <div className="flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Private room</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{validRoom.member_count}/{validRoom.max_members} members</span>
                </div>
                <p className="text-green-200 mt-2">{validRoom.description}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {roomCode.length > 0 && roomCode.length < 6 && (
            <p className="text-xs text-dark-400">
              {6 - roomCode.length} more character{6 - roomCode.length !== 1 ? 's' : ''} needed
            </p>
          )}
        </div>

        <div className="bg-dark-800/50 rounded-lg p-4">
          <h4 className="text-white font-medium mb-2">How to get a room code:</h4>
          <ul className="text-sm text-dark-300 space-y-1">
            <li>• Ask the room admin to share the code</li>
            <li>• Check your email for room invitations</li>
            <li>• Browse public rooms in the Discover section</li>
            <li>• Private rooms require the 6-character code to join</li>
          </ul>
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            type="submit"
            loading={loading}
            disabled={!validRoom || validating}
            icon={UserPlus}
          >
            Join Room
          </Button>
        </div>
      </form>
    </Modal>
  )
}