export async function enhanceCardImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      try {
        const canvas = document.createElement('canvas')
        // 長辺を最大2000pxに制限（高品質維持）
        const maxSize = 2000
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')!

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        // オートレベル: チャンネルごとにmin/maxを求めて伸張
        let rMin = 255, rMax = 0, gMin = 255, gMax = 0, bMin = 255, bMax = 0
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] < rMin) rMin = data[i]
          if (data[i] > rMax) rMax = data[i]
          if (data[i + 1] < gMin) gMin = data[i + 1]
          if (data[i + 1] > gMax) gMax = data[i + 1]
          if (data[i + 2] < bMin) bMin = data[i + 2]
          if (data[i + 2] > bMax) bMax = data[i + 2]
        }

        const rRange = rMax - rMin || 1
        const gRange = gMax - gMin || 1
        const bRange = bMax - bMin || 1

        // コントラスト強調 + 明るさ補正
        for (let i = 0; i < data.length; i += 4) {
          data[i]     = Math.round(((data[i]     - rMin) / rRange) * 255)
          data[i + 1] = Math.round(((data[i + 1] - gMin) / gRange) * 255)
          data[i + 2] = Math.round(((data[i + 2] - bMin) / bRange) * 255)
        }

        // シャープネス（アンシャープマスク）
        const sharp = new ImageData(new Uint8ClampedArray(data), canvas.width, canvas.height)
        const src = new Uint8ClampedArray(data)
        const w = canvas.width
        const h = canvas.height
        const amount = 0.6
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const idx = (y * w + x) * 4
            for (let c = 0; c < 3; c++) {
              const blur = (
                src[idx - w * 4 - 4 + c] + src[idx - w * 4 + c] + src[idx - w * 4 + 4 + c] +
                src[idx - 4 + c]         + src[idx + c]          + src[idx + 4 + c] +
                src[idx + w * 4 - 4 + c] + src[idx + w * 4 + c] + src[idx + w * 4 + 4 + c]
              ) / 9
              sharp.data[idx + c] = Math.max(0, Math.min(255, src[idx + c] + amount * (src[idx + c] - blur)))
            }
          }
        }

        ctx.putImageData(sharp, 0, 0)

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
