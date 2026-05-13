import type { VercelRequest, VercelResponse } from '@vercel/node'
import FormData from 'form-data'
import https from 'https'

export const config = {
  api: { bodyParser: false },
}

function readBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => chunks.push(c))
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
    const imageBuffer = await readBody(req)
    const filename = typeof req.headers['x-filename'] === 'string'
      ? decodeURIComponent(req.headers['x-filename'])
      : 'card.jpg'
    const contentType = (req.headers['content-type'] as string) || 'image/jpeg'

    const form = new FormData()
    form.append('apikey', process.env.OCR_SPACE_API_KEY ?? '')
    form.append('language', 'jpn')
    form.append('isOverlayRequired', 'false')
    form.append('detectOrientation', 'true')
    form.append('scale', 'true')
    form.append('OCREngine', '2')
    form.append('file', imageBuffer, { filename, contentType })

    const ocrResult = await new Promise<string>((resolve, reject) => {
      const formHeaders = form.getHeaders()
      const options = {
        hostname: 'api.ocr.space',
        path: '/parse/image',
        method: 'POST',
        headers: formHeaders,
      }
      const request = https.request(options, (response) => {
        const chunks: Buffer[] = []
        response.on('data', (c: Buffer) => chunks.push(c))
        response.on('end', () => resolve(Buffer.concat(chunks).toString()))
      })
      request.on('error', reject)
      form.pipe(request)
    })

    const parsed = JSON.parse(ocrResult)
    if (parsed.IsErroredOnProcessing) {
      return res.status(500).json({ error: parsed.ErrorMessage?.[0] ?? 'OCR failed' })
    }

    const text = parsed.ParsedResults
      ?.map((r: { ParsedText: string }) => r.ParsedText)
      .join('\n') ?? ''

    res.json({ text })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: String(err) })
  }
}
