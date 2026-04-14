import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Download, Archive, RotateCcw, PenLine, Sparkles, ImagePlus, X, ArrowRight, Dice5 } from 'lucide-react'
import { StyleSelector } from '../components/creator/StyleSelector'
import { ColorSelector } from '../components/creator/ColorSelector'
import { StickerDisplay } from '../components/creator/StickerDisplay'
import { generateWithFal } from '../lib/api/fal'
import { buildPrompt } from '../lib/api/gemini'
import { saveSticker } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { STYLE_OPTIONS, COLOR_OPTIONS, QUICK_TAGS, INSPIRE_PROMPTS, type StickerStyle, type ColorMood, type Provider } from '../lib/types'
import { removeWhiteBackground } from '../lib/imageUtils'
import { AuthModal } from '../components/auth/AuthModal'

const LOADING_MSGS = ['Rendering...', 'Processing...', 'Compiling...', 'Executing...', 'Synthesizing...']

interface UploadedImage {
  base64: string
  mimeType: string
  previewUrl: string
  fileName: string
}

async function generateWithSiteGemini(
  prompt: string,
  imageBase64?: string,
  imageMimeType?: string
): Promise<string> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, imageBase64, imageMimeType }),
  })
  const data = await res.json() as { imageBase64?: string; error?: string }
  if (!res.ok || !data.imageBase64) throw new Error(data.error ?? 'Generation failed.')
  return data.imageBase64
}

