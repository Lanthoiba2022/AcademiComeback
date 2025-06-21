import { useState } from 'react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Coffee, Pizza, Cookie, Gift, Award, Users, Zap, Heart, Star } from 'lucide-react'
import { Reward, RedeemedReward } from '../../types/gamification'

interface RewardsMarketplaceProps {
  rewards: Reward[]
  availablePoints: number
  redeemedRewards: RedeemedReward[]
  onRedeemReward: (rewardId: string) => void
}

const getRewardIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    Coffee, Pizza, Cookie, Gift, Award, Users, Zap, Heart
  }
  return icons[iconName] || Gift
}

export const RewardsMarketplace = ({ 
  rewards, 
  availablePoints, 
  redeemedRewards,
  onRedeemReward 
}: RewardsMarketplaceProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = [
    { id: 'all', name: 'All Rewards', icon: Gift },
    { id: 'snacks', name: 'Snacks', icon: Coffee },
    { id: 'treats', name: 'Treats', icon: Pizza },
    { id: 'special', name: 'Special', icon: Award }
  ]

  const filteredRewards = selectedCategory === 'all' 
    ? rewards 
    : rewards.filter(reward => reward.category === selectedCategory)

  const getRedemptionCount = (rewardId: string) => {
    return redeemedRewards.filter(r => r.rewardId === rewardId).length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Rewards Marketplace</h2>
          <p className="text-dark-300">Redeem your points for virtual treats and perks</p>
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-2 mb-1">
            <Star className="w-5 h-5 text-yellow-400" />
            <span className="text-2xl font-bold text-white">{availablePoints.toLocaleString()}</span>
          </div>
          <p className="text-sm text-dark-400">Available Points</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex space-x-2 overflow-x-auto pb-2 custom-scrollbar">
        {categories.map((category) => {
          const Icon = category.icon
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap
                ${selectedCategory === category.id
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{category.name}</span>
            </button>
          )
        })}
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRewards.map((reward, index) => {
          const Icon = getRewardIcon(reward.icon)
          const canAfford = availablePoints >= reward.cost
          const redemptionCount = getRedemptionCount(reward.id)
          
          return (
            <Card 
              key={reward.id} 
              className="animate-slide-up hover:scale-105 transition-transform duration-200"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-center">
                <div className={`
                  w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center
                  ${canAfford ? 'bg-primary-500/20' : 'bg-dark-700'}
                `}>
                  <Icon className={`w-8 h-8 ${canAfford ? 'text-primary-400' : 'text-dark-500'}`} />
                </div>
                
                <h3 className="text-lg font-semibold text-white mb-2">{reward.name}</h3>
                <p className="text-sm text-dark-300 mb-4">{reward.description}</p>
                
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-lg font-bold text-white">{reward.cost}</span>
                  <span className="text-sm text-dark-400">points</span>
                </div>

                {redemptionCount > 0 && (
                  <p className="text-xs text-accent-400 mb-3">
                    Redeemed {redemptionCount} time{redemptionCount !== 1 ? 's' : ''}
                  </p>
                )}
                
                <Button
                  onClick={() => onRedeemReward(reward.id)}
                  disabled={!canAfford || !reward.isAvailable}
                  className="w-full"
                  size="sm"
                  variant={canAfford ? 'primary' : 'outline'}
                >
                  {!canAfford ? 'Not Enough Points' : 'Redeem'}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {filteredRewards.length === 0 && (
        <div className="text-center py-12">
          <Gift className="w-16 h-16 text-dark-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Rewards Available</h3>
          <p className="text-dark-300">Check back later for new rewards!</p>
        </div>
      )}
    </div>
  )
}