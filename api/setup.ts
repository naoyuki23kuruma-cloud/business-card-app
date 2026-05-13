import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
  connectionTimeoutMillis: 10000,
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    // テーブルを作成（既に存在する場合はスキップ）
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        "imageUrl" TEXT,
        "thumbnailUrl" TEXT,
        "rawOcrText" TEXT,
        name TEXT,
        "nameKana" TEXT,
        company TEXT,
        department TEXT,
        title TEXT,
        email TEXT,
        phone TEXT,
        mobile TEXT,
        fax TEXT,
        address TEXT,
        "postalCode" TEXT,
        website TEXT,
        "exchangeDate" TIMESTAMPTZ,
        "exchangeLocation" TEXT,
        memo TEXT,
        tags TEXT NOT NULL DEFAULT '[]',
        "isFavorite" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    // 現在のカード数を確認
    const countResult = await pool.query('SELECT COUNT(*) FROM cards')
    const count = parseInt(countResult.rows[0].count, 10)

    // テーブルの列情報を取得
    const colResult = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'cards'
      ORDER BY ordinal_position
    `)

    res.json({
      status: 'ok',
      message: 'テーブルの準備が完了しました',
      cardCount: count,
      columns: colResult.rows.map((r) => r.column_name),
    })
  } catch (err) {
    console.error('setup error:', err)
    res.status(500).json({ error: String(err) })
  }
}
