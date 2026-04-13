import { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Zap, Shield, Layers } from 'lucide-react'

const FEATURES = [
  { icon: Zap,    title: 'FLUX + GEMINI', desc: 'Generate with Flux Pro via fal.ai for stunning quality, or Gemini for multimodal image transforms.' },
  { icon: Layers, title: '9 STYLES',      desc: 'Worn, Steel, Classic, Mirror, Ornate, Electric, Retro, Urban, Clean.' },
  { icon: Shield, title: 'FREE TO USE',   desc: 'Create a free account and start generating stickers immediately. No credit card required.' },
]

export function LandingPage() {
  const h1Ref = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const glitch = () => {
      const el = h1Ref.current
      if (!el) return
      el.classList.add('glitching')
      setTimeout(() => el.classList.remove('glitching'), 380)
      setTimeout(glitch, 3500 + Math.random() * 5000)
    }
    const t = setTimeout(glitch, 2000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="grid-bg scanlines corner-glow min-h-screen">
      <div className="relative z-10 max-w-6xl mx-auto px-6">

        {/* Hero */}
        <section className="pt-24 pb-20 md:pt-36 md:pb-28">
          <motion.p
            className="font-mono text-xs tracking-widest mb-6"
            style={{ color: '#dc2626' }}
            initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            // AI-POWERED STICKER CREATION ENGINE
          </motion.p>

          <motion.h1
            ref={h1Ref}
            className="font-display leading-none mb-8 relative"
            style={{ fontSize: 'clamp(4rem, 14vw, 10rem)', letterSpacing: '0.04em' }}
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, type: 'spring', damping: 20 }}>
            STICKER<span style={{ color: '#dc2626' }}>.</span><br />
            <span style={{ color: '#dc2626' }}>GEN</span>
          </motion.h1>

          <motion.p
            className="font-mono text-sm leading-loose mb-10 max-w-lg"
            style={{ color: 'var(--color-muted2)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            {'// Type a concept. Pick a style.'}<br />
            {'// AI renders the sticker. Download it.'}<br />
            {'// No bullshit. Just output.'}
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Link
              to="/create"
              className="inline-flex items-center gap-3 px-8 py-4 font-display text-xl tracking-widest uppercase transition-all"
              style={{ background: '#dc2626', color: 'white' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#b91c1c')}
              onMouseLeave={e => (e.currentTarget.style.background = '#dc2626')}>
              START CREATING <ArrowRight size={18} />
            </Link>
            <Link
              to="/gallery"
              className="inline-flex items-center gap-3 px-8 py-4 font-display text-xl tracking-widest uppercase transition-all"
              style={{ border: '1px solid var(--color-border-strong)', color: 'var(--color-muted2)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.color = 'var(--color-ink)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-strong)'; e.currentTarget.style.color = 'var(--color-muted2)' }}>
              VIEW GALLERY
            </Link>
          </motion.div>
        </section>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-16 pt-px" style={{ borderTop: '1px solid var(--color-border)' }}>
          <div className="w-8 h-0.5 mt-0" style={{ background: '#dc2626' }} />
          <span className="font-mono text-xs tracking-widest" style={{ color: 'var(--color-muted)' }}>FEATURES</span>
        </div>

        {/* Feature grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-24">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className="p-6"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderLeft: '3px solid #dc2626', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}>
              <f.icon size={20} style={{ color: '#dc2626' }} className="mb-4" />
              <h3 className="font-display text-2xl tracking-widest mb-2">{f.title}</h3>
              <p className="font-mono text-xs leading-loose" style={{ color: 'var(--color-muted)' }}>{f.desc}</p>
            </motion.div>
          ))}
        </section>

        {/* CTA */}
        <section className="text-center pb-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            <p className="font-mono text-xs tracking-widest mb-4" style={{ color: '#dc2626' }}>// READY TO START?</p>
            <h2 className="font-display text-6xl tracking-widest mb-8">
              FREE<span style={{ color: '#dc2626' }}>.</span> FAST<span style={{ color: '#dc2626' }}>.</span> YOURS<span style={{ color: '#dc2626' }}>.</span>
            </h2>
            <Link
              to="/create"
              className="inline-flex items-center gap-3 px-10 py-5 font-display text-2xl tracking-widest uppercase transition-all"
              style={{ background: '#dc2626', color: 'white' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#b91c1c')}
              onMouseLeave={e => (e.currentTarget.style.background = '#dc2626')}>
              CREATE NOW <ArrowRight size={20} />
            </Link>
          </motion.div>
        </section>
      </div>
    </div>
  )
}
