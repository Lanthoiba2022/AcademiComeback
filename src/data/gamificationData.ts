import { Rank, Achievement, Reward } from '../types/gamification'
import { 
  Trophy, Star, Zap, Target, Users, BookOpen, Clock, Award,
  Coffee, Pizza, Cookie, Gift, Crown, Flame, Heart, Brain
} from 'lucide-react'

export const RANKS: Rank[] = [
  {
    id: 'bronze',
    name: 'Bronze Scholar',
    minPoints: 0,
    maxPoints: 299,
    color: 'text-amber-600',
    icon: 'Trophy',
    badge: '🥉',
    perks: ['Basic study tools', 'Community access']
  },
  {
    id: 'silver',
    name: 'Silver Student',
    minPoints: 300,
    maxPoints: 799,
    color: 'text-gray-400',
    icon: 'Star',
    badge: '🥈',
    perks: ['Advanced study tools', 'Priority support', 'Custom themes']
  },
  {
    id: 'gold',
    name: 'Gold Achiever',
    minPoints: 800,
    maxPoints: 1499,
    color: 'text-yellow-400',
    icon: 'Award',
    badge: '🥇',
    perks: ['Premium features', 'Study analytics', 'Group creation priority']
  },
  {
    id: 'platinum',
    name: 'Platinum Master',
    minPoints: 1500,
    maxPoints: 2999,
    color: 'text-blue-400',
    icon: 'Crown',
    badge: '💎',
    perks: ['All premium features', 'Mentor status', 'Custom badges']
  },
  {
    id: 'diamond',
    name: 'Diamond Legend',
    minPoints: 3000,
    maxPoints: Infinity,
    color: 'text-purple-400',
    icon: 'Zap',
    badge: '💠',
    perks: ['Legendary status', 'All features', 'Special recognition', 'Beta access']
  }
]

export const ACHIEVEMENTS: Achievement[] = [
  // Study Achievements
  {
    id: 'first_task',
    name: 'First Steps',
    description: 'Complete your first study task',
    icon: 'Target',
    category: 'study',
    points: 25,
    maxProgress: 1,
    isUnlocked: false
  },
  {
    id: 'task_master',
    name: 'Task Master',
    description: 'Complete 50 study tasks',
    icon: 'BookOpen',
    category: 'study',
    points: 100,
    maxProgress: 50,
    isUnlocked: false
  },
  {
    id: 'speed_learner',
    name: 'Speed Learner',
    description: 'Complete tasks 20% faster than estimated',
    icon: 'Zap',
    category: 'study',
    points: 75,
    maxProgress: 10,
    isUnlocked: false
  },
  {
    id: 'marathon_student',
    name: 'Marathon Student',
    description: 'Study for 8 hours in a single day',
    icon: 'Clock',
    category: 'study',
    points: 150,
    maxProgress: 1,
    isUnlocked: false
  },

  // Quiz Achievements
  {
    id: 'first_quiz',
    name: 'Quiz Master',
    description: 'Complete your first quiz',
    icon: 'Brain',
    category: 'quiz',
    points: 30,
    maxProgress: 1,
    isUnlocked: false
  },
  {
    id: 'quiz_champion',
    name: 'Quiz Champion',
    description: 'Score 90%+ on 5 quizzes',
    icon: 'Trophy',
    category: 'quiz',
    points: 200,
    maxProgress: 5,
    isUnlocked: false
  },
  {
    id: 'perfect_score',
    name: 'Perfectionist',
    description: 'Get 100% on any quiz',
    icon: 'Star',
    category: 'quiz',
    points: 100,
    maxProgress: 1,
    isUnlocked: false
  },

  // Social Achievements
  {
    id: 'team_player',
    name: 'Team Player',
    description: 'Help 5 different team members',
    icon: 'Users',
    category: 'social',
    points: 75,
    maxProgress: 5,
    isUnlocked: false
  },
  {
    id: 'mentor',
    name: 'Mentor',
    description: 'Help 25 different students',
    icon: 'Heart',
    category: 'social',
    points: 250,
    maxProgress: 25,
    isUnlocked: false
  },
  {
    id: 'room_creator',
    name: 'Room Creator',
    description: 'Create 10 study rooms',
    icon: 'Users',
    category: 'social',
    points: 150,
    maxProgress: 10,
    isUnlocked: false
  },

  // Streak Achievements
  {
    id: 'study_streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day study streak',
    icon: 'Flame',
    category: 'streak',
    points: 100,
    maxProgress: 7,
    isUnlocked: false
  },
  {
    id: 'study_streak_30',
    name: 'Month Master',
    description: 'Maintain a 30-day study streak',
    icon: 'Flame',
    category: 'streak',
    points: 500,
    maxProgress: 30,
    isUnlocked: false
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Start studying before 7 AM for 5 days',
    icon: 'Clock',
    category: 'streak',
    points: 75,
    maxProgress: 5,
    isUnlocked: false
  },

  // Special Achievements
  {
    id: 'first_room',
    name: 'Room Pioneer',
    description: 'Join your first study room',
    icon: 'Users',
    category: 'special',
    points: 20,
    maxProgress: 1,
    isUnlocked: false
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Study after 11 PM for 3 days',
    icon: 'Clock',
    category: 'special',
    points: 50,
    maxProgress: 3,
    isUnlocked: false
  }
]

export const REWARDS: Reward[] = [
  // Snacks
  {
    id: 'coffee_break',
    name: 'Coffee Break',
    description: 'Treat yourself to a virtual coffee',
    cost: 50,
    icon: 'Coffee',
    category: 'snacks',
    isAvailable: true
  },
  {
    id: 'study_snack',
    name: 'Study Snack',
    description: 'A healthy snack to fuel your brain',
    cost: 25,
    icon: 'Cookie',
    category: 'snacks',
    isAvailable: true
  },
  {
    id: 'energy_drink',
    name: 'Energy Boost',
    description: 'Virtual energy drink for late-night studying',
    cost: 40,
    icon: 'Zap',
    category: 'snacks',
    isAvailable: true
  },

  // Treats
  {
    id: 'pizza_slice',
    name: 'Pizza Slice',
    description: 'Celebrate with a delicious pizza slice',
    cost: 100,
    icon: 'Pizza',
    category: 'treats',
    isAvailable: true
  },
  {
    id: 'ice_cream',
    name: 'Ice Cream',
    description: 'Cool treat for hot study sessions',
    cost: 75,
    icon: 'Heart',
    category: 'treats',
    isAvailable: true
  },
  {
    id: 'celebration_cake',
    name: 'Celebration Cake',
    description: 'Big achievement deserves big celebration',
    cost: 200,
    icon: 'Gift',
    category: 'treats',
    isAvailable: true
  },

  // Special
  {
    id: 'custom_badge',
    name: 'Custom Badge',
    description: 'Design your own achievement badge',
    cost: 500,
    icon: 'Award',
    category: 'special',
    isAvailable: true
  },
  {
    id: 'study_buddy',
    name: 'Virtual Study Buddy',
    description: 'AI companion for your study sessions',
    cost: 300,
    icon: 'Users',
    category: 'special',
    isAvailable: true
  }
]

export const getPointsForTaskCompletion = (duration: number): number => {
  if (duration <= 15) return 10
  if (duration <= 30) return 20
  if (duration <= 60) return 35
  return 50
}

export const getPointsForQuizScore = (score: number): number => {
  if (score >= 90) return 100
  if (score >= 80) return 75
  if (score >= 70) return 50
  if (score >= 60) return 25
  return 10
}