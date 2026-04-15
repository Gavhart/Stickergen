import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'

const stripeKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeKey ? new Stripe(stripeKey) : null

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })
  if (!stripe) return res.status(500).json({ error: 'Stripe is not configured (missing STRIPE_SECRET_KEY).' })

  const { userId, email } = req.body as { userId?: string; email?: string }
  if (!userId) return res.status(400).json({ error: 'Missing userId.' })

  try {
    const origin =
      (req.headers.origin as string | undefined) ||
      process.env.APP_URL ||
      'http://localhost:5173'

    const priceId = process.env.STRIPE_PRICE_ID
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = priceId
      ? [{ price: priceId, quantity: 1 }]
      : [{
          price_data: {
            currency: 'usd',
            product_data: { name: 'GavDaddy Recipes Pro' },
            recurring: { interval: 'month' },
            unit_amount: 499,
          },
          quantity: 1,
        }]

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email ?? undefined,
      line_items: lineItems,
      success_url: `${origin}/my-recipes?upgraded=1`,
      cancel_url: `${origin}/pricing`,
      client_reference_id: userId,
      metadata: { userId, plan: 'pro' },
    })

    return res.status(200).json({ url: session.url })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Stripe checkout failed.'
    return res.status(500).json({ error: msg })
  }
}
