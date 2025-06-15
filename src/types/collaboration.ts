export interface VoiceMessage {
  id: string
  roomId: string
  userId: string
  userName: string
  userAvatar?: string
  audioUrl: string
  duration: number // seconds
  transcript?: string
  createdAt: string
  isPlaying?: boolean
}

export interface StudyNote {
  id: string
  roomId: string
  title: string
  content: string
  authorId: string
  authorName: string
  isShared: boolean
  collaborators: string[]
  tags: string[]
  createdAt: string
  updatedAt: string
  version: number
  comments: NoteComment[]
}

export interface NoteComment {
  id: string
  noteId: string
  userId: string
  userName: string
  content: string
  position?: { x: number; y: number } // for inline comments
  createdAt: string
}

export interface WhiteboardData {
  id: string
  roomId: string
  elements: WhiteboardElement[]
  background: string
  createdBy: string
  lastModified: string
  collaborators: string[]
}

export interface WhiteboardElement {
  id: string
  type: 'line' | 'rectangle' | 'circle' | 'text' | 'image'
  x: number
  y: number
  width?: number
  height?: number
  points?: number[] // for lines
  text?: string
  color: string
  strokeWidth: number
  createdBy: string
  createdAt: string
}

export interface CursorPosition {
  userId: string
  userName: string
  userColor: string
  x: number
  y: number
  lastSeen: string
}