import { Reply } from 'lucide-react'

interface ReplyMessageProps {
  replyTo: {
    id: string
    userName: string
    message: string
  }
}

export const ReplyMessage = ({ replyTo }: ReplyMessageProps) => {
  return (
    <div className="mb-2 p-2 bg-dark-700/50 rounded-lg border-l-4 border-primary-500">
      <div className="flex items-center space-x-2 mb-1">
        <Reply className="w-3 h-3 text-primary-400" />
        <span className="text-xs text-primary-400 font-medium">
          {replyTo.userName}
        </span>
      </div>
      <p className="text-xs text-dark-300 truncate">
        {replyTo.message}
      </p>
    </div>
  )
} 