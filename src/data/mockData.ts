import { User, Room } from '../types'

export const mockUser: User = {
  id: '1',
  name: 'Alex Johnson',
  email: 'alex@example.com',
  avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  totalPoints: 1250,
  rank: 'Scholar',
  achievements: ['First Room', 'Study Streak', 'Helper'],
  createdAt: '2024-01-15T10:00:00Z'
}

export const mockRooms: Room[] = [
  {
    id: '1',
    name: 'Advanced JavaScript Study Group',
    code: 'JS2024',
    description: 'Deep dive into modern JavaScript concepts, async programming, and frameworks',
    tags: ['javascript', 'programming', 'web-dev'],
    members: [
      mockUser,
      {
        id: '2',
        name: 'Sarah Chen',
        email: 'sarah@example.com',
        avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
        totalPoints: 890,
        rank: 'Student',
        achievements: ['Team Player'],
        createdAt: '2024-01-10T10:00:00Z'
      },
      {
        id: '3',
        name: 'Mike Rodriguez',
        email: 'mike@example.com',
        totalPoints: 2100,
        rank: 'Expert',
        achievements: ['Mentor', 'Code Master'],
        createdAt: '2024-01-05T10:00:00Z'
      }
    ],
    adminId: '1',
    maxMembers: 12,
    isPrivate: false,
    isActive: true,
    createdAt: '2024-01-20T14:30:00Z',
    lastActivity: '2024-01-25T16:45:00Z'
  },
  {
    id: '2',
    name: 'Calculus II Problem Solving',
    code: 'CALC2X',
    description: 'Working through integration techniques and series convergence',
    tags: ['mathematics', 'calculus', 'exam-prep'],
    members: [
      {
        id: '4',
        name: 'Emma Wilson',
        email: 'emma@example.com',
        avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
        totalPoints: 1580,
        rank: 'Scholar',
        achievements: ['Math Wizard'],
        createdAt: '2024-01-08T10:00:00Z'
      },
      {
        id: '5',
        name: 'David Kim',
        email: 'david@example.com',
        totalPoints: 720,
        rank: 'Student',
        achievements: ['Problem Solver'],
        createdAt: '2024-01-12T10:00:00Z'
      }
    ],
    adminId: '4',
    maxMembers: 8,
    isPrivate: false,
    isActive: true,
    createdAt: '2024-01-18T09:15:00Z',
    lastActivity: '2024-01-25T11:20:00Z'
  },
  {
    id: '3',
    name: 'MCAT Biology Review',
    code: 'MCAT24',
    description: 'Comprehensive biology review for MCAT preparation',
    tags: ['biology', 'mcat', 'medical', 'exam-prep'],
    members: [
      {
        id: '6',
        name: 'Lisa Park',
        email: 'lisa@example.com',
        avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
        totalPoints: 3200,
        rank: 'Expert',
        achievements: ['Study Leader', 'Bio Expert'],
        createdAt: '2024-01-01T10:00:00Z'
      }
    ],
    adminId: '6',
    maxMembers: 15,
    isPrivate: true,
    isActive: false,
    createdAt: '2024-01-15T13:00:00Z',
    lastActivity: '2024-01-23T15:30:00Z'
  },
  {
    id: '4',
    name: 'Spanish Conversation Practice',
    code: 'ESPANOL',
    description: 'Practice Spanish conversation skills with native and advanced speakers',
    tags: ['spanish', 'language', 'conversation'],
    members: [
      {
        id: '7',
        name: 'Carlos Martinez',
        email: 'carlos@example.com',
        totalPoints: 1890,
        rank: 'Scholar',
        achievements: ['Language Master'],
        createdAt: '2024-01-03T10:00:00Z'
      },
      {
        id: '8',
        name: 'Ana Garcia',
        email: 'ana@example.com',
        avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
        totalPoints: 950,
        rank: 'Student',
        achievements: ['Conversationalist'],
        createdAt: '2024-01-07T10:00:00Z'
      }
    ],
    adminId: '7',
    maxMembers: 10,
    isPrivate: false,
    isActive: true,
    createdAt: '2024-01-22T16:20:00Z',
    lastActivity: '2024-01-25T18:10:00Z'
  }
]

export const popularTags = [
  'javascript', 'python', 'mathematics', 'calculus', 'biology', 'chemistry',
  'physics', 'history', 'literature', 'spanish', 'french', 'exam-prep',
  'mcat', 'sat', 'gre', 'programming', 'web-dev', 'data-science',
  'machine-learning', 'statistics', 'economics', 'psychology'
]