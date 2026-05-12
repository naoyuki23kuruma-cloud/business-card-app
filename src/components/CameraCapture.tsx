import { useRef, useState, useCallback, useEffect } from 'react'
import { Camera, Upload, X } from 'lucide-react'
import { enhanceCardImage } from '../lib/imageEnhance'

type Props = {
  onCapture: (file: File, previewUrl: string) => void
}

export default function CameraCapture({ onCapture }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [mode, setMode] = useState<'select' | 'camera'>('select')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const enhanced = await enhanceCardImage(file).catch(() => file)
    const url = URL.createObjectURL(enhanced)
    setPreview(url)
    onCapture(enhanced, url)
  }

  useEffect(() => {
    if (mode === 'camera' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(() => {})
    }
  }, [mode])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 } },
      })
      streamRef.current = stream
      setMode('camera')
    } catch {
      fileInputRef.current?.click()
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setMode('select')
  }, [])

  const captureFromCamera = useCallback(() => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)
    canvas.toBlob(async (blob) => {
      if (!blob) return
      const raw = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' })
      const enhanced = await enhanceCardImage(raw).catch(() => raw)
      const url = URL.createObjectURL(enhanced)
      setPreview(url)
      stopCamera()
      onCapture(enhanced, url)
    }, 'image/jpeg', 0.92)
  }, [stopCamera, onCapture])

  if (mode === 'camera') {
    return (
      <div className="space-y-3">
        <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-xl bg-black" />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={captureFromCamera}
            className="flex-1 py-2 px-4 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
          >
            撮影
          </button>
          <button
            type="button"
            onClick={stopCamera}
            className="py-2 px-4 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {preview ? (
        <div className="relative">
          <img src={preview} alt="プレビュー" className="w-full rounded-xl object-contain max-h-64 bg-gray-100" />
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center text-gray-400">
          <p className="text-3xl mb-2">📷</p>
          <p className="text-sm">名刺の画像を追加してください</p>
        </div>
      )}

      <div className="flex gap-3">
        <label className="flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
          <Upload size={18} />
          ファイル選択 / カメラ
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        <button
          type="button"
          onClick={startCamera}
          className="flex items-center gap-2 py-2 px-4 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Camera size={18} />
          ライブ
        </button>
      </div>
    </div>
  )
}
