import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { User, LogOut, Menu, X, ChefHat } from 'lucide-react'
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
    { to: '/feed',       label: 'FEED'       },
    { to: '/create',     label: 'CREATE'     },
    { to: '/my-recipes', label: 'MY RECIPES' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      <nav className="sticky top-0 z-40" style={{ background: 'var(--color-nav-bg)', backdropFilter: 'blur(14px)', borderBottom: '1px solid var(--color-border-strong)' }}>
        <div style={{ height: '2px', background: 'linear-gradient(90deg, #dc2626 0%, #991b1b 55%, transparent 100%)' }} />
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">

          {/* Logo */}
          <Link to="/" className="flex items-baseline gap-2" style={{ textDecoration: 'none' }}>
            <ChefHat size={18} style={{ color: '#dc2626', marginBottom: '-2px' }} />
            <span className="font-display" style={{ fontSize: '1.4rem', letterSpacing: '0.12em', color: 'var(--color-ink)', lineHeight: 1 }}>GAVDADDY</span>
            <span className="font-mono" style={{ fontSize: '0.55rem', letterSpacing: '0.14em', color: '#dc2626', paddingBottom: '2px', borderBottom: '1px solid #dc2626' }}>RECIPES</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to}
                className="font-ui text-sm tracking-widest px-4 py-2 transition-all"
                style={{ fontWeight: 600, letterSpacing: '0.12em', color: isActive(link.to) ? '#dc2626' : 'var(--color-muted2)', borderBottom: isActive(link.to) ? '2px solid #dc2626' : '2px solid transparent' }}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                {profile?.plan === 'free' && (
                  <Link to="/pricing"
                    className="font-mono text-xs tracking-widest px-3 py-1.5 transition-all"
                    style={{ color: '#dc2626', border: '1px solid rgba(220,38,38,0.4)', background: 'var(--color-red-dim)' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#dc2626'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(220,38,38,0.4)'}>
                    UPGRADE PRO
                  </Link>
                )}
                <Link to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 font-mono text-xs tracking-widest transition-all"
                  style={{ color: 'var(--color-muted2)', border: '1px solid var(--color-border-strong)', background: 'var(--color-surface2)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-ink)'; e.currentTarget.style.borderColor = '#dc2626' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-muted2)'; e.currentTarget.style.borderColor = 'var(--color-border-strong)' }}>
                  <User size={12} />
                  {profile?.username ?? 'PROFILE'}
                </Link>
                <button onClick={handleSignOut}
                  className="flex items-center px-3 py-1.5 font-mono text-xs tracking-widest transition-all"
                  style={{ color: 'var(--color-muted)', border: '1px solid transparent' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.25)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-muted)'; e.currentTarget.style.borderColor = 'transparent' }}>
                  <LogOut size={12} />
                </button>
              </>
            ) : (
              <button onClick={() => setShowAuth(true)}
                className="btn-retro btn-retro-primary px-5 py-2 text-sm"
                style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, letterSpacing: '0.14em' }}>
                SIGN IN
              </button>
            )}
          </div>

          <button className="md:hidden p-2" style={{ color: 'var(--color-muted2)' }} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div className="md:hidden border-t" style={{ borderColor: 'var(--color-border-strong)', background: 'var(--color-nav-mobile-bg)' }}
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <div className="px-6 py-3 space-y-0">
                {navLinks.map(link => (
                  <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 font-mono text-xs tracking-widest py-2.5 border-b"
                    style={{ color: isActive(link.to) ? '#dc2626' : 'var(--color-muted2)', borderColor: 'var(--color-border)' }}>
                    <span style={{ color: '#dc2626', opacity: isActive(link.to) ? 1 : 0.4 }}>{'>'}</span>
                    {link.label}
                  </Link>
                ))}
                {user ? (
                  <>
                    <Link to="/profile" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 font-mono text-xs tracking-widest py-2.5 border-b"
                      style={{ color: 'var(--color-muted2)', borderColor: 'var(--color-border)' }}>
                      <span style={{ color: '#dc2626', opacity: 0.4 }}>{'>'}</span>PROFILE
                    </Link>
                    {profile?.plan === 'free' && (
                      <Link to="/pricing" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 font-mono text-xs tracking-widest py-2.5 border-b"
                        style={{ color: '#dc2626', borderColor: 'var(--color-border)' }}>
                        <span>{'>'}</span>UPGRADE PRO
                      </Link>
                    )}
                    <button onClick={() => { handleSignOut(); setMenuOpen(false) }}
                      className="flex items-center gap-2 font-mono text-xs tracking-widest py-2.5 w-full text-left"
                      style={{ color: 'var(--color-muted)' }}>
                      <span style={{ color: '#dc2626', opacity: 0.4 }}>{'>'}</span>SIGN OUT
                    </button>
                  </>
                ) : (
                  <button onClick={() => { setShowAuth(true); setMenuOpen(false) }}
                    className="flex items-center gap-2 font-mono text-xs tracking-widest py-2.5 w-full text-left"
                    style={{ color: '#dc2626' }}>
                    <span>{'>'}</span>SIGN IN
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
