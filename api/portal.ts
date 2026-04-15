import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'

const stripeKey = process.env.STRIPE_SECRET_KEY ?? ''
const stripe = stripeKey ? new Stripe(stripeKey) : null

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured.' })

  const { customerId } = req.body as { customerId?: string }
  if (!customerId) return res.status(400).json({ error: 'Missing customerId.' })

  try {
    const origin = (req.headers.origin as string | undefined) || process.env.APP_URL || 'http://localhost:5173'
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: \`\${origin}/profile\`,
    })
    return res.status(200).json({ url: session.url })
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message })
  }
}
