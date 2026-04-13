import type { VercelRequest, VercelResponse } from '@vercel/node'

const PREFERRED_MODELS = [
  'gemini-2.0-flash-exp-image-generation',
  'gemini-2.0-flash-preview-image-generation',
  'gemini-2.5-flash-preview-image-generation',
]

// Retry config: wait 8s then 16s before giving up
const RETRY_DELAYS = [8000, 16000]

let cachedModel: string | null = null

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function findModel(apiKey: string): Promise<string> {
  if (cachedModel) return cachedModel

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=100`
  )
  if (!res.ok) throw new Error('Could not reach Gemini API.')

  const data = await res.json() as { models?: { name: string; supportedGenerationMethods?: string[] }[] }
  const models = data.models ?? []

  for (const name of PREFERRED_MODELS) {
    const found = models.find(
      m => m.name === `models/${name}` &&
        m.supportedGenerationMethods?.includes('generateContent')
    )
    if (found) { cachedModel = name; return name }
  }

  const fallback = models.find(
    m => m.name.toLowerCase().includes('image') &&
      m.supportedGenerationMethods?.includes('generateContent')
  )
  if (fallback) {
    cachedModel = fallback.name.replace('models/', '')
    return cachedModel
  }

  throw new Error('No image generation model available.')
}

async function callGemini(
  apiKey: string,
  model: string,
  prompt: string,
  imageBase64?: string,
  imageMimeType?: string
): Promise<{ status: number; data: unknown }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const parts: object[] = []
  if (imageBase64 && imageMimeType) {
    parts.push({ inlineData: { mimeType: imageMimeType, data: imageBase64 } })
    parts.push({ text: `Use this image as a reference and transform it into a sticker: ${prompt}` })
  } else {
    parts.push({ text: prompt })
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
  })

  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key not configured on server.' })
  }

  const { prompt, imageBase64, imageMimeType } = req.body as {
    prompt: string
    imageBase64?: string
    imageMimeType?: string
  }

  if (!prompt) return res.status(400).json({ error: 'Prompt is required.' })

  try {
    const model = await findModel(apiKey)

    // Attempt generation with automatic retries on rate limit
    let lastError = ''
    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
      if (attempt > 0) {
        await sleep(RETRY_DELAYS[attempt - 1])
      }

      const { status, data } = await callGemini(apiKey, model, prompt, imageBase64, imageMimeType)

      if (status === 429) {
        lastError = 'Rate limit hit — please try again in a moment.'
        continue // retry after delay
      }

      if (status !== 200) {
        const err = data as { error?: { message?: string } }
        const msg = err?.error?.message ?? `Gemini error: HTTP ${status}`
        return res.status(status).json({ error: msg })
      }

      // Success — extract image
      const result = data as {
        candidates?: { content?: { parts?: { inlineData?: { mimeType: string; data: string } }[] } }[]
      }
      const parts2 = result?.candidates?.[0]?.content?.parts ?? []
      const imgPart = parts2.find(p => p.inlineData?.mimeType?.startsWith('image/'))

      if (!imgPart?.inlineData) {
        return res.status(500).json({ error: 'No image returned. Try rephrasing your prompt.' })
      }

      return res.status(200).json({ imageBase64: imgPart.inlineData.data })
    }

    // All retries exhausted
    return res.status(429).json({ error: lastError })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Generation failed.'
    return res.status(500).json({ error: msg })
  }
}
