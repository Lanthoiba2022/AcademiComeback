import { useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { 
  Circle, CheckCircle, AlertCircle, Clock, User, Edit3, 
  Trash2, MoreVertical, GripVertical 
} from 'lucide-react'
import { Task, User as UserType, TaskStatus } from '../../types'
import { UserStatusDropdown } from './UserStatusDropdown'

interface TaskItemProps {
  task: Task
  members: UserType[]
  currentUserId: string
  onUpdate: (taskId: string, updates: Partial<Task>) => void
  onDelete: (taskId: string) => void
  index: number
}

export const TaskItem = ({ task, members, currentUserId, onUpdate, onDelete, index }: TaskItemProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDescription, setEditDescription] = useState(task.description)
  const [editPriority, setEditPriority] = useState(task.priority)
  const [showActions, setShowActions] = useState(false)

  const assignee = members.find(m => m.id === task.assigneeId)
  const isCreator = currentUserId === task.createdBy

  const statusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'In Progress': return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'In Review': return <AlertCircle className="w-5 h-5 text-blue-400" />;
      default: return <Circle className="w-5 h-5 text-dark-400" />;
    }
  };

  const getStatusColor = () => {
    switch (task.status) {
      case 'Completed':
        return 'border-green-500/30 bg-green-500/10'
      case 'In Progress':
        return 'border-yellow-500/30 bg-yellow-500/10'
      case 'In Review':
        return 'border-blue-500/30 bg-blue-500/10'
      default:
        return 'border-dark-600 bg-dark-800/30'
    }
  }

  const getPriorityStyle = () => {
    switch (task.priority) {
      case 'High':
        return 'border-red-500/40 bg-red-500/10'
      case 'Medium':
        return 'border-yellow-500/40 bg-yellow-500/10'
      case 'Low':
        return 'border-blue-500/40 bg-blue-500/10'
      default:
        return ''
    }
  }

  const handleSave = () => {
    onUpdate(task.id, {
      title: editTitle,
      description: editDescription,
      priority: editPriority
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditTitle(task.title)
    setEditDescription(task.description)
    setEditPriority(task.priority)
    setIsEditing(false)
  }

  const toggleStatus = () => {
    let nextStatus: TaskStatus;
    switch (task.status) {
      case 'Todo':
        nextStatus = 'In Progress';
        break;
      case 'In Progress':
        nextStatus = 'In Review';
        break;
      case 'In Review':
        nextStatus = 'Completed';
        break;
      case 'Completed':
      default:
        nextStatus = 'Todo';
        break;
    }
    onUpdate(task.id, { status: nextStatus });
  }

  const changeAssignee = (assigneeId: string) => {
    onUpdate(task.id, { assigneeId })
    setShowActions(false)
  }

  if (isEditing) {
    return (
      <div className={`bg-card-gradient backdrop-blur-xl border rounded-lg p-4 animate-slide-down ${getPriorityStyle()}`}>
        <div className="space-y-3">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Task title"
            disabled={!isCreator}
            className={isCreator ? '' : 'opacity-60 cursor-not-allowed'}
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Task description (optional)"
            rows={2}
            className={`w-full px-3 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 resize-none ${isCreator ? '' : 'opacity-60 cursor-not-allowed'}`}
            disabled={!isCreator}
          />
          <div className="flex items-center space-x-3">
            <label className="text-sm text-dark-400">Priority:</label>
            <select
              value={editPriority}
              onChange={e => setEditPriority(e.target.value as any)}
              disabled={!isCreator}
              className={`px-2 py-1 rounded border ${isCreator ? '' : 'opacity-60 cursor-not-allowed'}`}
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            {isCreator && (
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
            )}
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
      <div className="flex items-start justify-between">
        {/* Left: Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`font-medium flex items-center gap-2 ${task.status === 'Completed' ? 'text-dark-400 line-through' : 'text-white'}`}>
                {statusIcon(task.status)}
                {task.title}
              </h4>
              {task.description && (
                <p className="text-sm text-dark-300 mt-1">{task.description}</p>
              )}
              <div className="flex items-center space-x-4 mt-2">
                {/* Priority */}
                <span className={`text-xs font-semibold ${task.priority === 'High' ? 'text-red-400' : task.priority === 'Medium' ? 'text-yellow-400' : 'text-blue-400'}`}>{task.priority} Priority</span>
                {/* Creator */}
                <span className="text-xs text-dark-400">By: {task.creatorName}</span>
                {/* Timestamp */}
                <span className="text-xs text-dark-400">Created: {task.createdAt}</span>
              </div>
            </div>
            {/* Actions */}
            {showActions && (
              <div className="flex items-center space-x-1 animate-fade-in">
                {isCreator && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Edit3}
                    onClick={() => setIsEditing(true)}
                  />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  onClick={() => onDelete(task.id)}
                  className="text-red-400 hover:text-red-300"
                  disabled={!isCreator}
                />
              </div>
            )}
          </div>
        </div>
        {/* Right: User Status Dropdown */}
        <div className="ml-4 flex-shrink-0 flex items-center">
          <UserStatusDropdown
            taskId={task.id}
            members={members}
            currentUserId={currentUserId}
            currentUserName={members.find(m => m.id === currentUserId)?.name || ''}
          />
        </div>
      </div>
    </div>
  )
}