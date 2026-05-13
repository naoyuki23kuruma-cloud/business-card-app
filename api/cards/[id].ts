import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
})

function deserializeCard(row: Record<string, unknown>) {
  let tags: string[] = []
  try { tags = JSON.parse(row.tags as string) } catch { tags = [] }
  return { ...row, tags }
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
      const result = await pool.query('SELECT * FROM cards WHERE id = $1', [id])
      if (result.rows.length === 0) return res.status(404).json({ error: '名刺が見つかりません' })
      return res.json(deserializeCard(result.rows[0]))
    }

    if (req.method === 'PUT') {
      const b = req.body as Record<string, unknown>
      const tags = Array.isArray(b.tags) ? JSON.stringify(b.tags) : (b.tags ?? '[]')
      const now = new Date()
      const result = await pool.query(
        `UPDATE cards SET
          "imageUrl"=$1,"thumbnailUrl"=$2,"rawOcrText"=$3,name=$4,"nameKana"=$5,
          company=$6,department=$7,title=$8,email=$9,phone=$10,mobile=$11,
          fax=$12,address=$13,"postalCode"=$14,website=$15,"exchangeDate"=$16,
          "exchangeLocation"=$17,memo=$18,tags=$19,"isFavorite"=$20,"updatedAt"=$21
        WHERE id=$22 RETURNING *`,
        [b.imageUrl??null, b.thumbnailUrl??null, b.rawOcrText??null,
         b.name??null, b.nameKana??null, b.company??null, b.department??null,
         b.title??null, b.email??null, b.phone??null, b.mobile??null,
         b.fax??null, b.address??null, b.postalCode??null, b.website??null,
         b.exchangeDate ? new Date(b.exchangeDate as string) : null,
         b.exchangeLocation??null, b.memo??null, tags, b.isFavorite??false, now, id]
      )
      if (result.rows.length === 0) return res.status(404).json({ error: '名刺が見つかりません' })
      return res.json(deserializeCard(result.rows[0]))
    }

    if (req.method === 'DELETE') {
      const result = await pool.query('DELETE FROM cards WHERE id = $1 RETURNING id', [id])
      if (result.rows.length === 0) return res.status(404).json({ error: '名刺が見つかりません' })
      return res.status(204).end()
    }

    res.status(405).end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: String(err) })
  }
}
