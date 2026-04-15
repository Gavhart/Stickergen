import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Camera, Save, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { upsertProfile, uploadAvatar } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
import { AuthModal } from '../components/auth/AuthModal'
import { FREE_AI_LIMIT } from '../lib/types'

export function ProfilePage() {
  const { user, profile, refreshProfile, loading: authLoading } = useAuth()
  const { showToast } = useToast()
  const [username, setUsername] = useState(profile?.username ?? '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url ?? null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  if (profile && username === '' && profile.username) setUsername(profile.username)
  if (profile && avatarPreview === null && profile.avatar_url) setAvatarPreview(profile.avatar_url)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = () => setAvatarPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    let avatarUrl = profile?.avatar_url ?? null
    if (avatarFile) {
      const { url, error } = await uploadAvatar(user.id, avatarFile)
      if (error) { showToast('ERR: AVATAR UPLOAD FAILED'); setSaving(false); return }
      avatarUrl = url
    }
    const { error } = await upsertProfile({ id: user.id, username: username.trim() || null, avatar_url: avatarUrl })
    setSaving(false)
    if (error) { showToast('ERR: SAVE FAILED'); return }
    await refreshProfile()
    showToast('PROFILE UPDATED')
  }

  const handleManageSubscription = async () => {
    if (!profile?.stripe_customer_id) return
    const res = await fetch('/api/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: profile.stripe_customer_id }),
    })
    const { url } = await res.json() as { url?: string }
    if (url) window.location.href = url
  }

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="font-mono text-xs tracking-widest" style={{ color: 'var(--color-muted)', animation: 'blink 0.9s step-end infinite' }}>LOADING...</div>
    </div>
  )

  if (!user) return (
    <div className="min-h-screen grid-bg scanlines flex items-center justify-center">
      <motion.div className="retro-card text-center max-w-sm p-8" style={{ background: 'var(--color-surface)' }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="font-mono text-xs tracking-widest mb-3" style={{ color: '#b91c1c' }}>// AUTH REQUIRED</p>
        <h2 className="font-display text-4xl tracking-widest mb-4">ACCESS DENIED</h2>
        <p className="font-mono text-xs mb-6" style={{ color: 'var(--color-muted)' }}>Sign in to manage your profile.</p>
        <button onClick={() => setShowAuth(true)} className="btn-retro btn-retro-primary px-8 py-3 font-display text-xl tracking-widest">SIGN IN</button>
      </motion.div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )

  const isPro = profile?.plan === 'pro'
  const usesLeft = isPro ? null : Math.max(0, FREE_AI_LIMIT - (profile?.ai_uses_today ?? 0))

  return (
    <div className="grid-bg scanlines corner-glow min-h-screen">
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-10">
        <motion.div className="mb-10" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="font-mono text-xs tracking-widest mb-2" style={{ color: '#b45309' }}>// PITMASTER PROFILE</p>
          <h1 className="font-display leading-none" style={{ fontSize: 'clamp(3rem, 10vw, 5rem)', letterSpacing: '0.08em' }}>
            PROFILE<span style={{ color: '#b91c1c' }}>.</span>
          </h1>
        </motion.div>

        {/* Plan status */}
        <motion.div className="retro-card p-5 mb-6 flex items-center justify-between"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div>
            <p className="font-mono text-xs tracking-widest mb-1" style={{ color: 'var(--color-muted)' }}>// YOUR PLAN</p>
            <div className="flex items-center gap-3">
              {isPro && <Zap size={15} style={{ color: '#b45309' }} />}
              <span className="font-display text-2xl tracking-widest" style={{ color: isPro ? '#b45309' : 'var(--color-ink)' }}>
                {isPro ? 'PRO PITMASTER' : 'FREE PLAN'}
              </span>
            </div>
            {!isPro && (
              <p className="font-mono text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                {usesLeft} of {FREE_AI_LIMIT} AI generations left today
              </p>
            )}
          </div>
          {isPro ? (
            <button onClick={handleManageSubscription}
              className="btn-retro btn-retro-ghost px-4 py-2 font-mono text-xs tracking-widest">
              MANAGE
            </button>
          ) : (
            <Link to="/pricing" className="btn-retro btn-retro-amber px-4 py-2 font-display text-base tracking-widest">
              UPGRADE
            </Link>
          )}
        </motion.div>

        {/* Profile form */}
        <motion.div className="retro-card p-8 space-y-6"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>

          {/* Avatar */}
          <div>
            <p className="font-mono text-xs tracking-widest mb-4" style={{ color: 'var(--color-muted)' }}>// AVATAR</p>
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 overflow-hidden" style={{ border: '2px solid var(--color-border-strong)' }}>
                  {avatarPreview
                    ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center font-display text-3xl" style={{ background: 'var(--color-surface2)', color: '#b45309' }}>
                        {username?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?'}
                      </div>
                  }
                </div>
                <button onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-2 -right-2 p-1.5 transition-all"
                  style={{ background: '#b45309', color: 'white' }}>
                  <Camera size={11} />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div>
                <p className="font-mono text-xs tracking-widest" style={{ color: 'var(--color-muted2)' }}>{user.email}</p>
                <p className="font-mono text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                  Member since {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Username */}
          <div>
            <p className="font-mono text-xs tracking-widest mb-2" style={{ color: 'var(--color-muted)' }}>// HANDLE</p>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="Choose a username..." maxLength={30}
              className="w-full px-4 py-3 font-mono text-sm outline-none transition-all"
              style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border-strong)', color: 'var(--color-ink)' }}
              onFocus={e => e.currentTarget.style.borderColor = '#b45309'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border-strong)'}
            />
          </div>

          {/* Save */}
          <motion.button onClick={handleSave} disabled={saving} whileTap={{ scale: 0.98 }}
            className="btn-retro btn-retro-primary w-full py-4 font-display text-xl tracking-widest flex items-center justify-center gap-3">
            <Save size={17} />
            {saving ? 'SAVING...' : 'SAVE PROFILE'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}
