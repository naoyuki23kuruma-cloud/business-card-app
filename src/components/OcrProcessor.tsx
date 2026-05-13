import { useState, useCallback } from 'react'
import { apiClient } from '../lib/api'

type OcrResult = {
  rawText: string
  confidence: number
}

type Props = {
  imageFile: File | null
  onComplete: (result: OcrResult) => void
}

export default function OcrProcessor({ imageFile, onComplete }: Props) {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const runOcr = useCallback(async () => {
    if (!imageFile) return
    setStatus('running')
    setErrorMsg(null)

    try {
      const res = await apiClient.post<{ text: string }>('/ocr', imageFile, {
        headers: {
          'Content-Type': imageFile.type,
          'x-filename': encodeURIComponent(imageFile.name),
        },
      })
      setStatus('done')
      onComplete({ rawText: res.data.text.trim(), confidence: 90 })
    } catch (e) {
      setStatus('error')
      setErrorMsg(String(e))
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
        <div className="flex items-center gap-3 text-sm text-blue-700">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>OCR処理中...</span>
        </div>
        <p className="text-xs text-blue-600">クラウドOCRで解析しています（数秒）</p>
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
