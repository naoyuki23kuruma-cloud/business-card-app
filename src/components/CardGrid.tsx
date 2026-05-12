import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import type { Card } from '../types/card'

type Props = {
  cards: Card[]
  onToggleFavorite?: (id: string) => void
}

export default function CardGrid({ cards, onToggleFavorite }: Props) {
  if (cards.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-5xl mb-3">📇</p>
        <p className="text-sm">名刺がまだありません</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {cards.map((card) => (
        <div
          key={card.id}
          className="relative bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
        >
          <Link to={`/cards/${card.id}`}>
            {card.thumbnailUrl ? (
              <img
                src={card.thumbnailUrl}
                alt={card.name ?? '名刺'}
                className="w-full h-36 object-cover bg-gray-100"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-36 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center text-primary-300 text-5xl">
                📇
              </div>
            )}
          </Link>

          <button
            onClick={(e) => {
              e.preventDefault()
              onToggleFavorite?.(card.id)
            }}
            className={`absolute top-2 right-2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm ${
              card.isFavorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-400'
            }`}
          >
            <Star size={16} fill={card.isFavorite ? 'currentColor' : 'none'} />
          </button>

          <Link to={`/cards/${card.id}`} className="block p-3">
            <p className="font-semibold text-gray-900 truncate">{card.name ?? '（名前なし）'}</p>
            {card.company && <p className="text-xs text-gray-500 truncate mt-0.5">{card.company}</p>}
            {card.title && <p className="text-xs text-gray-400 truncate">{card.title}</p>}
            {card.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {card.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-[10px] bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
                {card.tags.length > 3 && (
                  <span className="text-[10px] text-gray-400">+{card.tags.length - 3}</span>
                )}
              </div>
            )}
          </Link>
        </div>
      ))}
    </div>
  )
}
