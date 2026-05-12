import type { VercelRequest, VercelResponse } from '@vercel/node'
import { put } from '@vercel/blob'

export const config = {
  api: { bodyParser: false },
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-filename')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') return res.status(405).end()

  try {
    const rawFilename = req.headers['x-filename']
    const filename = typeof rawFilename === 'string'
      ? decodeURIComponent(rawFilename)
      : `card_${Date.now()}.jpg`
    const contentType = (req.headers['content-type'] as string) || 'image/jpeg'

    const blob = await put(`cards/${filename}`, req, {
      access: 'public',
      contentType,
    })

    res.json({
      imageUrl: blob.url,
      thumbnailUrl: blob.url,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: String(err) })
  }
}
