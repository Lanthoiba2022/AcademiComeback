import React from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { StudyGoal } from '../../types/analytics';

interface GoalProps {
  goal: StudyGoal;
  onEdit: (goal: StudyGoal) => void;
  onComplete: (goal: StudyGoal) => void;
}

export const Goal: React.FC<GoalProps> = ({ goal, onEdit, onComplete }) => {
  const progress = Math.min((goal.current / goal.target) * 100, 100);
  const isCompleted = goal.iscompleted;
  const priorityColor =
    goal.priority === 'high' ? 'text-red-400' :
    goal.priority === 'medium' ? 'text-yellow-400' :
    'text-blue-400';

  return (
    <Card className="p-4 mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-lg font-semibold text-white truncate">{goal.title}</h4>
          <span className={`text-xs px-2 py-1 rounded ${priorityColor} bg-dark-700/50`}>{goal.priority} priority</span>
        </div>
        <p className="text-dark-300 text-sm mb-2 truncate">{goal.description}</p>
        <div className="flex flex-wrap gap-2 text-xs text-dark-400 mb-2">
          <span>Challenge: <span className="text-white">{goal.challenge || goal.type}</span></span>
          <span>Target: <span className="text-white">{goal.target} {goal.unit}</span></span>
          <span>Deadline: <span className="text-white">{new Date(goal.deadline).toLocaleDateString()}</span></span>
        </div>
        <div className="w-full bg-dark-700 rounded-full h-2 mb-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${isCompleted ? 'bg-green-400' : 'bg-primary-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-white font-medium">{goal.current} / {goal.target} {goal.unit}</span>
          {isCompleted && <span className="text-green-400 ml-2">✓ Completed</span>}
        </div>
      </div>
      <div className="flex flex-col gap-2 min-w-[120px] items-end">
        <Button size="sm" variant="outline" onClick={() => onEdit(goal)}>
          Edit
        </Button>
        {!isCompleted && (
          <Button size="sm" onClick={() => onComplete(goal)}>
            Mark Complete
          </Button>
        )}
      </div>
    </Card>
  );
}; 