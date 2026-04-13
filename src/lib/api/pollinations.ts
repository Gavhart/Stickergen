import { POLLINATIONS_MODELS, type StickerStyle } from '../types'

export async function generateWithPollinations(
  prompt: string,
  style: StickerStyle
): Promise<string> {
  const model = POLLINATIONS_MODELS[style] ?? 'flux'
  const seed = Math.floor(Math.random() * 99999)
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&model=${model}&nologo=true&seed=${seed}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Pollinations error: HTTP ${res.status}. Try again.`)

  const blob = await res.blob()
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1]) // strip data:image/...;base64,
    }
    reader.onerror = () => reject(new Error('Failed to process image.'))
    reader.readAsDataURL(blob)
  })
}
