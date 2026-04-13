import { POLLINATIONS_MODELS, type StickerStyle } from '../types'

const GEN_BASE = 'https://gen.pollinations.ai/image'
const LEGACY_BASE = 'https://image.pollinations.ai/prompt'

/** gen.pollinations.ai only exposes a subset of names; map legacy aliases to a supported id. */
function modelForGen(style: StickerStyle): string {
  const m = POLLINATIONS_MODELS[style] ?? 'flux'
  if (m === 'flux-realism') return 'flux'
  return m
}

export async function generateWithPollinations(
  prompt: string,
  style: StickerStyle
): Promise<string> {
  const seed = Math.floor(Math.random() * 99999)
  const key = import.meta.env.VITE_POLLINATIONS_API_KEY?.trim()

  if (key) {
    const model = modelForGen(style)
    const url = new URL(`${GEN_BASE}/${encodeURIComponent(prompt)}`)
    url.searchParams.set('width', '1024')
    url.searchParams.set('height', '1024')
    url.searchParams.set('model', model)
    url.searchParams.set('seed', String(seed))
    url.searchParams.set('nologo', 'true')
    url.searchParams.set('enhance', 'false')

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${key}` },
    })
    if (!res.ok) {
      throw pollinationsHttpError(res.status)
    }
    return blobToBase64(await res.blob())
  }

  // No key: try legacy URL (may 403 in some browsers / regions)
  const legacyModel = POLLINATIONS_MODELS[style] ?? 'flux'
  const legacyUrl = `${LEGACY_BASE}/${encodeURIComponent(prompt)}?width=1024&height=1024&model=${legacyModel}&nologo=true&seed=${seed}`
  const res = await fetch(legacyUrl)
  if (!res.ok) {
    throw pollinationsHttpError(res.status)
  }
  return blobToBase64(await res.blob())
}

function pollinationsHttpError(status: number): Error {
  const setup =
    ' Pollinations now uses api.gen.pollinations.ai with a free key: open enter.pollinations.ai, create a publishable key (pk_…), and add VITE_POLLINATIONS_API_KEY=<your-key> to .env.local — then restart the dev server.'
  if (status === 401 || status === 403) {
    return new Error(`Pollinations error: HTTP ${status}.${setup}`)
  }
  return new Error(`Pollinations error: HTTP ${status}. Try again.`)
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
