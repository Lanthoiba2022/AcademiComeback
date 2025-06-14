import { useState } from 'react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Search, Filter, X, Users, Clock } from 'lucide-react'
import { RoomFilters as RoomFiltersType } from '../../types'
import { popularTags } from '../../data/mockData'

interface RoomFiltersProps {
  filters: RoomFiltersType
  onFiltersChange: (filters: RoomFiltersType) => void
}

export const RoomFilters = ({ filters, onFiltersChange }: RoomFiltersProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search })
  }

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag]
    
    onFiltersChange({ ...filters, tags: newTags })
  }

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      tags: [],
      isActive: undefined,
      maxMembers: undefined
    })
  }

  const hasActiveFilters = filters.search || filters.tags.length > 0 || 
                          filters.isActive !== undefined || filters.maxMembers !== undefined

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search rooms by name or description..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            icon={Search}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          icon={Filter}
        >
          Filters
        </Button>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            icon={X}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="bg-dark-800/50 rounded-lg p-4 space-y-4 animate-slide-down">
          {/* Activity Status */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Activity Status
            </label>
            <div className="flex gap-2">
              <Button
                variant={filters.isActive === undefined ? 'primary' : 'outline'}
                size="sm"
                onClick={() => onFiltersChange({ ...filters, isActive: undefined })}
              >
                All
              </Button>
              <Button
                variant={filters.isActive === true ? 'primary' : 'outline'}
                size="sm"
                onClick={() => onFiltersChange({ ...filters, isActive: true })}
                icon={Clock}
              >
                Active
              </Button>
              <Button
                variant={filters.isActive === false ? 'primary' : 'outline'}
                size="sm"
                onClick={() => onFiltersChange({ ...filters, isActive: false })}
              >
                Inactive
              </Button>
            </div>
          </div>

          {/* Room Size */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Room Size
            </label>
            <div className="flex gap-2">
              <Button
                variant={filters.maxMembers === undefined ? 'primary' : 'outline'}
                size="sm"
                onClick={() => onFiltersChange({ ...filters, maxMembers: undefined })}
              >
                Any Size
              </Button>
              <Button
                variant={filters.maxMembers === 10 ? 'primary' : 'outline'}
                size="sm"
                onClick={() => onFiltersChange({ ...filters, maxMembers: 10 })}
                icon={Users}
              >
                Small (≤10)
              </Button>
              <Button
                variant={filters.maxMembers === 25 ? 'primary' : 'outline'}
                size="sm"
                onClick={() => onFiltersChange({ ...filters, maxMembers: 25 })}
                icon={Users}
              >
                Large (&gt;10)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Popular Tags */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-dark-300">
            Filter by Tags
          </label>
          {filters.tags.length > 0 && (
            <span className="text-xs text-primary-400">
              {filters.tags.length} selected
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {popularTags.slice(0, 12).map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagToggle(tag)}
              className={`
                px-3 py-1 rounded-full text-sm transition-all duration-200
                ${filters.tags.includes(tag)
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-white'
                }
              `}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-dark-700">
          {filters.search && (
            <span className="inline-flex items-center px-3 py-1 bg-secondary-500/20 text-secondary-300 rounded-full text-sm">
              Search: "{filters.search}"
              <button
                onClick={() => handleSearchChange('')}
                className="ml-2 text-secondary-400 hover:text-secondary-300"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1 bg-primary-500/20 text-primary-300 rounded-full text-sm"
            >
              #{tag}
              <button
                onClick={() => handleTagToggle(tag)}
                className="ml-2 text-primary-400 hover:text-primary-300"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}