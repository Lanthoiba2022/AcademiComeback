import { useRef } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Upload, Image, File, Video, X } from 'lucide-react'

interface FileUploadProps {
  onFileSelect: (files: FileList) => void
}

export const FileUpload = ({ onFileSelect }: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      onFileSelect(files)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const files = event.dataTransfer.files
    if (files.length > 0) {
      onFileSelect(files)
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-6 h-6 text-blue-400" />
    } else if (file.type.startsWith('video/')) {
      return <Video className="w-6 h-6 text-purple-400" />
    } else {
      return <File className="w-6 h-6 text-gray-400" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card className="w-80 p-4 bg-dark-800 border border-dark-700 shadow-xl">
      <div className="text-center mb-4">
        <Upload className="w-8 h-8 text-primary-400 mx-auto mb-2" />
        <h3 className="text-lg font-semibold text-white mb-1">Upload Files</h3>
        <p className="text-sm text-dark-400">
          Drag and drop files here or click to browse
        </p>
      </div>

      <div
        className="border-2 border-dashed border-dark-600 rounded-lg p-6 text-center hover:border-primary-500 transition-colors duration-200"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip,.rar"
        />
        
        <Upload className="w-12 h-12 text-dark-400 mx-auto mb-4" />
        <p className="text-white mb-2">Drop files here or click to upload</p>
        <p className="text-xs text-dark-400">
          Supports: Images, Videos, Documents (max 10MB each)
        </p>
      </div>

      <div className="mt-4 space-y-2">
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="w-full"
        >
          Browse Files
        </Button>
      </div>
    </Card>
  )
} 