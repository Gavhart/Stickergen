import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? ''
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

const NUTRITION_PROMPT = \`You are a registered dietitian.
Analyze the following recipe and return estimated nutritional info PER SERVING.
Return ONLY valid JSON — no markdown, no explanation.
Schema:
{
  "calories": 450,
  "protein": "28g",
  "carbs": "42g",
  "fat": "14g",
  "fiber": "6g",
  "sodium": "820mg"
}
All values should be realistic estimates. calories is a number, others are strings with units.\`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })

  const { recipe, userId } = req.body as { recipe?: unknown; userId?: string }
  if (!recipe) return res.status(400).json({ error: 'Recipe is required.' })
  if (!GEMINI_API_KEY) return res.status(500).json({ error: 'API key not configured.' })

  // Verify user is Pro
  if (userId && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const { data: profile } = await admin.from('profiles').select('plan').eq('id', userId).single()
    if (profile?.plan !== 'pro') {
      return res.status(403).json({ error: 'Nutrition analysis is a Pro feature. Upgrade to access it.' })
    }
  }

  const recipeText = JSON.stringify(recipe, null, 2)
  const prompt = \`\${NUTRITION_PROMPT}\n\nRecipe:\n\${recipeText}\`

  const models = ['gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-1.5-pro']
  for (const model of models) {
    const url = \`https://generativelanguage.googleapis.com/v1beta/models/\${model}:generateContent?key=\${GEMINI_API_KEY}\`
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
        }),
      })
      if (r.status === 404) continue
      const data = await r.json() as Record<string, unknown>
      if (r.status !== 200) return res.status(r.status).json({ error: 'Gemini error.' })

      const candidates = (data?.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }>) ?? []
      let text = candidates[0]?.content?.parts?.[0]?.text ?? ''
      text = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
      const nutrition = JSON.parse(text)
      return res.status(200).json({ nutrition })
    } catch { continue }
  }

  return res.status(500).json({ error: 'Failed to analyze nutrition.' })
}
