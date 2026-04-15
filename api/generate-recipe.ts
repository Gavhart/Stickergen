import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? ''
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const FREE_LIMIT = 5

const SYSTEM_PROMPT = `You are a professional chef and recipe developer.
Generate a complete, well-tested recipe based on the user's request.
Return ONLY valid JSON — no markdown, no explanation, just the JSON object.
Use this exact schema:
{
  "title": "Recipe Name",
  "description": "1-2 sentence description of the dish",
  "servings": 4,
  "prep_time": 15,
  "cook_time": 30,
  "tags": ["dinner", "italian"],
  "ingredients": [
    { "amount": "2", "unit": "cups", "item": "all-purpose flour" },
    { "amount": "1", "unit": "tsp", "item": "kosher salt" }
  ],
  "steps": [
    "Bring a large pot of salted water to a boil.",
    "Add the pasta and cook according to package directions."
  ]
}
Rules:
- ingredients must be an array of objects with amount, unit, item
- steps must be an array of strings, each a clear action
- tags must use lowercase kebab-style words
- prep_time and cook_time are integers in minutes
- servings is an integer`

async function callGemini(prompt: string): Promise<{ status: number; data: unknown }> {
  const models = [
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
  ]
  for (const model of models) {
    const url = \`https://generativelanguage.googleapis.com/v1beta/models/\${model}:generateContent?key=\${GEMINI_API_KEY}\`
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: \`\${SYSTEM_PROMPT}\n\nUser request: \${prompt}\` }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 2048 },
        }),
      })
      if (r.status === 404) continue
      const data = await r.json()
      return { status: r.status, data }
    } catch { continue }
  }
  return { status: 500, data: { error: 'All models failed' } }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })

  const { prompt, userId } = req.body as { prompt?: string; userId?: string }
  if (!prompt?.trim()) return res.status(400).json({ error: 'Prompt is required.' })
  if (!GEMINI_API_KEY) return res.status(500).json({ error: 'API key not configured.' })

  // Check & increment usage limit via Supabase RPC
  if (userId && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const { data: profile } = await admin.from('profiles').select('plan').eq('id', userId).single()
    const isPro = profile?.plan === 'pro'
    const limit = isPro ? -1 : FREE_LIMIT
    const { data: allowed } = await admin.rpc('increment_ai_uses', { p_user_id: userId, p_limit: limit })
    if (!allowed) {
      return res.status(429).json({ error: \`Daily limit of \${FREE_LIMIT} AI generations reached. Upgrade to Pro for unlimited access.\` })
    }
  }

  const RETRY_DELAYS = [6000, 12000]
  let lastError = 'Generation failed.'

  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt - 1]))

    const { status, data } = await callGemini(prompt)
    const d = data as Record<string, unknown>

    if (status === 429) { lastError = 'Rate limit hit — retrying...'; continue }
    if (status !== 200) return res.status(status).json({ error: (d?.error as string) ?? 'Gemini error.' })

    try {
      const candidates = (d?.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }>) ?? []
      let text = candidates[0]?.content?.parts?.[0]?.text ?? ''
      // Strip markdown code fences if present
      text = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
      const recipe = JSON.parse(text)
      if (!recipe.title || !Array.isArray(recipe.ingredients) || !Array.isArray(recipe.steps)) {
        throw new Error('Invalid recipe structure')
      }
      return res.status(200).json({ recipe })
    } catch {
      lastError = 'Failed to parse recipe from AI response.'
    }
  }

  return res.status(500).json({ error: lastError })
}
