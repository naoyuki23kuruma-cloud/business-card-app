import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCardsStore } from '../store/cards'
import { uploadApi } from '../lib/api'
import CameraCapture from '../components/CameraCapture'
import OcrProcessor from '../components/OcrProcessor'
import CardForm from '../components/CardForm'
import type { CardInput } from '../types/card'

type Step = 'capture' | 'ocr' | 'form'

function parseOcrText(text: string): Partial<CardInput> {
  const result: Partial<CardInput> = { rawOcrText: text }
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean)

  for (const line of lines) {
    if (!result.email && /[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/.test(line)) {
      result.email = line.match(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/)?.[0]
    }
    if (!result.website && /https?:\/\//.test(line)) {
      result.website = line.match(/https?:\/\/[^\s]+/)?.[0]
    }
    if (!result.phone && /[\d\-（）()]{10,}/.test(line) && !result.email) {
      result.phone = line.trim()
    }
  }
  return result
}

const STEPS: Step[] = ['capture', 'ocr', 'form']
const STEP_LABELS: Record<Step, string> = { capture: '画像選択', ocr: 'OCR読み取り', form: '情報編集' }

export default function AddCard() {
  const navigate = useNavigate()
  const { addCard } = useCardsStore()
  const [step, setStep] = useState<Step>('capture')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [ocrData, setOcrData] = useState<Partial<CardInput>>({})
  const [saving, setSaving] = useState(false)

  const handleCapture = (file: File, previewUrl: string) => {
    setImageFile(file)
    setImagePreview(previewUrl)
    setStep('ocr')
  }

  const handleOcrComplete = useCallback(({ rawText }: { rawText: string; confidence: number }) => {
    setOcrData(parseOcrText(rawText))
    setStep('form')
  }, [])

  const handleSave = async (formData: CardInput) => {
    setSaving(true)
    try {
      let imageUrl: string | null = null
      let thumbnailUrl: string | null = null

      if (imageFile) {
        const urls = await uploadApi.uploadImage(imageFile)
        imageUrl = urls.imageUrl
        thumbnailUrl = urls.thumbnailUrl
      }

      const card = await addCard({
        ...ocrData,
        ...formData,
        imageUrl,
        thumbnailUrl,
      })
      navigate(`/cards/${card.id}`)
    } catch (e) {
      alert('保存に失敗しました: ' + String(e))
    } finally {
      setSaving(false)
    }
  }

  const currentStepIndex = STEPS.indexOf(step)

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                i <= currentStepIndex ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'
              }`}
            >
              {i + 1}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-px ${i < currentStepIndex ? 'bg-primary-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
        <span className="ml-1 text-sm text-gray-600 font-medium">{STEP_LABELS[step]}</span>
      </div>

      {step === 'capture' && (
        <>
          <h2 className="text-lg font-bold">名刺を撮影・選択</h2>
          <CameraCapture onCapture={handleCapture} />
          <button
            type="button"
            onClick={() => setStep('form')}
            className="w-full py-2 px-4 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            画像なしで登録
          </button>
        </>
      )}

      {step === 'ocr' && (
        <>
          <h2 className="text-lg font-bold">テキスト読み取り (OCR)</h2>
          {imagePreview && (
            <img src={imagePreview} alt="名刺" className="w-full rounded-xl max-h-48 object-contain bg-gray-100" />
          )}
          <OcrProcessor imageFile={imageFile} onComplete={handleOcrComplete} />
          <button
            type="button"
            onClick={() => setStep('form')}
            className="w-full py-2 px-4 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            OCRをスキップして手動入力
          </button>
        </>
      )}

      {step === 'form' && (
        <>
          <h2 className="text-lg font-bold">名刺情報の確認・編集</h2>
          {imagePreview && (
            <img src={imagePreview} alt="名刺" className="w-full rounded-xl max-h-48 object-contain bg-gray-100" />
          )}
          <CardForm initialData={ocrData} onSubmit={handleSave} submitLabel="名刺を登録" loading={saving} />
        </>
      )}
    </div>
  )
}
