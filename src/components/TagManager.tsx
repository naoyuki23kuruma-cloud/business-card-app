import { useState, KeyboardEvent } from 'react'
import { X } from 'lucide-react'

type Props = {
  tags: string[]
  onChange: (tags: string[]) => void
}

export default function TagManager({ tags, onChange }: Props) {
  const [input, setInput] = useState('')

  const addTag = () => {
    const trimmed = input.trim().replace(/,$/, '')
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
    }
    setInput('')
  }

  const removeTag = (tag: string) => onChange(tags.filter((t) => t !== tag))

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    }
    if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-lg min-h-[42px] focus-within:ring-2 focus-within:ring-primary-500">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 bg-primary-100 text-primary-800 text-sm px-2 py-0.5 rounded-full"
        >
          {tag}
          <button type="button" onClick={() => removeTag(tag)} className="hover:text-primary-900">
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder={tags.length === 0 ? 'タグを入力してEnter' : ''}
        className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
      />
    </div>
  )
}
