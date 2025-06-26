import React, { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { StudyGoal } from '../../types/analytics';

const challengeTypes = [
  { value: 'daily', label: 'Daily Goal' },
  { value: 'weekly', label: 'Weekly Goal' },
  { value: 'monthly', label: 'Monthly Goal' },
  { value: 'custom', label: 'Custom challenge' },
];
const units = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'quizzes', label: 'Quizzes' },
  { value: 'points', label: 'Points' },
];
const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

interface GoalFormProps {
  initialGoal?: Partial<StudyGoal>;
  onSave: (goal: Partial<StudyGoal>) => void;
  onCancel: () => void;
}

export const GoalForm: React.FC<GoalFormProps> = ({ initialGoal = {}, onSave, onCancel }) => {
  const [title, setTitle] = useState(initialGoal.title || '');
  const [description, setDescription] = useState(initialGoal.description || '');
  const [challengeType, setChallengeType] = useState<StudyGoal['type']>(initialGoal.type || 'custom');
  const [customChallenge, setCustomChallenge] = useState(initialGoal.challenge || '');
  const [target, setTarget] = useState(initialGoal.target || 60);
  const [unit, setUnit] = useState<StudyGoal['unit']>(initialGoal.unit || 'minutes');
  const [deadline, setDeadline] = useState(initialGoal.deadline ? initialGoal.deadline.slice(0, 10) : '');
  const [priority, setPriority] = useState<StudyGoal['priority']>(initialGoal.priority || 'medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...initialGoal,
      title,
      description,
      type: challengeType,
      challenge: challengeType === 'custom' ? customChallenge : challengeType,
      target: Number(target),
      unit,
      deadline: deadline ? new Date(deadline).toISOString() : '',
      priority,
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm text-white mb-1">Title</label>
        <Input value={title} onChange={e => setTitle(e.target.value)} required maxLength={60} />
      </div>
      <div>
        <label className="block text-sm text-white mb-1">Description</label>
        <Input value={description} onChange={e => setDescription(e.target.value)} required maxLength={120} />
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-sm text-white mb-1">Challenge Type</label>
          <select className="w-full rounded bg-dark-800 text-white p-2" value={challengeType} onChange={e => setChallengeType(e.target.value as StudyGoal['type'])}>
            {challengeTypes.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        {challengeType === 'custom' && (
          <div className="flex-1">
            <label className="block text-sm text-white mb-1">Custom Challenge</label>
            <Input value={customChallenge} onChange={e => setCustomChallenge(e.target.value)} maxLength={60} />
          </div>
        )}
        <div className="flex-1">
          <label className="block text-sm text-white mb-1">Target</label>
          <Input type="number" value={target} onChange={e => setTarget(Number(e.target.value))} min={1} required />
        </div>
        <div className="flex-1">
          <label className="block text-sm text-white mb-1">Unit</label>
          <select className="w-full rounded bg-dark-800 text-white p-2" value={unit} onChange={e => setUnit(e.target.value as StudyGoal['unit'])}>
            {units.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-sm text-white mb-1">Deadline</label>
          <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} required />
        </div>
        <div className="flex-1">
          <label className="block text-sm text-white mb-1">Priority</label>
          <select className="w-full rounded bg-dark-800 text-white p-2" value={priority} onChange={e => setPriority(e.target.value as StudyGoal['priority'])}>
            {priorities.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Goal</Button>
      </div>
    </form>
  );
}; 