import { useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { 
  Circle, CheckCircle, AlertCircle, Clock, User, Edit3, 
  Trash2, MoreVertical, GripVertical 
} from 'lucide-react'
import { Task, User as UserType } from '../../types'

interface TaskItemProps {
  task: Task
  members: UserType[]
  onUpdate: (taskId: string, updates: Partial<Task>) => void
  onDelete: (taskId: string) => void
  onReorder: (startIndex: number, endIndex: number) => void
  index: number
}

export const TaskItem = ({ task, members, onUpdate, onDelete, index }: TaskItemProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDescription, setEditDescription] = useState(task.description)
  const [editDuration, setEditDuration] = useState(task.duration)
  const [showActions, setShowActions] = useState(false)

  const assignee = members.find(m => m.id === task.assigneeId)

  const getStatusIcon = () => {
    switch (task.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'in-progress':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />
      default:
        return <Circle className="w-5 h-5 text-dark-400" />
    }
  }

  const getStatusColor = () => {
    switch (task.status) {
      case 'completed':
        return 'border-green-500/30 bg-green-500/10'
      case 'in-progress':
        return 'border-yellow-500/30 bg-yellow-500/10'
      default:
        return 'border-dark-600 bg-dark-800/30'
    }
  }

  const handleSave = () => {
    onUpdate(task.id, {
      title: editTitle,
      description: editDescription,
      duration: editDuration
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditTitle(task.title)
    setEditDescription(task.description)
    setEditDuration(task.duration)
    setIsEditing(false)
  }

  const toggleStatus = () => {
    const nextStatus = task.status === 'pending' ? 'in-progress' : 
                      task.status === 'in-progress' ? 'completed' : 'pending'
    onUpdate(task.id, { status: nextStatus })
  }

  const changeAssignee = (assigneeId: string) => {
    onUpdate(task.id, { assigneeId })
    setShowActions(false)
  }

  if (isEditing) {
    return (
      <div className="bg-card-gradient backdrop-blur-xl border border-dark-600 rounded-lg p-4 animate-slide-down">
        <div className="space-y-3">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Task title"
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Task description (optional)"
            rows={2}
            className="w-full px-3 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none"
          />
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-dark-400" />
              <input
                type="number"
                value={editDuration}
                onChange={(e) => setEditDuration(parseInt(e.target.value) || 0)}
                min="5"
                max="180"
                className="w-20 px-2 py-1 bg-dark-800/50 border border-dark-700 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <span className="text-sm text-dark-400">min</span>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`group relative border rounded-lg p-4 transition-all duration-200 hover:shadow-lg hover:shadow-primary-500/10 ${getStatusColor()}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Drag Handle */}
      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <GripVertical className="w-4 h-4 text-dark-400 cursor-grab" />
      </div>

      <div className="flex items-start space-x-3 ml-6">
        {/* Status Icon */}
        <button
          onClick={toggleStatus}
          className="mt-1 hover:scale-110 transition-transform duration-200"
        >
          {getStatusIcon()}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`font-medium ${
                task.status === 'completed' ? 'text-dark-400 line-through' : 'text-white'
              }`}>
                {task.title}
              </h4>
              {task.description && (
                <p className="text-sm text-dark-300 mt-1">{task.description}</p>
              )}
              
              <div className="flex items-center space-x-4 mt-2">
                {/* Duration */}
                <div className="flex items-center space-x-1 text-xs text-dark-400">
                  <Clock className="w-3 h-3" />
                  <span>{task.duration}min</span>
                </div>

                {/* Assignee */}
                {assignee && (
                  <div className="flex items-center space-x-2">
                    {assignee.avatar ? (
                      <img
                        src={assignee.avatar}
                        alt={assignee.name}
                        className="w-5 h-5 rounded-full"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                        <User className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <span className="text-xs text-dark-300">{assignee.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex items-center space-x-1 animate-fade-in">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Edit3}
                  onClick={() => setIsEditing(true)}
                />
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={MoreVertical}
                  />
                  {/* Dropdown menu would go here */}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  onClick={() => onDelete(task.id)}
                  className="text-red-400 hover:text-red-300"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}