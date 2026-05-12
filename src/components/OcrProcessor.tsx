import { useState, useCallback } from 'react'
import { createWorker } from 'tesseract.js'

type OcrResult = {
  rawText: string
  confidence: number
}

type Props = {
  imageFile: File | null
  onComplete: (result: OcrResult) => void
}

export default function OcrProcessor({ imageFile, onComplete }: Props) {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const runOcr = useCallback(async () => {
    if (!imageFile) return
    setStatus('running')
    setProgress(0)
    setErrorMsg(null)

    let worker
    try {
      worker = await createWorker(['jpn', 'eng'], 1, {
        workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js',
        langPath: 'https://tessdata.projectnaptha.com/4.0.0',
        corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core-simd-lstm.wasm.js',
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100))
          } else if (m.status === 'loading language traineddata') {
            setProgress(Math.round(m.progress * 30))
          }
        },
      })
      const { data } = await worker.recognize(imageFile)
      setStatus('done')
      onComplete({ rawText: data.text.trim(), confidence: data.confidence })
    } catch (e) {
      setStatus('error')
      setErrorMsg(String(e))
    } finally {
      if (worker) await worker.terminate()
    }
  }, [imageFile, onComplete])

  if (status === 'idle') {
    return (
      <button
        type="button"
        onClick={runOcr}
        disabled={!imageFile}
        className="w-full py-3 px-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        OCRでテキスト抽出
      </button>
    )
  }

  if (status === 'running') {
    return (
      <div className="space-y-2 p-4 bg-blue-50 rounded-xl">
        <div className="flex justify-between text-sm text-blue-700">
          <span>OCR処理中...</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-blue-600">初回は言語データのダウンロードに時間がかかります（1〜2分）</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="space-y-2 p-4 bg-red-50 rounded-xl">
        <p className="text-sm text-red-600">OCRエラー: {errorMsg}</p>
        <button
          type="button"
          onClick={runOcr}
          className="w-full py-2 px-4 border border-red-300 text-red-600 rounded-xl text-sm hover:bg-red-50 transition-colors"
        >
          再試行
        </button>
      </div>
    )
  }

  return (
    <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
      ✓ OCR完了 — 以下のフォームで内容を確認・編集してください
    </div>
  )
}
