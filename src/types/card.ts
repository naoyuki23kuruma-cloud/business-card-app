export type Card = {
  id: string
  imageUrl: string | null
  thumbnailUrl: string | null
  rawOcrText: string | null
  name: string | null
  nameKana: string | null
  company: string | null
  department: string | null
  title: string | null
  email: string | null
  phone: string | null
  mobile: string | null
  fax: string | null
  address: string | null
  postalCode: string | null
  website: string | null
  exchangeDate: string | null
  exchangeLocation: string | null
  memo: string | null
  tags: string[]
  isFavorite: boolean
  createdAt: string
  updatedAt: string
}

export type CardInput = Partial<Omit<Card, 'id' | 'createdAt' | 'updatedAt'>>

export type CardsResponse = {
  cards: Card[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export type UploadResponse = {
  imageUrl: string
  thumbnailUrl: string
}
