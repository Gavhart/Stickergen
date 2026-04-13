import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getStickers, deleteSticker } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
import { AuthModal } from '../components/auth/AuthModal'
import type { Sticker } from '../lib/types'

export function GalleryPage() {
  const { user, loading: authLoading } = useAuth()
  const { showToast } = useToast()
  const [stickers, setStickers] = useState<Sticker[]>([])
  const [loading, setLoading] = useState(true)
  const [showAuth, setShowAuth] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    getStickers(user.id).then(data => { setStickers(data); setLoading(false) })
  }, [user])

  const handleDelete = async (sticker: Sticker) => {
    setDeleting(sticker.id)
    await deleteSticker(sticker)
    setStickers(prev => prev.filter(s => s.id !== sticker.id))
    setDeleting(null)
    showToast('DELETED')
  }

  const handleDownload = (sticker: Sticker) => {
    const a = document.createElement('a')
    a.href = sticker.image_url
    a.download = `sticker_${sticker.prompt.replace(/[^a-z0-9]/gi, '_').slice(0, 30)}.png`
    a.target = '_blank'
    a.click()
    showToast('FILE SAVED')
  }

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="font-mono text-xs tracking-widest" style={{ color: 'var(--color-muted)', animation: 'blink 0.9s step-end infinite' }}>LOADING...</div>
    </div>
  )

  if (!user) return (
    <div className="min-h-screen grid-bg scanlines flex items-center justify-center">
      <motion.div className="text-center max-w-sm p-8" style={{ border: '1px solid var(--color-border)', borderLeft: '3px solid #dc2626', background: 'var(--color-surface)', boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="font-mono text-xs tracking-widest mb-3" style={{ color: '#dc2626' }}>// AUTH REQUIRED</p>
        <h2 className="font-display text-4xl tracking-widest mb-4">ACCESS DENIED</h2>
        <p className="font-mono text-xs mb-6" style={{ color: 'var(--color-muted)' }}>Sign in to view your saved sticker archive.</p>
        <button onClick={() => setShowAuth(true)}
          className="px-8 py-3 font-display text-xl tracking-widest"
          style={{ background: '#dc2626', color: 'white' }}>
          SIGN IN
        </button>
      </motion.div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )

  return (
    <div className="grid-bg scanlines corner-glow min-h-screen">
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10">
        <motion.div className="mb-10 flex items-end justify-between" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            <p className="font-mono text-xs tracking-widest mb-2" style={{ color: '#dc2626' }}>// STICKER ARCHIVE</p>
            <h1 className="font-display text-7xl tracking-widest leading-none">
              GALLERY<span style={{ color: '#dc2626' }}>.</span>
            </h1>
          </div>
          <p className="font-mono text-xs tracking-widest" style={{ color: 'var(--color-muted)' }}>
            {stickers.length} STICKER{stickers.length !== 1 ? 'S' : ''}
          </p>
        </motion.div>

        {loading && (
          <div className="flex items-center justify-center py-32">
            <div className="flex gap-1 items-end h-8">
              {[40, 70, 100, 70, 40].map((h, i) => (
                <div key={i} className="w-1 rounded-sm" style={{ height: `${h}%`, background: '#dc2626', animation: `barPulse 0.9s ease-in-out ${i * 0.12}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        {!loading && stickers.length === 0 && (
          <motion.div className="text-center py-32" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="font-mono text-xs tracking-widest mb-3" style={{ color: 'var(--color-muted)' }}>[ EMPTY ]</p>
            <p className="font-mono text-xs tracking-widest" style={{ color: 'var(--color-muted2)' }}>NO ARCHIVED STICKERS</p>
          </motion.div>
        )}

        {!loading && stickers.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <AnimatePresence>
              {stickers.map((sticker, i) => (
                <motion.div key={sticker.id}
                  className="group relative overflow-hidden"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                  initial={{ opacity: 0, y: 20, scale: 0.93 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ borderColor: '#dc2626' }}>
                  <img src={sticker.image_url} alt={sticker.prompt} className="w-full aspect-square object-cover block" />
                  <div className="p-2">
                    <p className="font-body font-bold text-xs uppercase tracking-wide truncate mb-1" style={{ color: 'var(--color-muted2)' }}>{sticker.prompt}</p>
                    <p className="font-mono text-xs" style={{ color: '#dc2626', letterSpacing: '1px' }}>{sticker.style.toUpperCase()}</p>
                  </div>
                  {/* Hover actions */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(0,0,0,0.55)' }}>
                    <button onClick={() => handleDownload(sticker)}
                      className="p-2 transition-all" style={{ border: '1px solid rgba(255,255,255,0.35)', color: 'rgba(255,255,255,0.85)' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.color = '#fecaca' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)' }}>
                      <Download size={14} />
                    </button>
                    <button onClick={() => handleDelete(sticker)} disabled={deleting === sticker.id}
                      className="p-2 transition-all" style={{ border: '1px solid rgba(255,255,255,0.35)', color: 'rgba(255,255,255,0.85)' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.color = '#fecaca' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
