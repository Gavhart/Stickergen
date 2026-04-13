import type { StickerStyle } from '../types'

const FAL_BASE = 'https://fal.run'

// Map styles to the best Flux model for that vibe
// schnell = fast (4 steps), dev = quality (28 steps)
const STYLE_MODEL: Partial<Record<StickerStyle, string>> = {
  chrome: 'fal-ai/flux-pro',
  gothic: 'fal-ai/flux/dev',
  neon:   'fal-ai/flux/dev',
}

function modelForStyle(style: StickerStyle): string {
  return STYLE_MODEL[style] ?? 'fal-ai/flux/schnell'
}

export async function generateWithFal(
  apiKey: string,
  prompt: string,
  style: StickerStyle
): Promise<string> {
  const model = modelForStyle(style)
  const isSchnell = model.includes('schnell')

  const body: Record<string, unknown> = {
    prompt,
    image_size: 'square_hd',      // 1024x1024
    num_images: 1,
    enable_safety_checker: false,  // stickers are fine
    ...(isSchnell
      ? { num_inference_steps: 4 }
      : { num_inference_steps: 28, guidance_scale: 3.5 }),
  }

  const res = await fetch(`${FAL_BASE}/${model}`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = (err as { detail?: string; message?: string })?.detail
      ?? (err as { detail?: string; message?: string })?.message
      ?? `HTTP ${res.status}`
    if (res.status === 401 || res.status === 403) {
      throw new Error('Invalid fal.ai API key. Get one free at fal.ai.')
    }
    if (res.status === 429) throw new Error('Rate limit hit. Wait a moment and retry.')
    throw new Error(`fal.ai error: ${msg}`)
  }

  const data = await res.json()
  const imageUrl: string | undefined = data?.images?.[0]?.url
  if (!imageUrl) throw new Error('No image returned from fal.ai. Try again.')

  // Fetch the image and convert to base64
  const imgRes = await fetch(imageUrl)
  if (!imgRes.ok) throw new Error('Failed to download generated image.')
  const blob = await imgRes.blob()
  return blobToBase64(blob)
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = () => reject(new Error('Failed to process image.'))
    reader.readAsDataURL(blob)
  })
}
