import type { VercelRequest, VercelResponse } from '@vercel/node'
import { put } from '@vercel/blob'

export const config = {
  api: { bodyParser: false },
}

function readBuffer(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
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

    // リクエストボディをバッファに読み込んでからアップロード
    const buffer = await readBuffer(req)
    if (buffer.length === 0) {
      return res.status(400).json({ error: 'ファイルが空です' })
    }

    const blob = await put(`cards/${filename}`, buffer, {
      access: 'public',
      contentType,
    })

    res.json({
      imageUrl: blob.url,
      thumbnailUrl: blob.url,
    })
  } catch (err) {
    console.error('upload error:', err)
    res.status(500).json({ error: String(err) })
  }
}
