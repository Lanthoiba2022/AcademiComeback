import { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Search, Smile } from 'lucide-react'

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
}

const EMOJI_CATEGORIES = [
  { name: 'Smileys', icon: '😀', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'] },
  { name: 'Gestures', icon: '👋', emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸'] },
  { name: 'Objects', icon: '💎', emojis: ['💎', '💍', '💐', '💒', '💓', '💔', '💕', '💖', '💗', '💘', '💙', '💚', '💛', '💜', '🖤', '💝', '💞', '💟', '❣️', '💌', '💘', '💝', '💖', '💗', '💙', '💚', '💛', '💜', '🖤', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'] },
  { name: 'Nature', icon: '🌱', emojis: ['🌱', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🌺', '🌸', '💮', '🏵️', '🌻', '🌼', '🌷', '🌹', '🥀', '🌻', '🌼', '🌷', '🌹', '🥀', '🌺', '🌸', '💮', '🏵️', '🌻', '🌼', '🌷', '🌹', '🥀', '🌺', '🌸', '💮', '🏵️', '🌻', '🌼', '🌷', '🌹', '🥀'] },
  { name: 'Food', icon: '🍎', emojis: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '🫖', '☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊', '🥄', '🍴', '🍽️', '🥄', '🔪', '🏺'] }
]

export const EmojiPicker = ({ onEmojiSelect }: EmojiPickerProps) => {
  const [selectedCategory, setSelectedCategory] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredEmojis = EMOJI_CATEGORIES[selectedCategory].emojis.filter(emoji =>
    emoji.includes(searchQuery)
  )

  return (
    <Card className="w-80 p-4 bg-dark-800 border border-dark-700 shadow-xl">
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            placeholder="Search emojis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex space-x-1 mb-4 overflow-x-auto">
        {EMOJI_CATEGORIES.map((category, index) => (
          <Button
            key={category.name}
            variant={selectedCategory === index ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedCategory(index)}
            className="flex-shrink-0"
          >
            <span className="text-lg">{category.icon}</span>
          </Button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto">
        {filteredEmojis.map((emoji, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            onClick={() => onEmojiSelect(emoji)}
            className="w-8 h-8 p-0 text-lg hover:bg-dark-700"
          >
            {emoji}
          </Button>
        ))}
      </div>

      {filteredEmojis.length === 0 && (
        <div className="text-center py-8 text-dark-400">
          <Smile className="w-8 h-8 mx-auto mb-2" />
          <p>No emojis found</p>
        </div>
      )}
    </Card>
  )
} 