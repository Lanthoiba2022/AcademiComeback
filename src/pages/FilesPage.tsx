import { useState, useEffect } from 'react'
import { Sidebar } from '../components/dashboard/Sidebar'
import { FileManager } from '../components/files/FileManager'
import { StudyFile } from '../types/files'

// Mock data generator
const generateMockFiles = (): StudyFile[] => {
  const files: StudyFile[] = [
    {
      id: '1',
      name: 'JavaScript Fundamentals.pdf',
      originalName: 'JavaScript Fundamentals.pdf',
      type: 'application/pdf',
      size: 2048576, // 2MB
      url: '/mock-files/javascript-fundamentals.pdf',
      roomId: 'room-1',
      uploadedBy: 'user-1',
      uploadedAt: new Date().toISOString(),
      description: 'Comprehensive guide to JavaScript basics',
      tags: ['javascript', 'programming', 'fundamentals'],
      category: 'document',
      isPublic: true,
      downloadCount: 15,
      favoriteCount: 8,
      comments: [
        {
          id: 'comment-1',
          fileId: '1',
          userId: 'user-2',
          userName: 'Alice Johnson',
          content: 'Great resource! Really helped me understand closures.',
          createdAt: new Date().toISOString(),
          replies: []
        }
      ],
      version: 1
    },
    {
      id: '2',
      name: 'React Components Diagram.png',
      originalName: 'React Components Diagram.png',
      type: 'image/png',
      size: 512000, // 512KB
      url: 'https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=800',
      thumbnailUrl: 'https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=200',
      roomId: 'room-1',
      uploadedBy: 'user-2',
      uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      description: 'Visual diagram showing React component hierarchy',
      tags: ['react', 'components', 'diagram'],
      category: 'image',
      isPublic: true,
      downloadCount: 23,
      favoriteCount: 12,
      comments: [],
      version: 1
    },
    {
      id: '3',
      name: 'Study Notes - Week 1.docx',
      originalName: 'Study Notes - Week 1.docx',
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 1024000, // 1MB
      url: '/mock-files/study-notes-week1.docx',
      roomId: 'room-1',
      uploadedBy: 'user-3',
      uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Comprehensive notes from the first week of study',
      tags: ['notes', 'week1', 'summary'],
      category: 'document',
      isPublic: false,
      downloadCount: 7,
      favoriteCount: 3,
      comments: [],
      version: 2
    }
  ]

  return files
}

export const FilesPage = () => {
  const [files, setFiles] = useState<StudyFile[]>([])

  useEffect(() => {
    // In a real app, this would fetch from the API
    setFiles(generateMockFiles())
  }, [])

  const handleUpload = (fileList: FileList) => {
    Array.from(fileList).forEach(file => {
      const newFile: StudyFile = {
        id: `file-${Date.now()}-${Math.random()}`,
        name: file.name,
        originalName: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        roomId: 'current-room',
        uploadedBy: 'current-user',
        uploadedAt: new Date().toISOString(),
        description: '',
        tags: [],
        category: file.type.startsWith('image/') ? 'image' :
                 file.type.startsWith('video/') ? 'video' :
                 file.type.startsWith('audio/') ? 'audio' :
                 file.type.includes('document') || file.type.includes('pdf') ? 'document' : 'other',
        isPublic: true,
        downloadCount: 0,
        favoriteCount: 0,
        comments: [],
        version: 1
      }

      setFiles(prev => [newFile, ...prev])
    })
  }

  const handleDownload = (fileId: string) => {
    const file = files.find(f => f.id === fileId)
    if (file) {
      // In a real app, this would trigger a download
      console.log('Downloading file:', file.name)
      
      // Update download count
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, downloadCount: f.downloadCount + 1 }
          : f
      ))
    }
  }

  const handleDelete = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const handleFavorite = (fileId: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, favoriteCount: f.favoriteCount + 1 }
        : f
    ))
  }

  const handleComment = (fileId: string, comment: string) => {
    const newComment = {
      id: `comment-${Date.now()}`,
      fileId,
      userId: 'current-user',
      userName: 'Current User',
      content: comment,
      createdAt: new Date().toISOString(),
      replies: []
    }

    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, comments: [...f.comments, newComment] }
        : f
    ))
  }

  return (
    <div className="min-h-screen bg-hero-gradient">
      <Sidebar />
      <div className="lg:ml-64 p-4 lg:p-8">
        <FileManager
          files={files}
          onUpload={handleUpload}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onFavorite={handleFavorite}
          onComment={handleComment}
          roomId="current-room"
        />
      </div>
    </div>
  )
}