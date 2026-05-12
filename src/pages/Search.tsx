import { useState, useEffect, useCallback } from 'react'
import { Search as SearchIcon, X } from 'lucide-react'
import { cardsApi } from '../lib/api'
import { useCardsStore } from '../store/cards'
import CardGrid from '../components/CardGrid'
import type { Card } from '../types/card'

function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(timer)
  }, [value, ms])
  return debounced
}

export default function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Card[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const { toggleFavorite } = useCardsStore()
  const debouncedQuery = useDebounce(query, 300)

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setSearched(false)
      return
    }
    setLoading(true)
    try {
      const res = await cardsApi.list({ q, limit: 50 })
      setResults(res.cards)
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void doSearch(debouncedQuery)
  }, [debouncedQuery, doSearch])

  return (
    <div>
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10 px-4 py-3">
        <div className="relative">
          <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="名前・会社・タグで検索..."
            autoFocus
            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">「{query}」に一致する名刺が見つかりません</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <p className="text-xs text-gray-500 px-4 pt-3">{results.length}件の結果</p>
          <CardGrid cards={results} onToggleFavorite={(id) => void toggleFavorite(id)} />
        </>
      )}

      {!query && !searched && (
        <div className="text-center py-20 text-gray-400">
          <SearchIcon size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">名前・会社名・タグ・メモで検索できます</p>
        </div>
      )}
    </div>
  )
}
