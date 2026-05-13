export async function enhanceCardImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      try {
        const canvas = document.createElement('canvas')
        // 長辺を最大2400pxに制限
        const maxSize = 2400
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')!

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        const len = data.length

        // ---- Step 1: グレースケール変換（名刺のスキャン風）----
        for (let i = 0; i < len; i += 4) {
          const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114)
          data[i] = gray
          data[i + 1] = gray
          data[i + 2] = gray
        }

        // ---- Step 2: ヒストグラム計算（上位2%・下位2%をクリップ）----
        const hist = new Uint32Array(256)
        for (let i = 0; i < len; i += 4) hist[data[i]]++
        const pixelCount = (len / 4) * 0.02 // 2%クリップ
        let low = 0, high = 255, acc = 0
        for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= pixelCount) { low = v; break } }
        acc = 0
        for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc >= pixelCount) { high = v; break } }
        const range = high - low || 1

        // ---- Step 3: コントラスト伸張 + ガンマ補正（背景を白く、文字を黒く）----
        const gamma = 0.7 // < 1 で中間調を明るく（背景を白く飛ばす）
        const lut = new Uint8Array(256)
        for (let v = 0; v < 256; v++) {
          const norm = Math.max(0, Math.min(1, (v - low) / range))
          lut[v] = Math.round(Math.pow(norm, gamma) * 255)
        }
        for (let i = 0; i < len; i += 4) {
          data[i] = lut[data[i]]
          data[i + 1] = lut[data[i + 1]]
          data[i + 2] = lut[data[i + 2]]
        }

        // ---- Step 4: アンシャープマスク（シャープネス強化）----
        const src = new Uint8ClampedArray(data)
        const w = canvas.width
        const h = canvas.height
        const amount = 1.2 // シャープネス強度（前: 0.6）
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const idx = (y * w + x) * 4
            const blur = (
              src[idx - w * 4 - 4] + src[idx - w * 4] + src[idx - w * 4 + 4] +
              src[idx - 4]         + src[idx]          + src[idx + 4] +
              src[idx + w * 4 - 4] + src[idx + w * 4] + src[idx + w * 4 + 4]
            ) / 9
            const sharp = Math.max(0, Math.min(255, src[idx] + amount * (src[idx] - blur)))
            data[idx] = sharp
            data[idx + 1] = sharp
            data[idx + 2] = sharp
          }
        }

        ctx.putImageData(new ImageData(data, canvas.width, canvas.height), 0, 0)

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('canvas toBlob failed'))
            resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }))
          },
          'image/jpeg',
          0.92,
        )
      } catch (e) {
        reject(e)
      }
    }
    img.onerror = () => reject(new Error('image load failed'))
    img.src = url
  })
}
