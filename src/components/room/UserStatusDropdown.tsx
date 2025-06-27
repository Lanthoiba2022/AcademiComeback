import { useEffect, useState, useRef } from 'react';
import { TaskStatus, TaskUserStatus, User } from '../../types';
import { getTaskUserStatuses, upsertTaskUserStatus, subscribeToTaskUserStatus } from '../../lib/supabase';
import { CheckCircle, AlertCircle, Circle } from 'lucide-react';

interface UserStatusDropdownProps {
  taskId: string;
  members: User[];
  currentUserId: string;
  currentUserName: string;
}

const statusOptions: TaskStatus[] = ['Todo', 'In Progress', 'In Review', 'Completed'];

const statusIcon = (status: TaskStatus) => {
  switch (status) {
    case 'Completed': return <CheckCircle className="w-4 h-4 text-green-400 inline" />;
    case 'In Progress': return <AlertCircle className="w-4 h-4 text-yellow-400 inline" />;
    case 'In Review': return <AlertCircle className="w-4 h-4 text-blue-400 inline" />;
    default: return <Circle className="w-4 h-4 text-dark-400 inline" />;
  }
};

export const UserStatusDropdown = ({ taskId, members, currentUserId, currentUserName }: UserStatusDropdownProps) => {
  const [statuses, setStatuses] = useState<TaskUserStatus[]>([]);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let unsub: any;
    // Avoid fetching statuses for temp tasks
    if (taskId.startsWith('temp-')) return;
    getTaskUserStatuses(taskId).then(({ data, error }) => {
      if (error) setError('Failed to load user statuses: ' + error.message);
      else setStatuses(data || []);
    });
    unsub = subscribeToTaskUserStatus(taskId, (payload: any) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        setStatuses(prev => {
          const idx = prev.findIndex(s => s.userId === payload.new.user_id);
          const updated = {
            id: payload.new.id,
            taskId: payload.new.task_id,
            userId: payload.new.user_id,
            userName: payload.new.user_name,
            status: payload.new.status,
            updatedAt: payload.new.updated_at,
          };
          if (idx !== -1) {
            const arr = [...prev];
            arr[idx] = updated;
            return arr;
          } else {
            return [...prev, updated];
          }
        });
      }
    });
    return () => { if (unsub) unsub.unsubscribe(); };
  }, [taskId]);

  // Find current user's status
  const currentUserStatus = statuses.find(s => s.userId === currentUserId)?.status || 'Todo';

  // Group users by status
  const usersByStatus: Record<TaskStatus, User[]> = {
    'Todo': [],
    'In Progress': [],
    'In Review': [],
    'Completed': []
  };
  members.forEach(member => {
    const userStatus = statuses.find(s => s.userId === member.id)?.status || 'Todo';
    usersByStatus[userStatus] = usersByStatus[userStatus] || [];
    usersByStatus[userStatus].push(member);
  });

  const handleStatusChange = async (newStatus: TaskStatus) => {
    setUpdating(true);
    await upsertTaskUserStatus(taskId, currentUserId, currentUserName, newStatus);
    setUpdating(false);
  };

  if (error) return <div className="text-xs text-red-400">{error}</div>;

  return (
    <div className="flex flex-col gap-2 w-full relative">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-white">Your Status:</span>
        <select
          value={currentUserStatus}
          onChange={e => handleStatusChange(e.target.value as TaskStatus)}
          disabled={updating}
          className="px-2 py-1 rounded border text-xs bg-dark-800 text-white"
          style={{ minWidth: 90 }}
          title="Your status for this task"
        >
          {statusOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <button
          className="ml-2 px-2 py-1 rounded text-xs text-white bg-button-gradient hover:shadow-lg hover:shadow-primary-500/25 hover:scale-105 focus:ring-2 focus:ring-primary-500 transition"
          onClick={() => setShowDialog(true)}
          type="button"
        >
          Show Statuses
        </button>
      </div>
      {showDialog && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowDialog(false)}
          />
          {/* Centered Dialog */}
          <div
            ref={dialogRef}
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-dark-900 border border-dark-700 rounded shadow-lg p-4 w-[90vw] sm:w-auto"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-white">Task Statuses</span>
              <button
                className="text-xs text-dark-300 hover:text-white"
                onClick={() => setShowDialog(false)}
                aria-label="Close"
                type="button"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              {statusOptions.map(status => (
                <div key={status} className="flex flex-col items-start sm:items-center w-full sm:min-w-[120px]">
                  <div className="flex items-center gap-1 mb-1">
                    {statusIcon(status)}
                    <span
                      className={`text-xs font-semibold
                        ${status === 'Todo' ? 'text-gray-300'
                        : status === 'In Progress' ? 'text-yellow-300'
                        : status === 'In Review' ? 'text-blue-300'
                        : status === 'Completed' ? 'text-green-300'
                        : ''}
                      `}
                    >
                      {status}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {usersByStatus[status].length === 0 && (
                      <span className="text-xs text-dark-400">—</span>
                    )}
                    {usersByStatus[status].map(user => (
                      <span key={user.id} className={`text-xs ${user.id === currentUserId ? 'font-bold text-primary-400' : 'text-dark-200'}`}>
                        {user.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}; 