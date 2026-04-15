import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripeKey = process.env.STRIPE_SECRET_KEY ?? ''
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? ''
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

const stripe = stripeKey ? new Stripe(stripeKey) : null

export const config = { api: { bodyParser: false } }

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })
  if (!stripe || !webhookSecret) return res.status(500).json({ error: 'Stripe not configured.' })

  const sig = req.headers['stripe-signature'] as string
  const rawBody = await getRawBody(req)

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (e) {
    return res.status(400).json({ error: \`Webhook error: \${(e as Error).message}\` })
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return res.status(500).json({ error: 'Supabase not configured.' })
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const setPlan = async (customerId: string, plan: 'free' | 'pro', subscriptionId?: string) => {
    await admin
      .from('profiles')
      .update({ plan, stripe_subscription_id: subscriptionId ?? null })
      .eq('stripe_customer_id', customerId)
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      const customerId = session.customer as string
      const subscriptionId = session.subscription as string
      if (userId) {
        await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId)
      }
      await setPlan(customerId, 'pro', subscriptionId)
      break
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const active = sub.status === 'active' || sub.status === 'trialing'
      await setPlan(sub.customer as string, active ? 'pro' : 'free', sub.id)
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await setPlan(sub.customer as string, 'free')
      break
    }
  }

  return res.status(200).json({ received: true })
}
