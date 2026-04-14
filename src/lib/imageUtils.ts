/**
 * Remove near-white background from a base64 PNG image using Canvas.
 * Returns a new base64 string with transparent background.
 */
export async function removeWhiteBackground(
  base64: string,
  threshold = 240,
  edgeFade = 8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) { reject(new Error('Canvas not supported')); return }

      ctx.drawImage(img, 0, 0)
      const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height)

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2]

        // Consider a pixel "white-ish" if all channels are above threshold
        // and the channels are fairly equal (not a saturated color)
        const maxChannel = Math.max(r, g, b)
        const minChannel = Math.min(r, g, b)
        const saturation = maxChannel === 0 ? 0 : (maxChannel - minChannel) / maxChannel

        if (maxChannel >= threshold && saturation < 0.15) {
          // Scale alpha: pure white = fully transparent, near threshold = fading
          const whiteness = (maxChannel - threshold) / (255 - threshold)
          data[i + 3] = Math.round((1 - whiteness) * 255 * (1 - whiteness))
        }
      }

      // Edge fade: blend transparency near the outer edge for cleaner cutout
      if (edgeFade > 0) {
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4
            const distToEdge = Math.min(x, y, width - 1 - x, height - 1 - y)
            if (distToEdge < edgeFade) {
              const fade = distToEdge / edgeFade
              data[idx + 3] = Math.round(data[idx + 3] * fade)
            }
          }
        }
      }

      ctx.putImageData(new ImageData(data, width, height), 0, 0)
      resolve(canvas.toDataURL('image/png').split(',')[1])
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = `data:image/png;base64,${base64}`
  })
}
