import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Zap, Shield, Layers, Terminal } from 'lucide-react'

const FEATURES = [
  {
    icon: Zap,
    tag: 'SYS.AI',
    title: 'FLUX + GEMINI',
    desc: 'Flux Pro via fal.ai for high-fidelity output. Gemini multimodal for image-to-sticker transforms.',
  },
  {
    icon: Layers,
    tag: 'SYS.STYLE',
    title: '9 STYLES',
    desc: 'Worn, Steel, Classic, Mirror, Ornate, Electric, Retro, Urban, Clean — each with its own model config.',
  },
  {
    icon: Shield,
    tag: 'SYS.ACCESS',
    title: 'FREE TO USE',
    desc: 'Create an account and start generating immediately. No credit card. No limits.',
  },
]

const BOOT_LINES = [
  'GAVDADDY SYSTEMS v2.4.1',
  'Loading AI modules........OK',
  'Flux engine................OK',
  'Gemini multimodal..........OK',
  'Ready.',
]

export function LandingPage() {
  const h1Ref = useRef<HTMLHeadingElement>(null)
  const [bootLine, setBootLine] = useState(0)
  const [bootDone, setBootDone] = useState(false)

  // Glitch loop
  useEffect(() => {
    const glitch = () => {
      const el = h1Ref.current
      if (!el) return
      el.classList.add('glitching')
      setTimeout(() => el.classList.remove('glitching'), 380)
      setTimeout(glitch, 4000 + Math.random() * 5000)
    }
    const t = setTimeout(glitch, 2200)
    return () => clearTimeout(t)
  }, [])

  // Boot sequence
  useEffect(() => {
    if (bootLine >= BOOT_LINES.length) {
      setTimeout(() => setBootDone(true), 400)
      return
    }
    const t = setTimeout(() => setBootLine(l => l + 1), bootLine === 0 ? 300 : 380)
    return () => clearTimeout(t)
  }, [bootLine])

  return (
    <div className="grid-bg scanlines corner-glow min-h-screen">
      <div className="relative z-10 max-w-6xl mx-auto px-6">

        {/* Hero */}
        <section className="pt-20 pb-16 md:pt-32 md:pb-24">

          {/* Boot terminal */}
          <motion.div
            className="mb-8 inline-block"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border-strong)',
                borderLeft: '3px solid #dc2626',
                padding: '10px 14px',
                minWidth: '280px',
              }}
            >
              <div className="flex items-center gap-2 mb-2" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                <Terminal size={11} style={{ color: '#dc2626' }} />
                <span className="font-mono" style={{ fontSize: '0.6rem', color: 'var(--color-muted)', letterSpacing: '0.1em' }}>
                  TERMINAL v2.4.1
                </span>
              </div>
              {BOOT_LINES.slice(0, bootLine).map((line, i) => (
                <div
                  key={i}
                  className="font-mono"
                  style={{
                    fontSize: '0.62rem',
                    lineHeight: '1.7',
                    color: i === BOOT_LINES.length - 1 ? '#dc2626' : 'var(--color-muted2)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {line}
                </div>
              ))}
              {!bootDone && (
                <span
                  className="font-mono"
                  style={{ fontSize: '0.62rem', color: '#dc2626', animation: 'blink 0.9s step-end infinite' }}
                >
                  _
                </span>
              )}
            </div>
          </motion.div>

          {/* Main headline */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', damping: 18 }}
          >
            <h1
              ref={h1Ref}
              className="font-display leading-none relative"
              style={{ fontSize: 'clamp(4.5rem, 16vw, 11rem)', letterSpacing: '0.04em', marginBottom: '0.1em' }}
            >
              GAV<span style={{ color: '#dc2626' }}>DADDY</span>
            </h1>
            <div className="flex items-center gap-4">
              <h2
                className="font-display leading-none"
                style={{ fontSize: 'clamp(1.6rem, 5vw, 3.8rem)', letterSpacing: '0.18em', color: 'var(--color-muted2)' }}
              >
                STICKERS
              </h2>
              <div style={{ flex: 1, height: '2px', background: 'linear-gradient(90deg, #dc2626, transparent)', maxWidth: '160px' }} />
            </div>
          </motion.div>

          <motion.p
            className="font-mono mt-6 mb-10 max-w-md"
            style={{ fontSize: '0.75rem', lineHeight: '1.8', color: 'var(--color-muted2)', letterSpacing: '0.04em' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.38 }}
          >
            {'// Describe an idea. Choose a style.'}<br />
            {'// AI renders your sticker. Download it.'}
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48 }}
          >
            <Link
              to="/create"
              className="btn-retro btn-retro-primary inline-flex items-center gap-3 px-8 py-4 font-display text-xl tracking-widest"
            >
              START CREATING <ArrowRight size={17} />
            </Link>
            <Link
              to="/gallery"
              className="btn-retro btn-retro-ghost inline-flex items-center gap-3 px-8 py-4 font-display text-xl tracking-widest"
            >
              VIEW GALLERY
            </Link>
          </motion.div>
        </section>

        {/* Section divider */}
        <div
          className="flex items-center gap-4 mb-14"
          style={{ borderTop: '1px solid var(--color-border-strong)', paddingTop: '1px' }}
        >
          <div style={{ width: '32px', height: '2px', background: '#dc2626', flexShrink: 0 }} />
          <span className="font-mono" style={{ fontSize: '0.6rem', letterSpacing: '0.16em', color: 'var(--color-muted)' }}>
            SYS.MODULES
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
        </div>

        {/* Feature cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-24">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className="retro-card p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + i * 0.1 }}
            >
              <div className="flex items-center justify-between mb-4">
                <f.icon size={18} style={{ color: '#dc2626' }} />
                <span
                  className="font-mono"
                  style={{ fontSize: '0.55rem', letterSpacing: '0.12em', color: 'var(--color-muted)', background: 'var(--color-surface2)', padding: '2px 6px' }}
                >
                  {f.tag}
                </span>
              </div>
              <h3
                className="font-display mb-2"
                style={{ fontSize: '1.6rem', letterSpacing: '0.12em', lineHeight: 1.1 }}
              >
                {f.title}
              </h3>
              <p
                className="font-mono"
                style={{ fontSize: '0.65rem', lineHeight: '1.8', color: 'var(--color-muted)', letterSpacing: '0.02em' }}
              >
                {f.desc}
              </p>
            </motion.div>
          ))}
        </section>

        {/* Bottom CTA */}
        <section className="pb-24">
          <motion.div
            className="retro-card p-10 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85 }}
          >
            <p
              className="font-mono mb-2"
              style={{ fontSize: '0.6rem', letterSpacing: '0.16em', color: '#dc2626' }}
            >
              {'> READY TO BUILD_'}
            </p>
            <h3
              className="font-display mb-6"
              style={{ fontSize: 'clamp(2rem, 6vw, 4rem)', letterSpacing: '0.1em' }}
            >
              MAKE SOMETHING REAL
            </h3>
            <Link
              to="/create"
              className="btn-retro btn-retro-primary inline-flex items-center gap-3 px-10 py-4 font-display text-2xl tracking-widest"
            >
              CREATE NOW <ArrowRight size={20} />
            </Link>
          </motion.div>
        </section>

      </div>
    </div>
  )
}
