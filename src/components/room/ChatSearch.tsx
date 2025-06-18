import { useState, useEffect } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Search, X, ArrowUp, ArrowDown, MessageCircle } from 'lucide-react'
import { useChat } from '../../contexts/ChatContext'
import { ChatSearchResult } from '../../types/chat'

export const ChatSearch = () => {
  const { state, searchMessages } = useChat()
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<ChatSearchResult[]>([])
  const [currentResultIndex, setCurrentResultIndex] = useState(0)
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setIsSearching(true)
    try {
      const searchResults = await searchMessages(searchQuery)
      setResults(searchResults)
      setCurrentResultIndex(0)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const navigateToResult = (direction: 'next' | 'prev') => {
    if (results.length === 0) return

    if (direction === 'next') {
      setCurrentResultIndex((prev) => (prev + 1) % results.length)
    } else {
      setCurrentResultIndex((prev) => (prev - 1 + results.length) % results.length)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch()
      } else {
        setResults([])
      }
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  return (
    <div className="mt-4 p-4 bg-dark-800/50 rounded-lg border border-dark-700">
      <div className="flex items-center space-x-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
          <Input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10 pr-4"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSearchQuery('')}
          icon={X}
        />
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-dark-400">
            <span>{results.length} result{results.length !== 1 ? 's' : ''} found</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateToResult('prev')}
                icon={ArrowUp}
                disabled={results.length === 0}
              />
              <span className="text-xs">
                {currentResultIndex + 1} of {results.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateToResult('next')}
                icon={ArrowDown}
                disabled={results.length === 0}
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {results.map((result, index) => (
              <div
                key={result.message.id}
                onClick={() => setCurrentResultIndex(index)}
                className="cursor-pointer"
              >
                <Card
                  className={`p-3 transition-colors duration-200 ${
                    index === currentResultIndex
                      ? 'bg-primary-500/20 border-primary-500/50'
                      : 'bg-dark-700/50 hover:bg-dark-700'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <MessageCircle className="w-4 h-4 text-primary-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white">
                          {result.message.userName}
                        </span>
                        <span className="text-xs text-dark-400">
                          {formatTime(result.message.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-dark-300">
                        {result.context}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      {isSearching && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent mx-auto"></div>
          <p className="text-sm text-dark-400 mt-2">Searching...</p>
        </div>
      )}

      {searchQuery && !isSearching && results.length === 0 && (
        <div className="text-center py-4">
          <Search className="w-8 h-8 text-dark-400 mx-auto mb-2" />
          <p className="text-sm text-dark-400">No messages found</p>
        </div>
      )}
    </div>
  )
} 