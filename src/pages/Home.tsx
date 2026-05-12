import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Star } from 'lucide-react'
import { useCardsStore } from '../store/cards'
import CardGrid from '../components/CardGrid'

export default function Home() {
  const { cards, total, loading, fetchCards, toggleFavorite } = useCardsStore()
  const [favOnly, setFavOnly] = useState(false)
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const allTags = [...new Set(cards.flatMap((c) => c.tags))]

  useEffect(() => {
    void fetchCards({
      favorite: favOnly || undefined,
      tag: activeTag || undefined,
    })
  }, [favOnly, activeTag, fetchCards])

  return (
    <div>
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900">名刺一覧</h1>
            <p className="text-xs text-gray-500">{total}件</p>
          </div>
          <Link
            to="/add"
            className="flex items-center gap-1.5 py-2 px-3 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
          >
            <Plus size={16} /> 登録
          </Link>
        </div>

        <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
          <button
            onClick={() => setFavOnly(!favOnly)}
            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
              favOnly
                ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Star size={12} fill={favOnly ? 'currentColor' : 'none'} />
            お気に入り
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
                activeTag === tag
                  ? 'bg-primary-50 border-primary-300 text-primary-700'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : (
        <CardGrid cards={cards} onToggleFavorite={(id) => void toggleFavorite(id)} />
      )}
    </div>
  )
}
