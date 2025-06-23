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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 pt-8 sm:pt-0 relative z-10">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 sm:mb-2">Rewards Marketplace</h2>
          <p className="text-dark-300 text-sm sm:text-base">Redeem your points for virtual treats and perks</p>
        </div>
        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-1 sm:gap-0 mt-2 sm:mt-0">
          <div className="flex items-center space-x-1 sm:space-x-2 mb-0 sm:mb-1">
            <Star className="w-5 h-5 text-yellow-400" />
            <span className="text-xl sm:text-2xl font-bold text-white">{availablePoints.toLocaleString()}</span>
          </div>
          <p className="text-xs sm:text-sm text-dark-400">Available Points</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex space-x-2 overflow-x-auto pb-1 custom-scrollbar -mx-2 px-2">
        {categories.map((category) => {
          const Icon = category.icon
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`
                flex items-center space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap
                ${selectedCategory === category.id
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white'
                }
                text-xs sm:text-sm
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{category.name}</span>
            </button>
          )
        })}
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        {filteredRewards.map((reward, index) => {
          const Icon = getRewardIcon(reward.icon)
          const canAfford = availablePoints >= reward.cost
          const redemptionCount = getRedemptionCount(reward.id)
          
          return (
            <Card 
              key={reward.id} 
              className="animate-slide-up hover:scale-105 transition-transform duration-200 p-2 sm:p-6"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-center">
                <div className={`
                  w-12 h-12 sm:w-16 sm:h-16 rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center
                  ${canAfford ? 'bg-primary-500/20' : 'bg-dark-700'}
                `}>
                  <Icon className={`w-7 h-7 sm:w-8 sm:h-8 ${canAfford ? 'text-primary-400' : 'text-dark-500'}`} />
                </div>
                
                <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">{reward.name}</h3>
                <p className="text-xs sm:text-sm text-dark-300 mb-2 sm:mb-4">{reward.description}</p>
                
                <div className="flex items-center justify-center space-x-1 sm:space-x-2 mb-2 sm:mb-4">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-base sm:text-lg font-bold text-white">{reward.cost}</span>
                  <span className="text-xs sm:text-sm text-dark-400">points</span>
                </div>

                {redemptionCount > 0 && (
                  <p className="text-xs text-accent-400 mb-2 sm:mb-3">
                    Redeemed {redemptionCount} time{redemptionCount !== 1 ? 's' : ''}
                  </p>
                )}
                
                <Button
                  onClick={() => onRedeemReward(reward.id)}
                  disabled={!canAfford || !reward.isAvailable}
                  className="w-full text-xs sm:text-sm py-2"
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
        <div className="text-center py-8 sm:py-12">
          <Gift className="w-12 h-12 sm:w-16 sm:h-16 text-dark-400 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">No Rewards Available</h3>
          <p className="text-dark-300 text-xs sm:text-base">Check back later for new rewards!</p>
        </div>
      )}
    </div>
  )
}