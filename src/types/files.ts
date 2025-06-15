export interface StudyFile {
  id: string
  name: string
  originalName: string
  type: string
  size: number
  url: string
  thumbnailUrl?: string
  roomId: string
  uploadedBy: string
  uploadedAt: string
  description?: string
  tags: string[]
  category: 'document' | 'image' | 'video' | 'audio' | 'other'
  isPublic: boolean
  downloadCount: number
  favoriteCount: number
  comments: FileComment[]
  version: number
  parentFileId?: string // for versioning
}

export interface FileComment {
  id: string
  fileId: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  createdAt: string
  updatedAt?: string
  replies: FileComment[]
}

export interface FileUploadProgress {
  fileId: string
  fileName: string
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
}

export interface FileFilter {
  category?: string
  type?: string
  uploadedBy?: string
  dateRange?: {
    start: string
    end: string
  }
  tags?: string[]
  search?: string
}