import { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Users, BookOpen, ChefHat } from 'lucide-react'

const FEATURES = [
  { icon: Sparkles, tag: 'AI.GEN', title: 'AI RECIPE CREATOR', desc: 'Describe any dish or ingredients. Gemini writes a complete recipe — title, ingredients, step-by-step instructions, all ready to save.' },
  { icon: Users,    tag: 'COMMUNITY', title: 'COMMUNITY FEED',  desc: 'Browse recipes shared by other home cooks. Save the ones you love to your personal recipe box.' },
  { icon: BookOpen, tag: 'YOUR BOX',  title: 'RECIPE VAULT',    desc: 'Build your collection. Scale any recipe up or down by servings. Pro users get AI nutrition analysis on every dish.' },
]

export function LandingPage() {
  const h1Ref = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const glitch = () => {
      const el = h1Ref.current
      if (!el) return
      el.classList.add('glitching')
      setTimeout(() => el.classList.remove('glitching'), 380)
      setTimeout(glitch, 5000 + Math.random() * 5000)
    }
    const t = setTimeout(glitch, 2500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="grid-bg scanlines corner-glow min-h-screen">
      <div className="relative z-10 max-w-6xl mx-auto px-6">

        {/* Hero */}
        <section className="pt-20 pb-16 md:pt-32 md:pb-24">
          <motion.div className="flex items-center gap-3 mb-6" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <ChefHat size={16} style={{ color: '#dc2626' }} />
            <span className="font-mono" style={{ fontSize: '0.62rem', letterSpacing: '0.16em', color: '#dc2626' }}>GAVDADDY RECIPES SYSTEM v1.0</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, type: 'spring', damping: 18 }}>
            <h1 ref={h1Ref} className="font-display leading-none relative" style={{ fontSize: 'clamp(4rem, 14vw, 10rem)', letterSpacing: '0.04em', marginBottom: '0.1em' }}>
              GAV<span style={{ color: '#dc2626' }}>DADDY</span>
            </h1>
            <div className="flex items-center gap-4 mb-6">
              <h2 className="font-display leading-none" style={{ fontSize: 'clamp(1.4rem, 4vw, 3.2rem)', letterSpacing: '0.18em', color: 'var(--color-muted2)' }}>RECIPES</h2>
              <div style={{ flex: 1, height: '2px', background: 'linear-gradient(90deg, #dc2626, transparent)', maxWidth: '140px' }} />
            </div>
          </motion.div>

          <motion.p className="font-mono mb-10 max-w-lg" style={{ fontSize: '0.78rem', lineHeight: '1.85', color: 'var(--color-muted2)', letterSpacing: '0.03em' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
            {"// Build your recipe collection with AI."}<br />
            {"// Share with the community. Scale any dish."}
          </motion.p>

          <motion.div className="flex flex-wrap gap-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <Link to="/create" className="btn-retro btn-retro-primary inline-flex items-center gap-3 px-8 py-4 font-display text-xl tracking-widest">
              CREATE A RECIPE <ArrowRight size={17} />
            </Link>
            <Link to="/feed" className="btn-retro btn-retro-ghost inline-flex items-center gap-3 px-8 py-4 font-display text-xl tracking-widest">
              BROWSE FEED
            </Link>
          </motion.div>
        </section>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-14" style={{ borderTop: '1px solid var(--color-border-strong)', paddingTop: '1px' }}>
          <div style={{ width: '32px', height: '2px', background: '#dc2626', flexShrink: 0 }} />
          <span className="font-mono" style={{ fontSize: '0.6rem', letterSpacing: '0.16em', color: 'var(--color-muted)' }}>SYS.FEATURES</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
        </div>

        {/* Feature cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-24">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} className="retro-card p-6"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 + i * 0.1 }}>
              <div className="flex items-center justify-between mb-4">
                <f.icon size={18} style={{ color: '#dc2626' }} />
                <span className="font-mono" style={{ fontSize: '0.55rem', letterSpacing: '0.12em', color: 'var(--color-muted)', background: 'var(--color-surface2)', padding: '2px 6px' }}>{f.tag}</span>
              </div>
              <h3 className="font-display mb-2" style={{ fontSize: '1.5rem', letterSpacing: '0.1em', lineHeight: 1.1 }}>{f.title}</h3>
              <p className="font-mono" style={{ fontSize: '0.65rem', lineHeight: '1.8', color: 'var(--color-muted)', letterSpacing: '0.02em' }}>{f.desc}</p>
            </motion.div>
          ))}
        </section>

        {/* CTA */}
        <section className="pb-24">
          <motion.div className="retro-card p-10 text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }}>
            <p className="font-mono mb-2" style={{ fontSize: '0.6rem', letterSpacing: '0.16em', color: '#dc2626' }}>{"> READY TO COOK_"}</p>
            <h3 className="font-display mb-6" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '0.1em' }}>START YOUR COLLECTION</h3>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/create" className="btn-retro btn-retro-primary inline-flex items-center gap-3 px-10 py-4 font-display text-xl tracking-widest">
                CREATE NOW <ArrowRight size={18} />
              </Link>
              <Link to="/pricing" className="btn-retro btn-retro-ghost inline-flex items-center gap-3 px-8 py-4 font-display text-xl tracking-widest">
                VIEW PLANS
              </Link>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  )
}
