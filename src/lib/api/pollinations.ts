import { POLLINATIONS_MODELS, type StickerStyle } from '../types'

const GEN_BASE = 'https://gen.pollinations.ai/image'
const LEGACY_BASE = 'https://image.pollinations.ai/prompt'

function apiKey(): string | undefined {
  const k =
    import.meta.env.VITE_POLLINATIONS_API_KEY?.trim() ||
    import.meta.env.VITE_POLLINATIONS_PUBLISHABLE_KEY?.trim()
  return k || undefined
}

/** gen.pollinations.ai model names; map legacy aliases. */
function modelForGen(style: StickerStyle): string {
  const m = POLLINATIONS_MODELS[style] ?? 'flux'
  if (m === 'flux-realism') return 'flux'
  return m
}

function buildGenUrl(
  prompt: string,
  opts: { model: string; seed: number; key: string; nologo: boolean }
): string {
  const url = new URL(`${GEN_BASE}/${encodeURIComponent(prompt)}`)
  url.searchParams.set('width', '1024')
  url.searchParams.set('height', '1024')
  url.searchParams.set('model', opts.model)
  url.searchParams.set('seed', String(opts.seed))
  url.searchParams.set('enhance', 'false')
  if (opts.nologo) url.searchParams.set('nologo', 'true')
  // Query `key` is required for many browser GET image requests; Bearer alone often is not enough.
  url.searchParams.set('key', opts.key)
  return url.toString()
}

async function responseDetail(res: Response): Promise<string> {
  const ct = res.headers.get('content-type') ?? ''
  if (ct.includes('application/json')) {
    try {
      const j = (await res.json()) as { error?: { message?: string }; message?: string }
      return j?.error?.message ?? j?.message ?? ''
    } catch {
      return ''
    }
  }
  return ''
}

export async function generateWithPollinations(
  prompt: string,
  style: StickerStyle
): Promise<string> {
  const seed = Math.floor(Math.random() * 99999)
  const key = apiKey()
  const primaryModel = modelForGen(style)

  type Attempt = { label: string; url: string; headers: HeadersInit }

  const attempts: Attempt[] = []

  if (key) {
    const authHeaders: HeadersInit = { Authorization: `Bearer ${key}` }
    // Order: prefer no-watermark first, then same model with watermark, then lighter models (often allowed on pk_ keys).
    const genModels = [primaryModel, 'zimage', 'qwen-image'] as const
    for (const model of genModels) {
      attempts.push({
        label: `gen ${model} nologo`,
        url: buildGenUrl(prompt, { model, seed, key, nologo: true }),
        headers: authHeaders,
      })
      attempts.push({
        label: `gen ${model} (watermark ok)`,
        url: buildGenUrl(prompt, { model, seed, key, nologo: false }),
        headers: authHeaders,
      })
    }
  }

  const legacyModel = POLLINATIONS_MODELS[style] ?? 'flux'
  attempts.push({
    label: 'legacy image.pollinations.ai',
    url: `${LEGACY_BASE}/${encodeURIComponent(prompt)}?width=1024&height=1024&model=${legacyModel}&nologo=true&seed=${seed}`,
    headers: {},
  })

  let lastStatus = 0
  let lastDetail = ''

  for (const a of attempts) {
    const res = await fetch(a.url, { headers: a.headers })
    if (res.ok) {
      return blobToBase64(await res.blob())
    }
    lastStatus = res.status
    lastDetail = (await responseDetail(res)) || lastDetail
  }

  throw pollinationsHttpError(lastStatus, lastDetail, Boolean(key))
}

function pollinationsHttpError(status: number, detail: string, hadKey: boolean): Error {
  const base = detail ? ` ${detail}` : ''
  const setup = hadKey
    ? ' Your key may not allow this model or nologo/watermark removal — we already tried flux, zimage, qwen-image, with and without nologo, then the legacy host. Check pollen balance at enter.pollinations.ai, or try a secret key (sk_…) only on a backend proxy (never commit it).'
    : ' Pollinations expects a free publishable key: open enter.pollinations.ai, create a key (pk_…), add VITE_POLLINATIONS_API_KEY to .env.local, restart the dev server.'

  if (status === 401 || status === 403) {
    return new Error(`Pollinations error: HTTP ${status}.${base}${setup}`)
  }
  if (status === 402) {
    return new Error(`Pollinations error: HTTP 402 (insufficient pollen).${base}`)
  }
  return new Error(`Pollinations error: HTTP ${status}.${base} Try again.`)
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
