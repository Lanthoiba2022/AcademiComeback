export const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const getRankColor = (rank: string): string => {
  const rankColors: Record<string, string> = {
    'Beginner': 'text-gray-400',
    'Student': 'text-blue-400',
    'Scholar': 'text-purple-400',
    'Expert': 'text-yellow-400',
    'Master': 'text-red-400'
  }
  return rankColors[rank] || 'text-gray-400'
}

export const getRankProgress = (points: number): { current: string; next: string; progress: number } => {
  const ranks = [
    { name: 'Beginner', min: 0, max: 100 },
    { name: 'Student', min: 100, max: 500 },
    { name: 'Scholar', min: 500, max: 1500 },
    { name: 'Expert', min: 1500, max: 5000 },
    { name: 'Master', min: 5000, max: Infinity }
  ]

  const currentRank = ranks.find(rank => points >= rank.min && points < rank.max)
  const currentIndex = ranks.findIndex(rank => rank === currentRank)
  const nextRank = ranks[currentIndex + 1]

  if (!currentRank) return { current: 'Beginner', next: 'Student', progress: 0 }
  if (!nextRank) return { current: currentRank.name, next: 'Max Level', progress: 100 }

  const progress = ((points - currentRank.min) / (currentRank.max - currentRank.min)) * 100

  return {
    current: currentRank.name,
    next: nextRank.name,
    progress: Math.min(progress, 100)
  }
}

export const getTimeAgo = (date: string): string => {
  const now = new Date()
  const past = new Date(date)
  const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
  return `${Math.floor(diffInMinutes / 1440)}d ago`
}