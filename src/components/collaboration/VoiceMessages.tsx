import { useState, useRef, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { PremiumGate } from '../premium/PremiumGate'
import { PremiumFeatureTooltip } from '../premium/PremiumFeatureTooltip'
import { 
  Mic, MicOff, Play, Pause, Volume2, VolumeX, 
  Download, Trash2, MoreVertical, Crown 
} from 'lucide-react'
import { VoiceMessage } from '../../types/collaboration'

interface VoiceMessagesProps {
  messages: VoiceMessage[]
  onSendVoiceMessage: (audioBlob: Blob, duration: number) => void
  onDeleteMessage: (messageId: string) => void
  currentUserId: string
}

export const VoiceMessages = ({ 
  messages, 
  onSendVoiceMessage, 
  onDeleteMessage, 
  currentUserId 
}: VoiceMessagesProps) => {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null)
  const [audioLevels, setAudioLevels] = useState<number[]>([])
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout>()
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Setup audio context for visualization
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)
      
      analyserRef.current.fftSize = 256
      const bufferLength = analyserRef.current.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      
      const updateAudioLevels = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength
          setAudioLevels(prev => [...prev.slice(-20), average / 255])
          animationFrameRef.current = requestAnimationFrame(updateAudioLevels)
        }
      }
      
      updateAudioLevels()
      
      // Setup media recorder
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        onSendVoiceMessage(audioBlob, recordingTime)
        
        // Cleanup
        stream.getTracks().forEach(track => track.stop())
        setRecordingTime(0)
        setAudioLevels([])
      }
      
      mediaRecorderRef.current.start()
      setIsRecording(true)
      
      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }

  const playMessage = (messageId: string, audioUrl: string) => {
    if (playingMessageId === messageId) {
      setPlayingMessageId(null)
      return
    }
    
    const audio = new Audio(audioUrl)
    audio.play()
    setPlayingMessageId(messageId)
    
    audio.onended = () => {
      setPlayingMessageId(null)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      {/* Recording Interface */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <PremiumGate feature="collaboration" showUpgradePrompt={false}>
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant={isRecording ? 'outline' : 'primary'}
                icon={isRecording ? MicOff : Mic}
                className={`${isRecording ? 'animate-pulse' : ''} bg-gradient-to-r from-green-500 to-blue-500`}
              >
                {isRecording ? 'Stop Recording' : 'Record Voice Message'}
              </Button>
            </PremiumGate>
            
            {!isRecording && (
              <PremiumFeatureTooltip
                feature="collaboration"
                title="Voice Messages"
                description="Send audio messages to your study partners with premium collaboration features."
              >
                <div className="flex items-center space-x-2 text-dark-400">
                  <Crown className="w-4 h-4 text-primary-400" />
                  <span className="text-sm">Premium Feature</span>
                </div>
              </PremiumFeatureTooltip>
            )}
            
            {isRecording && (
              <div className="flex items-center space-x-3">
                <span className="text-red-400 font-mono">
                  {formatTime(recordingTime)}
                </span>
                
                {/* Audio Visualization */}
                <div className="flex items-center space-x-1 h-8">
                  {audioLevels.slice(-20).map((level, index) => (
                    <div
                      key={index}
                      className="w-1 bg-primary-400 rounded-full transition-all duration-100"
                      style={{ height: `${Math.max(4, level * 32)}px` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {isRecording && (
            <div className="text-dark-400 text-sm">
              Press stop when finished
            </div>
          )}
        </div>
      </Card>

      {/* Voice Messages List */}
      <div className="space-y-3">
        {messages.map(message => {
          const isCurrentUser = message.userId === currentUserId
          const isPlaying = playingMessageId === message.id
          
          return (
            <div
              key={message.id}
              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs ${isCurrentUser ? 'order-2' : 'order-1'}`}>
                {!isCurrentUser && (
                  <div className="flex items-center space-x-2 mb-1">
                    {message.userAvatar ? (
                      <img
                        src={message.userAvatar}
                        alt={message.userName}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                        <span className="text-xs text-white font-medium">
                          {message.userName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <span className="text-dark-400 text-sm">{message.userName}</span>
                  </div>
                )}
                
                <Card className={`${
                  isCurrentUser 
                    ? 'bg-primary-500/20 border-primary-500/30' 
                    : 'bg-dark-800/50'
                }`}>
                  <div className="flex items-center space-x-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => playMessage(message.id, message.audioUrl)}
                      icon={isPlaying ? Pause : Play}
                      className="flex-shrink-0"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Volume2 className="w-4 h-4 text-dark-400" />
                        <span className="text-white font-medium">
                          {formatTime(message.duration)}
                        </span>
                      </div>
                      
                      {/* Waveform visualization placeholder */}
                      <div className="flex items-center space-x-1 h-6">
                        {Array.from({ length: 20 }).map((_, index) => (
                          <div
                            key={index}
                            className={`w-1 rounded-full transition-all duration-200 ${
                              isPlaying 
                                ? 'bg-primary-400 animate-pulse' 
                                : 'bg-dark-600'
                            }`}
                            style={{ 
                              height: `${Math.random() * 16 + 4}px`,
                              animationDelay: `${index * 50}ms`
                            }}
                          />
                        ))}
                      </div>
                      
                      {message.transcript && (
                        <p className="text-dark-300 text-sm mt-2 italic">
                          "{message.transcript}"
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = message.audioUrl
                          link.download = `voice-message-${message.id}.wav`
                          link.click()
                        }}
                        icon={Download}
                      />
                      
                      {isCurrentUser && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDeleteMessage(message.id)}
                          icon={Trash2}
                          className="text-red-400 hover:text-red-300"
                        />
                      )}
                    </div>
                  </div>
                  
                  <div className="text-xs text-dark-500 mt-2 text-right">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </div>
                </Card>
              </div>
            </div>
          )
        })}
      </div>

      {messages.length === 0 && (
        <div className="text-center py-8">
          <Mic className="w-12 h-12 text-dark-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Voice Messages</h3>
          <p className="text-dark-300 mb-4">Record your first voice message to get started</p>
          <PremiumGate feature="collaboration">
            <Button onClick={startRecording} icon={Mic}>
              Record Message
            </Button>
          </PremiumGate>
        </div>
      )}
    </div>
  )
}