import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { UserPlus, Hash } from 'lucide-react'

interface JoinRoomModalProps {
  isOpen: boolean
  onClose: () => void
  onJoinRoom: (code: string) => void
}

export const JoinRoomModal = ({ isOpen, onClose, onJoinRoom }: JoinRoomModalProps) => {
  const [roomCode, setRoomCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

    setLoading(true)
    setError('')

    // Simulate API call
    setTimeout(() => {
      // Mock validation - in real app, this would check if room exists
      const validCodes = ['JS2024', 'CALC2X', 'MCAT24', 'ESPANOL']
      
      if (validCodes.includes(roomCode.toUpperCase())) {
        onJoinRoom(roomCode.toUpperCase())
        setRoomCode('')
        setLoading(false)
        onClose()
      } else {
        setError('Room not found. Please check the code and try again.')
        setLoading(false)
      }
    }, 1000)
  }

  const handleClose = () => {
    setRoomCode('')
    setError('')
    onClose()
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title="Join Study Room"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="text-center">
          <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-primary-400" />
          </div>
          <p className="text-dark-300">
            Enter the 6-character room code to join a study session
          </p>
        </div>

        <Input
          label="Room Code"
          type="text"
          placeholder="Enter room code (e.g., ABC123)"
          value={roomCode}
          onChange={(e) => {
            const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
            setRoomCode(value)
            setError('')
          }}
          icon={Hash}
          className="text-center text-lg font-mono tracking-wider"
          required
        />

        <div className="bg-dark-800/50 rounded-lg p-4">
          <h4 className="text-white font-medium mb-2">How to get a room code:</h4>
          <ul className="text-sm text-dark-300 space-y-1">
            <li>• Ask the room admin to share the code</li>
            <li>• Check your email for room invitations</li>
            <li>• Browse public rooms in the Discover section</li>
          </ul>
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            type="submit"
            loading={loading}
            disabled={roomCode.length !== 6}
            icon={UserPlus}
          >
            Join Room
          </Button>
        </div>
      </form>
    </Modal>
  )
}