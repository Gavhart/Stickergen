import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '../../lib/supabase'
import { useToast } from '../../context/ToastContext'

interface Props { onClose: () => void }

type Tab = 'login' | 'signup'

export function AuthModal({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const fn = tab === 'login' ? signInWithEmail : signUpWithEmail
    const { error } = await fn(email, password)
    setLoading(false)
    if (error) { setError(error.message); return }
    showToast(tab === 'login' ? 'ACCESS GRANTED' : 'ACCOUNT CREATED  -  CHECK EMAIL')
    onClose()
  }

  const handleGoogle = async () => {
    setLoading(true)
    await signInWithGoogle()
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-stone-900/45 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        />

        {/* Modal */}
        <motion.div
          className="relative z-10 w-full max-w-md"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderLeft: '3px solid #dc2626', boxShadow: '0 24px 48px rgba(0,0,0,0.12)' }}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div>
              <p className="font-mono text-xs tracking-widest" style={{ color: '#dc2626' }}>
                // AUTH SYSTEM
              </p>
              <h2 className="font-display text-3xl tracking-widest mt-1">
                {tab === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
              </h2>
            </div>
            <button onClick={onClose} className="p-2 transition-colors" style={{ color: 'var(--color-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ink)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}>
              <X size={20} />
            </button>
          </div>

          {/* Tab switcher */}
          <div className="flex border-b" style={{ borderColor: 'var(--color-border)' }}>
            {(['login', 'signup'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="flex-1 py-3 font-mono text-xs tracking-widest uppercase transition-all"
                style={{
                  color: tab === t ? '#dc2626' : 'var(--color-muted)',
                  borderBottom: tab === t ? '2px solid #dc2626' : '2px solid transparent',
                  background: tab === t ? 'var(--color-red-dim)' : 'transparent',
                }}>
                {t === 'login' ? 'LOGIN' : 'SIGN UP'}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-4">
            {/* Google OAuth */}
            <button onClick={handleGoogle} disabled={loading}
              className="w-full py-3 font-mono text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-3"
              style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface2)', color: 'var(--color-muted2)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-strong)'; e.currentTarget.style.color = 'var(--color-ink)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-muted2)' }}>
              <svg width="16" height="16" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
                <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.7 0-14.3 4.4-17.7 10.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36.5 24 36.5c-5.2 0-9.6-3.5-11.2-8.2l-6.5 5C9.7 39.6 16.4 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.5-4.6 6l6.2 5.2C41 35.5 44 30.2 44 24c0-1.3-.1-2.7-.4-4z"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
              <span className="font-mono text-xs" style={{ color: 'var(--color-muted)' }}>OR</span>
              <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 font-mono text-xs" style={{ border: '1px solid var(--color-error-muted)', borderLeft: '3px solid #dc2626', color: 'var(--color-error-text)', background: 'var(--color-error-soft)' }}>
                ERR: {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block font-mono text-xs tracking-widest mb-1" style={{ color: 'var(--color-muted)' }}>EMAIL</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full px-4 py-3 font-mono text-sm outline-none transition-all"
                  style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border-input)', color: 'var(--color-ink)' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#dc2626'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border-input)'}
                  placeholder="you@example.com" />
              </div>
              <div>
                <label className="block font-mono text-xs tracking-widest mb-1" style={{ color: 'var(--color-muted)' }}>PASSWORD</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                  className="w-full px-4 py-3 font-mono text-sm outline-none transition-all"
                  style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border-input)', color: 'var(--color-ink)' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#dc2626'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border-input)'}
                  placeholder="••••••••" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-4 font-display text-xl tracking-widest uppercase transition-all mt-2"
                style={{
                  background: loading ? 'var(--color-disabled)' : '#dc2626',
                  color: loading ? 'var(--color-disabled-text)' : 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#b91c1c' }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#dc2626' }}>
                {loading ? 'PROCESSING...' : tab === 'login' ? 'ENTER' : 'CREATE ACCOUNT'}
              </button>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