export function CreatorPage() {
  const { user, loading: authLoading } = useAuth()
  const { showToast } = useToast()

  const [provider, setProvider] = useState<Provider>('gemini')
  const [falKey, setFalKey] = useState('')
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState<StickerStyle>('grunge')
  const [color, setColor] = useState<ColorMood>('chrome')
  const [imageData, setImageData] = useState<string | null>(null)
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('Rendering...')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [removingBg, setRemovingBg] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const msgRef = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!loading) return
    msgRef.current = 0
    const iv = setInterval(() => {
      msgRef.current = (msgRef.current + 1) % LOADING_MSGS.length
      setLoadingText(LOADING_MSGS[msgRef.current])
    }, 1400)
    return () => clearInterval(iv)
  }, [loading])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('ERR: Only image files are supported.'); return }
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setUploadedImage({ base64: result.split(',')[1], mimeType: file.type, previewUrl: result, fileName: file.name })
      setError('')
      if (provider !== 'gemini') { setProvider('gemini'); showToast('IMAGE MODE: SWITCHED TO GEMINI') }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const clearImage = () => {
    setUploadedImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const generate = async () => {
    if (!user) { setShowAuth(true); return }
    if (!prompt.trim()) { setError('ERR: Input prompt required.'); return }
    if (provider === 'fal' && !falKey) { setError('ERR: fal.ai API key required. Get one free at fal.ai.'); return }
    if (uploadedImage && provider === 'fal') { setError('ERR: Image input requires Gemini engine.'); return }

    setError(''); setLoading(true); setImageData(null)
    const stylePrompt = STYLE_OPTIONS.find(s => s.id === style)?.prompt ?? ''
    const colorPrompt = COLOR_OPTIONS.find(c => c.id === color)?.prompt ?? ''
    const full = buildPrompt(prompt, stylePrompt, colorPrompt)

    try {
      const data = provider === 'fal'
        ? await generateWithFal(falKey, full, style)
        : await generateWithSiteGemini(full, uploadedImage?.base64, uploadedImage?.mimeType)
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

  const downloadTransparent = async () => {
    if (!imageData || removingBg) return
    setRemovingBg(true)
    try {
      const transparentB64 = await removeWhiteBackground(imageData)
      const a = document.createElement('a')
      a.href = `data:image/png;base64,${transparentB64}`
      a.download = `sticker_${prompt.replace(/[^a-z0-9]/gi, '_').slice(0, 30)}_transparent.png`
      a.click()
      showToast('TRANSPARENT PNG SAVED')
    } catch {
      showToast('ERR: BG REMOVAL FAILED')
    } finally {
      setRemovingBg(false)
    }
  }

  const inspire = () => {
    const pick = INSPIRE_PROMPTS[Math.floor(Math.random() * INSPIRE_PROMPTS.length)]
    setPrompt(pick)
    showToast('PROMPT LOADED')
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

  if (authLoading) {
    return (
      <div className="grid-bg scanlines min-h-screen flex items-center justify-center">
        <p className="font-mono text-xs tracking-widest animate-pulse" style={{ color: 'var(--color-muted)' }}>LOADING...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="grid-bg scanlines corner-glow min-h-screen flex items-center justify-center px-6">
        <motion.div
          className="retro-card max-w-md w-full text-center p-10"
          style={{ background: 'var(--color-surface)' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="font-mono text-xs tracking-widest mb-3" style={{ color: '#dc2626' }}>// ACCESS RESTRICTED</p>
          <h2 className="font-display text-5xl tracking-widest mb-4">SIGN IN<span style={{ color: '#dc2626' }}>.</span></h2>
          <p className="font-mono text-xs leading-loose mb-8" style={{ color: 'var(--color-muted)' }}>
            Create a free account to start generating stickers.<br />
            No credit card required.
          </p>
          <button
            onClick={() => setShowAuth(true)}
            className="btn-retro btn-retro-primary w-full py-4 font-display text-xl tracking-widest mb-4">
            CREATE ACCOUNT / SIGN IN
          </button>
          <Link to="/"
            className="font-mono text-xs tracking-widest transition-all flex items-center justify-center gap-2"
            style={{ color: 'var(--color-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-ink)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}>
            LEARN MORE <ArrowRight size={12} />
          </Link>
        </motion.div>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </div>
    )
  }

  return (
    <div className="grid-bg scanlines corner-glow min-h-screen">
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10">

        <motion.div className="mb-10" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="font-mono text-xs tracking-widest mb-2" style={{ color: '#dc2626' }}>// STICKER CREATION SYSTEM</p>
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
              <div className="flex gap-2 flex-wrap items-center">
                {(['gemini', 'fal'] as Provider[]).map(p => (
                  <button key={p} onClick={() => setProvider(p)}
                    className="px-4 py-2 font-mono text-xs tracking-widest uppercase transition-all"
                    style={{
                      border: provider === p ? '1px solid #dc2626' : '1px solid var(--color-border)',
                      color: provider === p ? '#dc2626' : 'var(--color-muted)',
                      background: provider === p ? 'var(--color-red-dim)' : 'transparent',
                    }}>
                    {p === 'gemini' ? 'GEMINI' : 'FLUX / FAL.AI'}
                  </button>
                ))}
                <span className="font-mono text-xs" style={{ color: 'var(--color-muted)' }}>
                  {provider === 'gemini' ? '// no key needed' : '// bring your own key'}
                </span>
              </div>
            </div>

            {/* fal.ai key input */}
            <AnimatePresence>
              {provider === 'fal' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <p className="font-mono text-xs tracking-widest mb-2" style={{ color: 'var(--color-muted)' }}>
                    // FAL_API_KEY — fal.ai → account → API Keys
                  </p>
                  <input type="password" value={falKey} onChange={e => setFalKey(e.target.value)}
                    placeholder="Paste fal.ai API key..."
                    className="w-full px-4 py-3 font-mono text-sm outline-none transition-all"
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-ink)' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#dc2626'}
                    onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Prompt box */}
            <div className="rounded-2xl p-px shadow-sm" style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.35) 0%, rgba(255,255,255,0.9) 42%, rgba(125,211,252,0.4) 100%)' }}>
              <div className="rounded-2xl px-4 pt-4 pb-3" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(240,253,250,0.5) 100%)' }}>
                <div className="flex gap-3 mb-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md" style={{ background: 'linear-gradient(145deg, #34d399 0%, #38bdf8 100%)' }}>
                    <PenLine className="text-white" size={20} strokeWidth={2.25} />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display text-2xl tracking-wide leading-none" style={{ color: 'var(--color-ink)' }}>Your idea</h3>
                      <Sparkles size={16} className="text-emerald-500 shrink-0" aria-hidden />
                    </div>
                    <p className="font-body text-sm mt-1.5 leading-snug" style={{ color: 'var(--color-muted2)' }}>
                      Describe a character, creature, or vibe — or upload an image to remix it.
                    </p>
                  </div>
                </div>

                <AnimatePresence>
                  {uploadedImage && (
                    <motion.div className="flex items-center gap-3 mb-3 px-3 py-2 rounded-xl"
                      style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)' }}
                      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                      <img src={uploadedImage.previewUrl} alt="Reference" className="w-12 h-12 rounded-lg object-cover shrink-0" style={{ border: '1px solid rgba(52,211,153,0.3)' }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs tracking-wide truncate" style={{ color: 'var(--color-ink)' }}>{uploadedImage.fileName}</p>
                        <p className="font-mono text-xs mt-0.5" style={{ color: '#10b981' }}>IMAGE REF LOADED — GEMINI WILL TRANSFORM THIS</p>
                      </div>
                      <button onClick={clearImage} className="shrink-0 p-1 rounded-full transition-colors" style={{ color: 'var(--color-muted)' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}>
                        <X size={14} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative">
                  <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={4}
                    placeholder={uploadedImage ? 'Describe how to transform this image...' : 'Example: a grinning toaster with sunglasses, thick outlines, lots of personality...'}
                    className="w-full px-4 pt-3.5 pb-12 font-body font-semibold text-base outline-none resize-y transition-all leading-relaxed rounded-xl border-2"
                    style={{ background: '#fff', borderColor: 'rgba(167,243,208,0.65)', color: 'var(--color-ink)' }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(52,211,153,0.65)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(52,211,153,0.15)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(167,243,208,0.65)'; e.currentTarget.style.boxShadow = 'none' }}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) generate() }}
                  />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5">
                    <div className="flex gap-1.5 flex-wrap flex-1 min-w-0">
                      {QUICK_TAGS.map(tag => (
                        <button key={tag} type="button" onClick={() => setPrompt(p => (p ? `${p}, ${tag}` : tag))}
                          className="font-mono text-[11px] px-2.5 py-1 rounded-full uppercase tracking-wide transition-all border shadow-sm"
                          style={{ background: 'linear-gradient(180deg,#fff,rgba(236,253,245,0.9))', borderColor: 'rgba(52,211,153,0.25)', color: 'var(--color-muted)' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(56,189,248,0.55)'; e.currentTarget.style.color = '#0d9488'; e.currentTarget.style.background = 'linear-gradient(180deg,#fff,rgba(224,242,254,0.85))' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(52,211,153,0.25)'; e.currentTarget.style.color = 'var(--color-muted)'; e.currentTarget.style.background = 'linear-gradient(180deg,#fff,rgba(236,253,245,0.9))' }}>
                          + {tag}
                        </button>
                      ))}
                    </div>
                    <button type="button"
                      onClick={inspire}
                      title="Random prompt inspiration"
                      className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[11px] uppercase tracking-wide border transition-all shadow-sm"
                      style={{ background: 'linear-gradient(180deg,#fff,rgba(254,243,199,0.9))', borderColor: 'rgba(251,191,36,0.35)', color: 'var(--color-muted)' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.7)'; e.currentTarget.style.color = '#d97706' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.35)'; e.currentTarget.style.color = 'var(--color-muted)' }}>
                      <Dice5 size={12} />
                      INSPIRE
                    </button>
                    <button type="button"
                      onClick={() => { if (provider !== 'gemini') { setProvider('gemini'); showToast('IMAGE MODE: SWITCHED TO GEMINI') } fileInputRef.current?.click() }}
                      title="Upload reference image"
                      className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[11px] uppercase tracking-wide border transition-all shadow-sm"
                      style={{ background: uploadedImage ? 'linear-gradient(180deg,rgba(236,253,245,1),rgba(209,250,229,0.9))' : 'linear-gradient(180deg,#fff,rgba(236,253,245,0.9))', borderColor: uploadedImage ? 'rgba(52,211,153,0.6)' : 'rgba(52,211,153,0.25)', color: uploadedImage ? '#059669' : 'var(--color-muted)' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(56,189,248,0.55)'; e.currentTarget.style.color = '#0d9488' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = uploadedImage ? 'rgba(52,211,153,0.6)' : 'rgba(52,211,153,0.25)'; e.currentTarget.style.color = uploadedImage ? '#059669' : 'var(--color-muted)' }}>
                      <ImagePlus size={12} />
                      {uploadedImage ? 'CHANGE' : 'IMAGE'}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </div>
                </div>
              </div>
            </div>

            {/* Style */}
            <div>
              <div className="mb-2">
                <p className="font-display text-xl tracking-wide" style={{ color: 'var(--color-ink)' }}>Look &amp; feel</p>
                <p className="font-body text-sm mt-0.5" style={{ color: 'var(--color-muted2)' }}>Nine styles — pick the energy that fits your idea.</p>
              </div>
              <StyleSelector selected={style} onChange={setStyle} />
            </div>

            {/* Color */}
            <div>
              <div className="mb-2">
                <p className="font-display text-xl tracking-wide" style={{ color: 'var(--color-ink)' }}>Color mood</p>
                <p className="font-body text-sm mt-0.5" style={{ color: 'var(--color-muted2)' }}>Bright, soft, or sparkly — pick a vibe.</p>
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
              className="w-full py-5 font-display text-2xl tracking-widest uppercase btn-retro"
              style={{ background: loading ? 'var(--color-disabled)' : '#dc2626', color: loading ? 'var(--color-disabled-text)' : 'white', cursor: loading ? 'not-allowed' : 'pointer', border: '1px solid', borderColor: loading ? 'transparent' : '#b91c1c', boxShadow: loading ? 'none' : '3px 3px 0 rgba(0,0,0,0.2)' }}>
              {loading ? 'PROCESSING...' : uploadedImage ? 'TRANSFORM IMAGE' : 'GENERATE STICKER'}
            </motion.button>
          </motion.div>

          {/* RIGHT: Output */}
          <motion.div className="flex flex-col items-center gap-4" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
            <StickerDisplay imageData={imageData} loading={loading} loadingText={loadingText} />

            <div className="flex gap-2 w-full max-w-sm flex-wrap">
              <button onClick={download} disabled={!imageData}
                className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-xs tracking-widest uppercase transition-all"
                style={{ border: !imageData ? '1px solid var(--color-border)' : '1px solid rgba(220,38,38,0.4)', color: !imageData ? 'var(--color-muted)' : '#dc2626', background: !imageData ? 'transparent' : 'var(--color-red-dim)', cursor: !imageData ? 'not-allowed' : 'pointer' }}
                onMouseEnter={e => { if (imageData) e.currentTarget.style.borderColor = '#dc2626' }}
                onMouseLeave={e => { if (imageData) e.currentTarget.style.borderColor = 'rgba(220,38,38,0.4)' }}>
                <Download size={13} /> SAVE
              </button>
              <button onClick={downloadTransparent} disabled={!imageData || removingBg}
                title="Download with transparent background"
                className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-xs tracking-widest uppercase transition-all"
                style={{ border: !imageData ? '1px solid var(--color-border)' : '1px solid rgba(99,102,241,0.4)', color: !imageData ? 'var(--color-muted)' : '#6366f1', background: !imageData ? 'transparent' : 'rgba(99,102,241,0.06)', cursor: (!imageData || removingBg) ? 'not-allowed' : 'pointer' }}
                onMouseEnter={e => { if (imageData) e.currentTarget.style.borderColor = '#6366f1' }}
                onMouseLeave={e => { if (imageData) e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)' }}>
                {removingBg ? '...' : <><Download size={13} /> TRANSP</>}
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
                style={{ border: '1px solid var(--color-border)', color: !imageData ? 'var(--color-muted)' : 'var(--color-muted2)', cursor: !imageData ? 'not-allowed' : 'pointer' }}
                onMouseEnter={e => { if (imageData) e.currentTarget.style.color = 'var(--color-ink)' }}
                onMouseLeave={e => { e.currentTarget.style.color = !imageData ? 'var(--color-muted)' : 'var(--color-muted2)' }}>
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
