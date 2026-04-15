import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Zap } from 'lucide-react'
import { PLAN_FEATURES } from '../lib/types'
import { useAuth } from '../context/AuthContext'

export function PricingPage() {
  const { user, profile } = useAuth()

  const handleUpgrade = async () => {
    if (!user) return
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, email: user.email }),
    })
    const { url } = await res.json() as { url?: string }
    if (url) window.location.href = url
  }

  const handlePortal = async () => {
    if (!profile?.stripe_customer_id) return
    const res = await fetch('/api/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: profile.stripe_customer_id }),
    })
    const { url } = await res.json() as { url?: string }
    if (url) window.location.href = url
  }

  return (
    <div className="grid-bg scanlines corner-glow min-h-screen">
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">

        <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="font-mono text-xs tracking-widest mb-3" style={{ color: '#dc2626' }}>// SUBSCRIPTION PLANS</p>
          <h1 className="font-display leading-none mb-4" style={{ fontSize: 'clamp(3rem, 10vw, 6rem)', letterSpacing: '0.06em' }}>
            PLANS<span style={{ color: '#dc2626' }}>.</span>
          </h1>
          <p className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--color-muted2)', letterSpacing: '0.04em', lineHeight: 1.8 }}>
            Free to start. Upgrade when you need more AI power.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(['free', 'pro'] as const).map((plan, i) => {
            const f = PLAN_FEATURES[plan]
            const isPro = plan === 'pro'
            const isCurrent = profile?.plan === plan
            return (
              <motion.div key={plan} className="retro-card p-8 flex flex-col"
                style={{ background: isPro ? 'var(--color-surface)' : 'var(--color-surface)', borderColor: isPro ? '#dc2626' : undefined }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.12 }}>

                {isPro && (
                  <div className="flex items-center gap-2 mb-4">
                    <Zap size={13} style={{ color: '#dc2626' }} />
                    <span className="font-mono" style={{ fontSize: '0.6rem', letterSpacing: '0.14em', color: '#dc2626' }}>RECOMMENDED</span>
                  </div>
                )}

                <div className="mb-6">
                  <span className="font-mono" style={{ fontSize: '0.6rem', letterSpacing: '0.14em', color: 'var(--color-muted)' }}>{f.label.toUpperCase()}</span>
                  <div className="flex items-end gap-1 mt-1">
                    <span className="font-display" style={{ fontSize: '3.5rem', lineHeight: 1, letterSpacing: '0.04em' }}>{f.price}</span>
                    {isPro && <span className="font-mono text-xs mb-2" style={{ color: 'var(--color-muted)' }}>/month</span>}
                  </div>
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {f.features.map(feat => (
                    <li key={feat} className="flex items-start gap-3">
                      <Check size={14} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
                      <span className="font-mono" style={{ fontSize: '0.68rem', color: 'var(--color-muted2)', lineHeight: 1.6, letterSpacing: '0.02em' }}>{feat}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="py-3 text-center font-mono text-xs tracking-widest" style={{ border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}>
                    CURRENT PLAN
                  </div>
                ) : isPro ? (
                  user ? (
                    profile?.stripe_customer_id ? (
                      <button onClick={handlePortal} className="btn-retro btn-retro-primary py-3 font-display text-lg tracking-widest w-full">
                        MANAGE SUBSCRIPTION
                      </button>
                    ) : (
                      <button onClick={handleUpgrade} className="btn-retro btn-retro-primary py-3 font-display text-lg tracking-widest w-full">
                        UPGRADE TO PRO
                      </button>
                    )
                  ) : (
                    <Link to="/" className="btn-retro btn-retro-primary py-3 font-display text-lg tracking-widest w-full text-center block">
                      SIGN UP FREE
                    </Link>
                  )
                ) : (
                  <Link to="/feed" className="btn-retro btn-retro-ghost py-3 font-display text-lg tracking-widest w-full text-center block">
                    GET STARTED FREE
                  </Link>
                )}
              </motion.div>
            )
          })}
        </div>

        <motion.p className="text-center mt-10 font-mono" style={{ fontSize: '0.62rem', color: 'var(--color-muted)', letterSpacing: '0.06em' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          Cancel anytime. Billed monthly via Stripe. Secure checkout.
        </motion.p>
      </div>
    </div>
  )
}
