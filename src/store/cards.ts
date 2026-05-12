import { create } from 'zustand'
import type { Card, CardInput } from '../types/card'
import { cardsApi } from '../lib/api'

type CardsStore = {
  cards: Card[]
  total: number
  loading: boolean
  error: string | null
  fetchCards: (params?: { q?: string; tag?: string; favorite?: boolean }) => Promise<void>
  addCard: (data: CardInput) => Promise<Card>
  updateCard: (id: string, data: CardInput) => Promise<Card>
  deleteCard: (id: string) => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
}

export const useCardsStore = create<CardsStore>((set, get) => ({
  cards: [],
  total: 0,
  loading: false,
  error: null,

  fetchCards: async (params) => {
    set({ loading: true, error: null })
    try {
      const res = await cardsApi.list(params)
      set({ cards: res.cards, total: res.pagination.total, loading: false })
    } catch (e) {
      set({ error: String(e), loading: false })
    }
  },

  addCard: async (data) => {
    const card = await cardsApi.create(data)
    set((s) => ({ cards: [card, ...s.cards], total: s.total + 1 }))
    return card
  },

  updateCard: async (id, data) => {
    const card = await cardsApi.update(id, data)
    set((s) => ({ cards: s.cards.map((c) => (c.id === id ? card : c)) }))
    return card
  },

  deleteCard: async (id) => {
    await cardsApi.delete(id)
    set((s) => ({ cards: s.cards.filter((c) => c.id !== id), total: s.total - 1 }))
  },

  toggleFavorite: async (id) => {
    const card = get().cards.find((c) => c.id === id)
    if (!card) return
    await get().updateCard(id, { isFavorite: !card.isFavorite })
  },
}))
