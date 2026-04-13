import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { User, LogOut, Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { signOut } from '../../lib/supabase'
import { AuthModal } from '../auth/AuthModal'
import { useToast } from '../../context/ToastContext'

export function Navbar() {
  const { user, profile } = useAuth()
  const { showToast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const [showAuth, setShowAuth] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    showToast('SIGNED OUT')
    navigate('/')
  }

  const navLinks = [
    { to: '/create',  label: 'CREATE'  },
    { to: '/gallery', label: 'GALLERY' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      <nav className="sticky top-0 z-40" style={{ background: 'var(--color-nav-bg)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="font-display text-2xl tracking-widest" style={{ letterSpacing: '0.15em' }}>
            STICKER<span style={{ color: '#dc2626' }}>GEN</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to}
                className="font-mono text-xs tracking-widest px-4 py-2 transition-all"
                style={{
                  color: isActive(link.to) ? '#dc2626' : 'var(--color-muted2)',
                  borderBottom: isActive(link.to) ? '1px solid #dc2626' : '1px solid transparent',
                }}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Link to="/profile"
                  className="flex items-center gap-2 px-3 py-2 font-mono text-xs tracking-widest transition-all"
                  style={{ color: 'var(--color-muted2)', border: '1px solid var(--color-border)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-ink)'; e.currentTarget.style.borderColor = 'var(--color-border-strong)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-muted2)'; e.currentTarget.style.borderColor = 'var(--color-border)' }}>
                  <User size={13} />
                  {profile?.username ?? 'PROFILE'}
                </Link>
                <button onClick={handleSignOut}
                  className="flex items-center gap-2 px-3 py-2 font-mono text-xs tracking-widest transition-all"
                  style={{ color: 'var(--color-muted)' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}>
                  <LogOut size={13} />
                </button>
              </>
            ) : (
              <button onClick={() => setShowAuth(true)}
                className="px-5 py-2 font-mono text-xs tracking-widest uppercase transition-all"
                style={{ background: '#dc2626', color: 'white' }}
                onMouseEnter={e => e.currentTarget.style.background = '#b91c1c'}
                onMouseLeave={e => e.currentTarget.style.background = '#dc2626'}>
                SIGN IN
              </button>
            )}
          </div>

          {/* Mobile menu btn */}
          <button className="md:hidden p-2" style={{ color: 'var(--color-muted2)' }} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div className="md:hidden border-t" style={{ borderColor: 'var(--color-border)', background: 'var(--color-nav-mobile-bg)' }}
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <div className="px-6 py-4 space-y-2">
                {navLinks.map(link => (
                  <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
                    className="block font-mono text-xs tracking-widest py-2"
                    style={{ color: isActive(link.to) ? '#dc2626' : 'var(--color-muted2)' }}>
                    // {link.label}
                  </Link>
                ))}
                {user ? (
                  <>
                    <Link to="/profile" onClick={() => setMenuOpen(false)}
                      className="block font-mono text-xs tracking-widest py-2" style={{ color: 'var(--color-muted2)' }}>
                      // PROFILE
                    </Link>
                    <button onClick={() => { handleSignOut(); setMenuOpen(false) }}
                      className="block font-mono text-xs tracking-widest py-2 w-full text-left" style={{ color: 'var(--color-muted)' }}>
                      // SIGN OUT
                    </button>
                  </>
                ) : (
                  <button onClick={() => { setShowAuth(true); setMenuOpen(false) }}
                    className="block font-mono text-xs tracking-widest py-2 w-full text-left" style={{ color: '#dc2626' }}>
                    // SIGN IN
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  )
}
