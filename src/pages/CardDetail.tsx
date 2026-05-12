import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, Trash2, Edit2, ExternalLink, Phone, Mail } from 'lucide-react'
import { useCardsStore } from '../store/cards'
import { cardsApi } from '../lib/api'
import CardForm from '../components/CardForm'
import type { Card, CardInput } from '../types/card'

export default function CardDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { updateCard, deleteCard } = useCardsStore()
  const [card, setCard] = useState<Card | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    cardsApi
      .get(id)
      .then(setCard)
      .finally(() => setLoading(false))
  }, [id])

  const handleUpdate = async (data: CardInput) => {
    if (!id) return
    setSaving(true)
    try {
      const updated = await updateCard(id, data)
      setCard(updated)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id || !confirm('この名刺を削除しますか？')) return
    await deleteCard(id)
    navigate('/')
  }

  const handleToggleFavorite = async () => {
    if (!id || !card) return
    const updated = await updateCard(id, { isFavorite: !card.isFavorite })
    setCard(updated)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!card) {
    return <div className="p-4 text-gray-500">名刺が見つかりません</div>
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10 flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900">
          <ArrowLeft size={24} />
        </button>
        <h1 className="flex-1 text-base font-semibold truncate">{card.name ?? '名刺詳細'}</h1>
        <button
          onClick={() => void handleToggleFavorite()}
          className={card.isFavorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-400'}
        >
          <Star size={22} fill={card.isFavorite ? 'currentColor' : 'none'} />
        </button>
        <button
          onClick={() => setEditing(!editing)}
          className={editing ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}
        >
          <Edit2 size={20} />
        </button>
        <button onClick={() => void handleDelete()} className="text-red-400 hover:text-red-600">
          <Trash2 size={20} />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {card.imageUrl && (
          <img
            src={card.imageUrl}
            alt="名刺"
            className="w-full rounded-xl border border-gray-200 object-contain max-h-56 bg-gray-50"
          />
        )}

        {editing ? (
          <CardForm
            initialData={card}
            onSubmit={handleUpdate}
            submitLabel="変更を保存"
            loading={saving}
          />
        ) : (
          <div className="space-y-5">
            <section>
              <h2 className="text-2xl font-bold text-gray-900">{card.name ?? '（名前なし）'}</h2>
              {card.nameKana && <p className="text-sm text-gray-400">{card.nameKana}</p>}
              {card.company && (
                <p className="text-base text-gray-700 font-medium mt-1">{card.company}</p>
              )}
              {card.department && <p className="text-sm text-gray-500">{card.department}</p>}
              {card.title && <p className="text-sm text-gray-500">{card.title}</p>}
            </section>

            <section className="space-y-2">
              {card.email && (
                <a
                  href={`mailto:${card.email}`}
                  className="flex items-center gap-2 text-sm text-primary-600 hover:underline"
                >
                  <Mail size={16} /> {card.email}
                </a>
              )}
              {card.phone && (
                <a
                  href={`tel:${card.phone}`}
                  className="flex items-center gap-2 text-sm text-primary-600 hover:underline"
                >
                  <Phone size={16} /> {card.phone}
                </a>
              )}
              {card.mobile && (
                <a
                  href={`tel:${card.mobile}`}
                  className="flex items-center gap-2 text-sm text-primary-600 hover:underline"
                >
                  <Phone size={16} /> {card.mobile} (携帯)
                </a>
              )}
              {card.website && (
                <a
                  href={card.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary-600 hover:underline"
                >
                  <ExternalLink size={16} /> {card.website}
                </a>
              )}
              {card.address && <p className="text-sm text-gray-600">{card.address}</p>}
            </section>

            {(card.exchangeDate || card.exchangeLocation) && (
              <section className="bg-gray-50 rounded-xl p-3 space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">名刺交換</p>
                {card.exchangeDate && (
                  <p className="text-sm text-gray-700">
                    {new Date(card.exchangeDate).toLocaleDateString('ja-JP')}
                  </p>
                )}
                {card.exchangeLocation && (
                  <p className="text-sm text-gray-700">{card.exchangeLocation}</p>
                )}
              </section>
            )}

            {card.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {card.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {card.memo && (
              <section className="bg-yellow-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">メモ</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{card.memo}</p>
              </section>
            )}

            <p className="text-xs text-gray-400">
              登録日: {new Date(card.createdAt).toLocaleString('ja-JP')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
