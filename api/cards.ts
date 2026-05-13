import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Pool } from 'pg'
import { v4 as uuidv4 } from 'uuid'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
})

function qs(val: unknown): string {
  return typeof val === 'string' ? val : ''
}

function deserializeCard(row: Record<string, unknown>) {
  let tags: string[] = []
  try { tags = JSON.parse(row.tags as string) } catch { tags = [] }
  return { ...row, tags }
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
      const offset = (page - 1) * limit

      const conditions: string[] = []
      const params: unknown[] = []
      let idx = 1

      if (favoriteOnly) conditions.push(`"isFavorite" = true`)
      if (tag) { conditions.push(`tags ILIKE $${idx++}`); params.push(`%${tag}%`) }
      if (q) {
        const fields = ['name','company','department','title','email','phone','mobile','address','memo','"rawOcrText"','tags','"nameKana"']
        conditions.push(`(${fields.map(f => `${f} ILIKE $${idx}`).join(' OR ')})`)
        params.push(`%${q}%`); idx++
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
      const countResult = await pool.query(`SELECT COUNT(*) FROM cards ${where}`, params)
      const total = parseInt(countResult.rows[0].count, 10)
      const dataResult = await pool.query(
        `SELECT * FROM cards ${where} ORDER BY "createdAt" DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      )
      return res.json({
        cards: dataResult.rows.map(deserializeCard),
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      })
    }

    if (req.method === 'POST') {
      const b = req.body as Record<string, unknown>
      const id = uuidv4()
      const now = new Date()
      const tags = Array.isArray(b.tags) ? JSON.stringify(b.tags) : (b.tags ?? '[]')
      const result = await pool.query(
        `INSERT INTO cards (
          id,"imageUrl","thumbnailUrl","rawOcrText",name,"nameKana",company,department,
          title,email,phone,mobile,fax,address,"postalCode",website,
          "exchangeDate","exchangeLocation",memo,tags,"isFavorite","createdAt","updatedAt"
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23) RETURNING *`,
        [id, b.imageUrl??null, b.thumbnailUrl??null, b.rawOcrText??null,
         b.name??null, b.nameKana??null, b.company??null, b.department??null,
         b.title??null, b.email??null, b.phone??null, b.mobile??null,
         b.fax??null, b.address??null, b.postalCode??null, b.website??null,
         b.exchangeDate ? new Date(b.exchangeDate as string) : null,
         b.exchangeLocation??null, b.memo??null, tags, b.isFavorite??false, now, now]
      )
      return res.status(201).json(deserializeCard(result.rows[0]))
    }

    res.status(405).end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: String(err) })
  }
}
