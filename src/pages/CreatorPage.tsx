import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Download, Archive, RotateCcw, PenLine, Sparkles } from 'lucide-react'
import { StyleSelector } from '../components/creator/StyleSelector'
import { ColorSelector } from '../components/creator/ColorSelector'
import { StickerDisplay } from '../components/creator/StickerDisplay'
import { generateWithPollinations } from '../lib/api/pollinations'
import { generateWithGemini, buildPrompt } from '../lib/api/gemini'
import { saveSticker } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { STYLE_OPTIONS, COLOR_OPTIONS, QUICK_TAGS, type StickerStyle, type ColorMood, type Provider } from '../lib/types'
import { AuthModal } from '../components/auth/AuthModal'

const LOADING_MSGS = ['Rendering...', 'Processing...', 'Compiling...', 'Executing...', 'Synthesizing...']

export function CreatorPage() {
  const { user } = useAuth()
  const { showToast } = useToast()

  const [provider, setProvider] = useState<Provider>('pollinations')
  const [apiKey, setApiKey] = useState('')
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState<StickerStyle>('grunge')
  const [color, setColor] = useState<ColorMood>('dark')
  const [imageData, setImageData] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('Rendering...')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const msgRef = useRef(0)

  useEffect(() => {
    if (!loading) return
    msgRef.current = 0
    const iv = setInterval(() => {
      msgRef.current = (msgRef.current + 1) % LOADING_MSGS.length
      setLoadingText(LOADING_MSGS[msgRef.current])
    }, 1400)
    return () => clearInterval(iv)
  }, [loading])

  const generate = async () => {
    if (!prompt.trim()) { setError('ERR: Input prompt required.'); return }
    if (provider === 'gemini' && !apiKey) { setError('ERR: API key required for Gemini.'); return }

    setError(''); setLoading(true); setImageData(null)
    const stylePrompt = STYLE_OPTIONS.find(s => s.id === style)?.prompt ?? ''
    const colorPrompt = COLOR_OPTIONS.find(c => c.id === color)?.prompt ?? ''
    const full = buildPrompt(prompt, stylePrompt, colorPrompt)

    try {
      const data = provider === 'pollinations'
        ? await generateWithPollinations(full, style)
        : await generateWithGemini(apiKey, full)
      setImageData(data)
      showToast('OUTPUT READY')
    } catch (e) {
      setError('ERR: ' + (e instanceof Error ? e.message : 'Generation failed.'))
    } finally {
      setLoading(false)
    }
  }

  const download = () => {
    if (!imageData) return
    const a = document.createElement('a')
    a.href = `data:image/png;base64,${imageData}`
    a.download = `sticker_${prompt.replace(/[^a-z0-9]/gi, '_').slice(0, 30)}.png`
    a.click()
    showToast('FILE SAVED')
  }

  const archive = async () => {
    if (!imageData) return
    if (!user) { setShowAuth(true); return }
    setSaving(true)
    const { error } = await saveSticker(user.id, imageData, { prompt, style, color, provider })
    setSaving(false)
    if (error) { showToast('ERR: SAVE FAILED'); return }
    showToast('ARCHIVED TO GALLERY')
  }

  return (
    <div className="grid-bg scanlines corner-glow min-h-screen">
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.div className="mb-10" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="font-mono text-xs tracking-widest mb-2" style={{ color: '#dc2626' }}>
            // STICKER CREATION SYSTEM
          </p>
          <h1 className="font-display text-7xl tracking-widest leading-none">
            CREATE<span style={{ color: '#dc2626' }}>.</span>
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: Controls */}
          <motion.div className="space-y-6" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>

            {/* Engine toggle */}
            <div>
              <p className="font-mono text-xs tracking-widest mb-2" style={{ color: 'var(--color-muted)' }}>// ENGINE</p>
              <div className="flex gap-2">
                {(['pollinations', 'gemini'] as Provider[]).map(p => (
                  <button key={p} onClick={() => setProvider(p)}
                    className="px-4 py-2 font-mono text-xs tracking-widest uppercase transition-all"
                    style={{
                      border: provider === p ? '1px solid #dc2626' : '1px solid var(--color-border)',
                      color: provider === p ? '#dc2626' : 'var(--color-muted)',
                      background: provider === p ? 'var(--color-red-dim)' : 'transparent',
                    }}>
                    {p === 'pollinations' ? 'POLLINATIONS' : 'GEMINI'}
                  </button>
                ))}
                <span className="ml-auto font-mono text-xs self-center" style={{ color: provider === 'pollinations' ? 'var(--color-green-bright)' : 'var(--color-muted)' }}>
                  {provider === 'pollinations' ? '* FREE' : 'API KEY REQ'}
                </span>
              </div>
            </div>

            {/* API key (Gemini only) */}
            {provider === 'gemini' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <p className="font-mono text-xs tracking-widest mb-2" style={{ color: 'var(--color-muted)' }}>// API_KEY</p>
                <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
                  placeholder="Paste Gemini API key..."
                  className="w-full px-4 py-3 font-mono text-sm outline-none transition-all"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-ink)' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#dc2626'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                />
              </motion.div>
            )}

            {/* Prompt */}
            <div
              className="rounded-2xl p-px shadow-sm"
              style={{
                background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.35) 0%, rgba(255, 255, 255, 0.9) 42%, rgba(125, 211, 252, 0.4) 100%)',
              }}
            >
              <div
                className="rounded-2xl px-4 pt-4 pb-3"
                style={{ background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(240, 253, 250, 0.5) 100%)' }}
              >
                <div className="flex gap-3 mb-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md"
                    style={{ background: 'linear-gradient(145deg, #34d399 0%, #38bdf8 100%)' }}
                  >
                    <PenLine className="text-white" size={20} strokeWidth={2.25} />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display text-2xl tracking-wide leading-none" style={{ color: 'var(--color-ink)' }}>
                        Your idea
                      </h3>
                      <Sparkles size={16} className="text-emerald-500 shrink-0" aria-hidden />
                    </div>
                    <p className="font-body text-sm mt-1.5 leading-snug" style={{ color: 'var(--color-muted2)' }}>
                      Describe a character, creature, or vibe — cute, loud, or totally odd. When you’re ready, use ⌘ or Ctrl + Enter to generate.
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    rows={4}
                    placeholder="Example: a grinning toaster with sunglasses, thick outlines, lots of personality…"
                    className="w-full px-4 pt-3.5 pb-12 font-body font-semibold text-base outline-none resize-y transition-all leading-relaxed rounded-xl border-2"
                    style={{
                      background: '#fff',
                      borderColor: 'rgba(167, 243, 208, 0.65)',
                      color: 'var(--color-ink)',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.65)'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(52, 211, 153, 0.15)'
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = 'rgba(167, 243, 208, 0.65)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) generate() }}
                  />
                  <div className="absolute bottom-3 left-3 flex gap-1.5 flex-wrap max-w-[calc(100%-1.5rem)]">
                    {QUICK_TAGS.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setPrompt(p => (p ? `${p}, ${tag}` : tag))}
                        className="font-mono text-[11px] px-2.5 py-1 rounded-full uppercase tracking-wide transition-all border shadow-sm"
                        style={{
                          background: 'linear-gradient(180deg, #fff, rgba(236, 253, 245, 0.9))',
                          borderColor: 'rgba(52, 211, 153, 0.25)',
                          color: 'var(--color-muted)',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.55)'
                          e.currentTarget.style.color = '#0d9488'
                          e.currentTarget.style.background = 'linear-gradient(180deg, #fff, rgba(224, 242, 254, 0.85))'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.25)'
                          e.currentTarget.style.color = 'var(--color-muted)'
                          e.currentTarget.style.background = 'linear-gradient(180deg, #fff, rgba(236, 253, 245, 0.9))'
                        }}
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Style */}
            <div>
              <div className="mb-2">
                <p className="font-display text-xl tracking-wide" style={{ color: 'var(--color-ink)' }}>
                  Look &amp; feel
                </p>
                <p className="font-body text-sm mt-0.5" style={{ color: 'var(--color-muted2)' }}>
                  Nine styles — pick the energy that fits your idea.
                </p>
              </div>
              <StyleSelector selected={style} onChange={setStyle} />
            </div>

            {/* Color */}
            <div>
              <div className="mb-2">
                <p className="font-display text-xl tracking-wide" style={{ color: 'var(--color-ink)' }}>
                  Color mood
                </p>
                <p className="font-body text-sm mt-0.5" style={{ color: 'var(--color-muted2)' }}>
                  Swatches hint at the palette; your prompt still leads the way.
                </p>
              </div>
              <ColorSelector selected={color} onChange={setColor} />
            </div>

            {/* Error */}
            {error && (
              <motion.div className="p-3 font-mono text-xs leading-relaxed"
                style={{ border: '1px solid var(--color-error-muted)', borderLeft: '3px solid #dc2626', color: 'var(--color-error-text)', background: 'var(--color-error-soft)' }}
                initial={{ x: -8 }} animate={{ x: 0 }}>
                {error}
              </motion.div>
            )}

            {/* Generate */}
            <motion.button onClick={generate} disabled={loading} whileTap={{ scale: 0.98 }}
              className="w-full py-5 font-display text-2xl tracking-widest uppercase transition-all relative overflow-hidden"
              style={{ background: loading ? 'var(--color-disabled)' : '#dc2626', color: loading ? 'var(--color-disabled-text)' : 'white', cursor: loading ? 'not-allowed' : 'pointer' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#b91c1c' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = loading ? 'var(--color-disabled)' : '#dc2626' }}>
              {loading ? 'PROCESSING...' : 'GENERATE STICKER'}
            </motion.button>
          </motion.div>

          {/* RIGHT: Output */}
          <motion.div className="flex flex-col items-center gap-4" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
            <StickerDisplay imageData={imageData} loading={loading} loadingText={loadingText} />

            <div className="flex gap-2 w-full max-w-sm">
              <button onClick={download} disabled={!imageData}
                className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-xs tracking-widest uppercase transition-all"
                style={{ border: !imageData ? '1px solid var(--color-border)' : '1px solid rgba(220,38,38,0.4)', color: !imageData ? 'var(--color-muted)' : '#dc2626', background: !imageData ? 'transparent' : 'var(--color-red-dim)', cursor: !imageData ? 'not-allowed' : 'pointer' }}
                onMouseEnter={e => { if (imageData) e.currentTarget.style.borderColor = '#dc2626' }}
                onMouseLeave={e => { if (imageData) e.currentTarget.style.borderColor = 'rgba(220,38,38,0.4)' }}>
                <Download size={13} /> SAVE
              </button>
              <button onClick={archive} disabled={!imageData || saving}
                className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-xs tracking-widest uppercase transition-all"
                style={{ border: '1px solid var(--color-border)', color: !imageData ? 'var(--color-muted)' : 'var(--color-muted2)', cursor: !imageData ? 'not-allowed' : 'pointer' }}
                onMouseEnter={e => { if (imageData) { e.currentTarget.style.borderColor = 'var(--color-border-strong)'; e.currentTarget.style.color = 'var(--color-ink)' } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = !imageData ? 'var(--color-muted)' : 'var(--color-muted2)' }}>
                <Archive size={13} /> {saving ? 'SAVING...' : 'ARCHIVE'}
              </button>
              <button onClick={generate} disabled={!imageData || loading}
                className="flex items-center justify-center gap-2 px-4 py-3 font-mono text-xs tracking-widest uppercase transition-all"
                style={{ border: '1px solid var(--color-border)', color: !imageData ? 'var(--color-muted)' : 'var(--color-muted)', cursor: !imageData ? 'not-allowed' : 'pointer' }}
                onMouseEnter={e => { if (imageData) e.currentTarget.style.color = 'var(--color-ink)' }}
                onMouseLeave={e => { e.currentTarget.style.color = !imageData ? 'var(--color-muted)' : 'var(--color-muted)' }}>
                <RotateCcw size={13} />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}
