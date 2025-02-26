import React, { useState } from 'react'
import { Label } from '@radix-ui/react-label'

// Organized emoji categories
const emojiCategories = {
  common: ['📅', '📆', '🗓️', '✨', '⭐', '🌟', '💫', '🎯'],
  activity: ['🎨', '🎭', '🎬', '🎮', '🎲', '⚽', '🏀', '🎾', '🏐', '🏈', '⚾', '🥎', '🎯', '🎱'],
  travel: ['✈️', '🚗', '🚕', '🚙', '🚌', '🚎', '🏨', '🏖️', '🗿', '🏔️', '🌋', '🏝️'],
  food: ['🍎', '🍏', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍'],
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷'],
  objects: ['💼', '🏠', '🏢', '🌍', '🎓', '📱', '💻', '⌚', '📚', '🔑', '🧸', '🎁', '🔔', '🧩'],
  symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓'],
  flags: ['🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️'],
  faces: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰']
}

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
  selectedEmoji?: string
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, selectedEmoji }) => {
  const [activeCategory, setActiveCategory] = useState<keyof typeof emojiCategories>('common')

  // Category tabs
  const categoryIcons = {
    common: '⭐',
    activity: '🎮',
    travel: '✈️',
    food: '🍎',
    animals: '🐱',
    objects: '💼',
    symbols: '❤️',
    flags: '🏁',
    faces: '😀'
  }

  return (
    <div className="border rounded-md overflow-hidden">
      {/* Category tabs */}
      <div className="flex overflow-x-auto p-1 bg-gray-50 border-b">
        {Object.entries(categoryIcons).map(([category, icon]) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category as keyof typeof emojiCategories)}
            className={`flex-shrink-0 p-1.5 text-lg rounded-md mr-1 ${
              activeCategory === category 
                ? 'bg-white shadow-sm border border-gray-200' 
                : 'hover:bg-gray-100'
            }`}
            title={category.charAt(0).toUpperCase() + category.slice(1)}
          >
            {icon}
          </button>
        ))}
      </div>
      
      {/* Emojis grid */}
      <div className="grid grid-cols-8 gap-1 p-2 max-h-[200px] overflow-y-auto">
        {emojiCategories[activeCategory].map((emoji, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onEmojiSelect(emoji)}
            className={`text-lg p-1.5 rounded-md transition-colors ${
              selectedEmoji === emoji 
                ? 'bg-blue-100 border border-blue-300' 
                : 'hover:bg-gray-100'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
      
      {/* Selected emoji */}
      {selectedEmoji && (
        <div className="p-2 border-t bg-gray-50 flex items-center gap-2">
          <Label className="text-xs text-gray-500">Selected:</Label>
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-white border">
            <span className="text-xl">{selectedEmoji}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmojiPicker
