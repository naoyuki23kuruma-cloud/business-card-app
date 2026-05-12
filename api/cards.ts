import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../lib/prisma'
import { Prisma } from '@prisma/client'

function qs(val: unknown): string {
  return typeof val === 'string' ? val : ''
}

type CardInput = {
  tags?: string[] | string
  exchangeDate?: string | null
  imageUrl?: string | null
  thumbnailUrl?: string | null
  rawOcrText?: string | null
  name?: string | null
  nameKana?: string | null
  company?: string | null
  department?: string | null
  title?: string | null
  email?: string | null
  phone?: string | null
  mobile?: string | null
  fax?: string | null
  address?: string | null
  postalCode?: string | null
  website?: string | null
  exchangeLocation?: string | null
  memo?: string | null
  isFavorite?: boolean
}

function serializeCard(body: CardInput): Prisma.CardCreateInput {
  const tagsStr = Array.isArray(body.tags) ? JSON.stringify(body.tags) : (body.tags ?? '[]')
  return {
    imageUrl: body.imageUrl ?? undefined,
    thumbnailUrl: body.thumbnailUrl ?? undefined,
    rawOcrText: body.rawOcrText ?? undefined,
    name: body.name ?? undefined,
    nameKana: body.nameKana ?? undefined,
    company: body.company ?? undefined,
    department: body.department ?? undefined,
    title: body.title ?? undefined,
    email: body.email ?? undefined,
    phone: body.phone ?? undefined,
    mobile: body.mobile ?? undefined,
    fax: body.fax ?? undefined,
    address: body.address ?? undefined,
    postalCode: body.postalCode ?? undefined,
    website: body.website ?? undefined,
    exchangeDate: body.exchangeDate ? new Date(body.exchangeDate) : null,
    exchangeLocation: body.exchangeLocation ?? undefined,
    memo: body.memo ?? undefined,
    tags: tagsStr,
    isFavorite: body.isFavorite,
  }
}

function deserializeCard(card: { tags: string; [key: string]: unknown }) {
  let parsedTags: string[] = []
  try { parsedTags = JSON.parse(card.tags) as string[] } catch { parsedTags = [] }
  return { ...card, tags: parsedTags }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    if (req.method === 'GET') {
      const q = qs(req.query['q']).trim()
      const tag = qs(req.query['tag']).trim()
      const favoriteOnly = req.query['favorite'] === 'true'
      const page = Math.max(1, parseInt(qs(req.query['page']) || '1', 10))
      const limit = Math.min(100, Math.max(1, parseInt(qs(req.query['limit']) || '20', 10)))
      const skip = (page - 1) * limit

      const searchConditions: Prisma.CardWhereInput[] = q
        ? [
            { name: { contains: q, mode: 'insensitive' } },
            { nameKana: { contains: q, mode: 'insensitive' } },
            { company: { contains: q, mode: 'insensitive' } },
            { department: { contains: q, mode: 'insensitive' } },
            { title: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q } },
            { mobile: { contains: q } },
            { address: { contains: q, mode: 'insensitive' } },
            { memo: { contains: q, mode: 'insensitive' } },
            { rawOcrText: { contains: q, mode: 'insensitive' } },
            { tags: { contains: q } },
          ]
        : []

      const where: Prisma.CardWhereInput = {
        ...(favoriteOnly ? { isFavorite: true } : {}),
        ...(tag ? { tags: { contains: tag } } : {}),
        ...(searchConditions.length > 0 ? { OR: searchConditions } : {}),
      }

      const [cards, total] = await Promise.all([
        prisma.card.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
        prisma.card.count({ where }),
      ])

      return res.json({
        cards: cards.map(deserializeCard),
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      })
    }

    if (req.method === 'POST') {
      const card = await prisma.card.create({ data: serializeCard(req.body as CardInput) })
      return res.status(201).json(deserializeCard(card))
    }

    res.status(405).end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: String(err) })
  }
}
