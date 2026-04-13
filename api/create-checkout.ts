import Stripe from 'stripe'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { priceId, userId, userEmail } = req.body as {
    priceId: string
    userId: string
    userEmail: string
  }

  if (!priceId || !userId || !userEmail) {
    return res.status(400).json({ error: 'Missing required fields.' })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: userEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId },
      success_url: `${process.env.APP_URL}/create?upgraded=true`,
      cancel_url: `${process.env.APP_URL}/pricing`,
      allow_promotion_codes: true,
    })

    return res.status(200).json({ url: session.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Checkout failed.'
    return res.status(500).json({ error: msg })
  }
}
