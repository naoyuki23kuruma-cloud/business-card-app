import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../lib/prisma'
import { Prisma } from '@prisma/client'

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

function serializeCard(body: CardInput): Prisma.CardUpdateInput {
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const id = typeof req.query['id'] === 'string' ? req.query['id'] : ''
  if (!id) return res.status(400).json({ error: 'IDが必要です' })

  try {
    if (req.method === 'GET') {
      const card = await prisma.card.findUnique({ where: { id } })
      if (!card) return res.status(404).json({ error: '名刺が見つかりません' })
      return res.json(deserializeCard(card))
    }

    if (req.method === 'PUT') {
      const exists = await prisma.card.findUnique({ where: { id } })
      if (!exists) return res.status(404).json({ error: '名刺が見つかりません' })
      const card = await prisma.card.update({ where: { id }, data: serializeCard(req.body as CardInput) })
      return res.json(deserializeCard(card))
    }

    if (req.method === 'DELETE') {
      const exists = await prisma.card.findUnique({ where: { id } })
      if (!exists) return res.status(404).json({ error: '名刺が見つかりません' })
      await prisma.card.delete({ where: { id } })
      return res.status(204).end()
    }

    res.status(405).end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: String(err) })
  }
}
