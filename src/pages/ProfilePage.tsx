import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Camera, Save } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { upsertProfile, uploadAvatar } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
import { AuthModal } from '../components/auth/AuthModal'

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

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="font-mono text-xs tracking-widest" style={{ color: 'var(--color-muted)', animation: 'blink 0.9s step-end infinite' }}>LOADING...</div>
    </div>
  )

  if (!user) return (
    <div className="min-h-screen grid-bg scanlines flex items-center justify-center">
      <motion.div
        className="text-center max-w-sm p-8"
        style={{ border: '1px solid var(--color-border)', borderLeft: '3px solid #dc2626', background: 'var(--color-surface)', boxShadow: '0 8px 32px rgba(0,0,0,0.06)' }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="font-mono text-xs tracking-widest mb-3" style={{ color: '#dc2626' }}>// AUTH REQUIRED</p>
        <h2 className="font-display text-4xl tracking-widest mb-4">ACCESS DENIED</h2>
        <p className="font-mono text-xs mb-6" style={{ color: 'var(--color-muted)' }}>Sign in to manage your profile.</p>
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
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-10">
        <motion.div className="mb-10" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="font-mono text-xs tracking-widest mb-2" style={{ color: '#dc2626' }}>// USER PROFILE</p>
          <h1 className="font-display text-7xl tracking-widest leading-none">
            PROFILE<span style={{ color: '#dc2626' }}>.</span>
          </h1>
        </motion.div>

        <motion.div
          className="space-y-8 p-8"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderLeft: '3px solid #dc2626', boxShadow: '0 4px 24px rgba(0,0,0,0.05)' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>

          {/* Avatar */}
          <div>
            <p className="font-mono text-xs tracking-widest mb-4" style={{ color: 'var(--color-muted)' }}>// AVATAR</p>
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 overflow-hidden" style={{ border: '2px solid var(--color-border)' }}>
                  {avatarPreview
                    ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    : (
                      <div className="w-full h-full flex items-center justify-center font-display text-4xl"
                        style={{ background: 'var(--color-surface2)', color: '#dc2626' }}>
                        {username?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?'}
                      </div>
                    )
                  }
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-2 -right-2 p-1.5 transition-all"
                  style={{ background: '#dc2626', color: 'white' }}>
                  <Camera size={12} />
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
            <p className="font-mono text-xs tracking-widest mb-2" style={{ color: 'var(--color-muted)' }}>// USERNAME</p>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Choose a username..."
              maxLength={30}
              className="w-full px-4 py-3 font-mono text-sm outline-none transition-all"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-ink)' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#dc2626')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
            />
          </div>

          {/* Save */}
          <motion.button
            onClick={handleSave}
            disabled={saving}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 font-display text-xl tracking-widest uppercase flex items-center justify-center gap-3 transition-all"
            style={{ background: saving ? 'var(--color-disabled)' : '#dc2626', color: saving ? 'var(--color-disabled-text)' : 'white', cursor: saving ? 'not-allowed' : 'pointer' }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#b91c1c' }}
            onMouseLeave={e => { if (!saving) e.currentTarget.style.background = saving ? 'var(--color-disabled)' : '#dc2626' }}>
            <Save size={18} />
            {saving ? 'SAVING...' : 'SAVE PROFILE'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}
