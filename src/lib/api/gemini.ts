let _cachedModel: string | null = null

async function findImageModel(apiKey: string): Promise<string> {
  if (_cachedModel) return _cachedModel

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=100`
  )
  if (!res.ok) throw new Error('Could not list models. Check your API key.')
  const data = await res.json()
  const models: Array<{ name: string; supportedGenerationMethods?: string[] }> = data.models ?? []

  const PREFERRED = [
    'gemini-2.0-flash-exp-image-generation',
    'gemini-2.0-flash-preview-image-generation',
    'gemini-2.5-flash-preview-image-generation',
    'gemini-2.5-flash-image',
  ]

  for (const name of PREFERRED) {
    const found = models.find(
      m => m.name === `models/${name}` &&
        m.supportedGenerationMethods?.includes('generateContent')
    )
    if (found) { _cachedModel = name; return name }
  }

  const fallback = models.find(
    m => m.name.toLowerCase().includes('image') &&
      m.supportedGenerationMethods?.includes('generateContent')
  )
  if (fallback) {
    _cachedModel = fallback.name.replace('models/', '')
    return _cachedModel
  }

  throw new Error(
    'No image-generation model found for this API key. ' +
    'Available: ' + models.map(m => m.name.replace('models/', '')).slice(0, 5).join(', ')
  )
}

export async function generateWithGemini(
  apiKey: string,
  prompt: string,
  imageBase64?: string,
  imageMimeType?: string
): Promise<string> {
  const model = await findImageModel(apiKey)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  // Build parts — image first if provided, then text
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

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = (err as { error?: { message?: string } })?.error?.message ?? `HTTP ${res.status}`
    if (res.status === 403) throw new Error('API key invalid or image generation not enabled.')
    if (res.status === 429) throw new Error('Rate limit hit. Wait a moment and retry.')
    throw new Error(msg)
  }

  const data = await res.json()
  const parts2: Array<{ inlineData?: { mimeType: string; data: string } }> =
    data?.candidates?.[0]?.content?.parts ?? []
  const imgPart = parts2.find(p => p.inlineData?.mimeType?.startsWith('image/'))
  if (!imgPart?.inlineData) throw new Error('No image in response. Try rephrasing your prompt.')
  return imgPart.inlineData.data
}

export function buildPrompt(
  userPrompt: string,
  stylePrompt: string,
  colorPrompt: string
): string {
  return `${userPrompt}, ${stylePrompt}, ${colorPrompt}, transparent background, centered sticker design, high quality`
}
