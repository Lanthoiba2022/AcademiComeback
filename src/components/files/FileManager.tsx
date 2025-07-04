import { useState, useRef } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { 
  Upload, File, Image, Video, Music, FileText, Download, 
  Star, MessageSquare, Eye, Trash2, Share2, Filter, Search,
  Grid, List, FolderOpen, Plus, Tag
} from 'lucide-react'
import { StudyFile, FileComment, FileFilter } from '../../types/files'

interface FileManagerProps {
  files: StudyFile[]
  onUpload: (files: FileList) => void
  onDownload: (fileId: string) => void
  onDelete: (fileId: string) => void
  onFavorite: (fileId: string) => void
  onComment: (fileId: string, comment: string) => void
  roomId: string
}

export const FileManager = ({ 
  files, 
  onUpload, 
  onDownload, 
  onDelete, 
  onFavorite, 
  onComment,
  roomId 
}: FileManagerProps) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedFile, setSelectedFile] = useState<StudyFile | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showFileModal, setShowFileModal] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [filter, setFilter] = useState<FileFilter>({})
  const [searchTerm, setSearchTerm] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const categories = [
    { id: 'all', name: 'All Files', icon: FolderOpen },
    { id: 'document', name: 'Documents', icon: FileText },
    { id: 'image', name: 'Images', icon: Image },
    { id: 'video', name: 'Videos', icon: Video },
    { id: 'audio', name: 'Audio', icon: Music },
    { id: 'other', name: 'Other', icon: File }
  ]

  const getFileIcon = (type: string, category: string) => {
    if (category === 'image') return Image
    if (category === 'video') return Video
    if (category === 'audio') return Music
    if (type.includes('pdf')) return FileText
    return File
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredFiles = files.filter(file => {
    const matchesSearch = !searchTerm || 
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !filter.category || filter.category === 'all' || file.category === filter.category
    const matchesType = !filter.type || file.type.includes(filter.type)
    const matchesTags = !filter.tags?.length || filter.tags.some(tag => file.tags.includes(tag))
    
    return matchesSearch && matchesCategory && matchesType && matchesTags
  })

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      onUpload(files)
    }
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onUpload(files)
    }
  }

  const handleAddComment = () => {
    if (selectedFile && newComment.trim()) {
      onComment(selectedFile.id, newComment.trim())
      setNewComment('')
    }
  }

  const renderGridView = () => (
    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
      {filteredFiles.map(file => {
        const FileIcon = getFileIcon(file.type, file.category)
        
        return (
          <Card 
            key={file.id} 
            className="hover:scale-105 transition-transform duration-200 cursor-pointer p-3 sm:p-6"
          >
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                setSelectedFile(file)
                setShowFileModal(true)
              }}
              onKeyPress={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedFile(file)
                  setShowFileModal(true)
                }
              }}
              className="outline-none"
            >
              <div className="text-center">
                {file.thumbnailUrl ? (
                  <img
                    src={file.thumbnailUrl}
                    alt={file.name}
                    className="w-full h-24 sm:h-32 object-cover rounded-lg mb-2 sm:mb-3"
                  />
                ) : (
                  <div className="w-full h-24 sm:h-32 bg-dark-800 rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                    <FileIcon className="w-10 h-10 sm:w-12 sm:h-12 text-dark-400" />
                  </div>
                )}
                
                <h4 className="text-white font-medium mb-1 truncate text-sm sm:text-base">{file.name}</h4>
                <p className="text-dark-400 text-xs sm:text-sm">{formatFileSize(file.size)}</p>
                
                <div className="flex items-center justify-between mt-2 sm:mt-3 text-xs text-dark-400">
                  <span>{file.downloadCount} downloads</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onFavorite(file.id)
                      }}
                      className="hover:text-yellow-400 transition-colors"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                    <span>{file.comments.length}</span>
                    <MessageSquare className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )

  const renderListView = () => (
    <div className="space-y-2">
      {filteredFiles.map(file => {
        const FileIcon = getFileIcon(file.type, file.category)
        
        return (
          <Card 
            key={file.id} 
            className="hover:bg-dark-800/70 transition-colors duration-200 cursor-pointer p-3 sm:p-6"
          >
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                setSelectedFile(file)
                setShowFileModal(true)
              }}
              onKeyPress={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedFile(file)
                  setShowFileModal(true)
                }
              }}
              className="outline-none"
            >
              <div className="flex flex-col xs:flex-row items-start xs:items-center space-y-2 xs:space-y-0 xs:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-dark-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileIcon className="w-6 h-6 sm:w-8 sm:h-8 text-dark-400" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium truncate text-sm sm:text-base">{file.name}</h4>
                  <p className="text-dark-400 text-xs sm:text-sm">{file.description || 'No description'}</p>
                </div>
                
                <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-dark-400">
                  <span>{formatFileSize(file.size)}</span>
                  <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                  <div className="flex items-center space-x-1">
                    <Download className="w-4 h-4" />
                    <span>{file.downloadCount}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDownload(file.id)
                    }}
                    icon={Download}
                    className="text-xs sm:text-sm"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      onFavorite(file.id)
                    }}
                    icon={Star}
                    className="text-xs sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 sm:mb-2">File Library</h2>
          <p className="text-dark-300 text-sm sm:text-base">Share and organize study materials</p>
        </div>
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0">
          <div className="flex flex-row xs:flex-row gap-1 w-full xs:w-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg w-full xs:w-auto transition-colors ${
                viewMode === 'grid' ? 'bg-primary-500 text-white' : 'bg-dark-800 text-dark-300 hover:text-white'
              }`}
              aria-label="Grid view"
            >
              <Grid className="w-4 h-4 mx-auto" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg w-full xs:w-auto transition-colors ${
                viewMode === 'list' ? 'bg-primary-500 text-white' : 'bg-dark-800 text-dark-300 hover:text-white'
              }`}
              aria-label="List view"
            >
              <List className="w-4 h-4 mx-auto" />
            </button>
          </div>
          <Button onClick={handleFileSelect} icon={Upload} className="w-full xs:w-auto text-sm py-2">
            Upload Files
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
              className="text-sm py-2"
            />
          </div>
          <div className="flex space-x-2 overflow-x-auto custom-scrollbar pb-1 -mx-2 px-2">
            {categories.map(category => {
              const Icon = category.icon
              return (
                <button
                  key={category.id}
                  onClick={() => setFilter(prev => ({ 
                    ...prev, 
                    category: category.id === 'all' ? undefined : category.id 
                  }))}
                  className={`
                    flex items-center space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap
                    ${(!filter.category && category.id === 'all') || filter.category === category.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white'
                    }
                    text-xs sm:text-sm
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{category.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Drop Zone */}
      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-dark-600 rounded-lg p-4 sm:p-8 text-center hover:border-primary-500 transition-colors duration-200"
      >
        <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-dark-400 mx-auto mb-3 sm:mb-4" />
        <p className="text-white font-medium mb-1 sm:mb-2 text-base sm:text-lg">Drag and drop files here</p>
        <p className="text-dark-400 text-xs sm:text-sm mb-3 sm:mb-4">or click to browse</p>
        <Button onClick={handleFileSelect} variant="outline" className="w-full sm:w-auto text-sm py-2">
          Choose Files
        </Button>
      </div>

      {/* Files */}
      {filteredFiles.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <FolderOpen className="w-12 h-12 sm:w-16 sm:h-16 text-dark-400 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">No Files Found</h3>
          <p className="text-dark-300 mb-3 sm:mb-4 text-sm sm:text-base">Upload some files to get started</p>
          <Button onClick={handleFileSelect} icon={Upload} className="w-full sm:w-auto text-sm py-2">
            Upload First File
          </Button>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? renderGridView() : renderListView()}
        </>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
        accept="*/*"
      />

      {/* File Details Modal */}
      <Modal
        isOpen={showFileModal}
        onClose={() => setShowFileModal(false)}
        title={selectedFile?.name || ''}
        size="lg"
      >
        {selectedFile && (
          <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
            {/* File Preview */}
            <div className="text-center">
              {selectedFile.category === 'image' && selectedFile.url ? (
                <img
                  src={selectedFile.url}
                  alt={selectedFile.name}
                  className="max-w-full max-h-40 sm:max-h-64 mx-auto rounded-lg"
                />
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-dark-800 rounded-lg flex items-center justify-center mx-auto">
                  {(() => {
                    const FileIcon = getFileIcon(selectedFile.type, selectedFile.category)
                    return <FileIcon className="w-10 h-10 sm:w-16 sm:h-16 text-dark-400" />
                  })()}
                </div>
              )}
            </div>

            {/* File Info */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
              <div>
                <span className="text-dark-400">Size:</span>
                <span className="text-white ml-2">{formatFileSize(selectedFile.size)}</span>
              </div>
              <div>
                <span className="text-dark-400">Type:</span>
                <span className="text-white ml-2">{selectedFile.type}</span>
              </div>
              <div>
                <span className="text-dark-400">Uploaded:</span>
                <span className="text-white ml-2">{new Date(selectedFile.uploadedAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-dark-400">Downloads:</span>
                <span className="text-white ml-2">{selectedFile.downloadCount}</span>
              </div>
            </div>

            {/* Description */}
            {selectedFile.description && (
              <div>
                <h4 className="text-white font-medium mb-1 sm:mb-2 text-sm sm:text-base">Description</h4>
                <p className="text-dark-300 text-xs sm:text-sm">{selectedFile.description}</p>
              </div>
            )}

            {/* Tags */}
            {selectedFile.tags.length > 0 && (
              <div>
                <h4 className="text-white font-medium mb-1 sm:mb-2 text-sm sm:text-base">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedFile.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-primary-500/20 text-primary-400 rounded text-xs sm:text-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col xs:flex-row gap-2 xs:gap-3">
              <Button onClick={() => onDownload(selectedFile.id)} icon={Download} className="w-full xs:w-auto text-xs sm:text-sm py-2">
                Download
              </Button>
              <Button variant="outline" onClick={() => onFavorite(selectedFile.id)} icon={Star} className="w-full xs:w-auto text-xs sm:text-sm py-2">
                Favorite
              </Button>
              <Button variant="outline" icon={Share2} className="w-full xs:w-auto text-xs sm:text-sm py-2">
                Share
              </Button>
              <Button variant="outline" onClick={() => onDelete(selectedFile.id)} icon={Trash2} className="w-full xs:w-auto text-xs sm:text-sm py-2">
                Delete
              </Button>
            </div>

            {/* Comments */}
            <div>
              <h4 className="text-white font-medium mb-2 sm:mb-4 text-sm sm:text-base">Comments ({selectedFile.comments.length})</h4>
              <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4 max-h-32 sm:max-h-64 overflow-y-auto custom-scrollbar">
                {selectedFile.comments.map(comment => (
                  <div key={comment.id} className="flex space-x-2 sm:space-x-3">
                    {comment.userAvatar ? (
                      <img
                        src={comment.userAvatar}
                        alt={comment.userName}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary-500 flex items-center justify-center">
                        <span className="text-xs text-white font-medium">
                          {comment.userName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-1 sm:space-x-2 mb-0.5 sm:mb-1">
                        <span className="text-white font-medium text-xs sm:text-sm">{comment.userName}</span>
                        <span className="text-dark-400 text-[10px] sm:text-xs">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-dark-300 text-xs sm:text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 sm:gap-3">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  className="flex-1 px-3 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-xs sm:text-sm text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <Button onClick={handleAddComment} disabled={!newComment.trim()} className="text-xs sm:text-sm py-2">
                  Comment
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}