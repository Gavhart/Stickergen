import Stripe from 'stripe'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { customerId } = req.body as { customerId: string }
  if (!customerId) return res.status(400).json({ error: 'Missing customerId.' })

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.APP_URL}/profile`,
    })
    return res.status(200).json({ url: session.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Portal session failed.'
    return res.status(500).json({ error: msg })
  }
}
