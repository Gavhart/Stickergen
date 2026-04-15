import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Search, Flame } from 'lucide-react'
import { getFeedRecipes, toggleSave, getSavedIds } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { RECIPE_TAGS, type Recipe } from '../lib/types'
import { RecipeCard } from '../components/recipe/RecipeCard'
import { AuthModal } from '../components/auth/AuthModal'

export function FeedPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState('')
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    getFeedRecipes(48).then(data => { setRecipes(data); setLoading(false) })
  }, [])

  useEffect(() => {
    if (user) getSavedIds(user.id).then(ids => setSavedIds(new Set(ids)))
  }, [user])

  const handleToggleSave = async (recipeId: string, isSaved: boolean) => {
    if (!user) { setShowAuth(true); return }
    setSavedIds(prev => {
      const next = new Set(prev)
      isSaved ? next.delete(recipeId) : next.add(recipeId)
      return next
    })
    await toggleSave(user.id, recipeId, isSaved)
    showToast(isSaved ? 'REMOVED FROM VAULT' : 'SAVED TO VAULT')
  }

  const filtered = recipes.filter(r => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || (r.description ?? '').toLowerCase().includes(search.toLowerCase())
    const matchTag = !activeTag || (r.tags ?? []).includes(activeTag)
    return matchSearch && matchTag
  })

  return (
    <div className="grid-bg scanlines corner-glow min-h-screen">
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <motion.div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            <p className="font-mono text-xs tracking-widest mb-2" style={{ color: '#b45309' }}>// COMMUNITY RECIPES</p>
            <h1 className="font-display leading-none" style={{ fontSize: 'clamp(3rem, 10vw, 6rem)', letterSpacing: '0.06em' }}>
              THE PIT<span style={{ color: '#b91c1c' }}>.</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 pb-1">
            <Flame size={13} style={{ color: '#b45309' }} />
            <span className="font-mono text-xs" style={{ color: 'var(--color-muted)', letterSpacing: '0.08em' }}>
              {recipes.length} RECIPE{recipes.length !== 1 ? 'S' : ''} IN THE PIT
            </span>
          </div>
        </motion.div>

        {/* Search + filters */}
        <motion.div className="mb-8 space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <div className="relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search recipes..."
              className="w-full pl-10 pr-4 py-3 font-body font-semibold text-base outline-none transition-all"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)', color: 'var(--color-ink)' }}
              onFocus={e => e.currentTarget.style.borderColor = '#b45309'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border-strong)'}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setActiveTag('')}
              className="font-mono px-3 py-1 transition-all"
              style={{ fontSize: '0.62rem', letterSpacing: '0.08em', background: !activeTag ? '#b45309' : 'var(--color-surface2)', color: !activeTag ? 'white' : 'var(--color-muted)', border: !activeTag ? '1px solid #92400e' : '1px solid var(--color-border)' }}>
              ALL
            </button>
            {RECIPE_TAGS.slice(0, 12).map(tag => (
              <button key={tag} onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
                className="font-mono px-3 py-1 transition-all"
                style={{ fontSize: '0.62rem', letterSpacing: '0.08em', background: activeTag === tag ? '#b45309' : 'var(--color-surface2)', color: activeTag === tag ? 'white' : 'var(--color-muted)', border: activeTag === tag ? '1px solid #92400e' : '1px solid var(--color-border)' }}>
                {tag}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Grid */}
        {loading && (
          <div className="flex items-center justify-center py-32">
            <div className="flex gap-1 items-end h-8">
              {[40, 70, 100, 70, 40].map((h, i) => (
                <div key={i} className="w-1" style={{ height: `${h}%`, background: '#b45309', animation: `barPulse 0.9s ease-in-out ${i * 0.12}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <motion.div className="text-center py-32" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="font-mono text-xs tracking-widest mb-2" style={{ color: 'var(--color-muted)' }}>[ EMPTY PIT ]</p>
            <p className="font-mono text-xs" style={{ color: 'var(--color-muted2)' }}>NO RECIPES FOUND — BE THE FIRST</p>
            <Link to="/create" className="btn-retro btn-retro-amber inline-flex items-center gap-2 px-6 py-3 font-display text-lg tracking-widest mt-6">
              <Flame size={15} /> FIRE ONE UP
            </Link>
          </motion.div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((recipe, i) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                index={i}
                saved={savedIds.has(recipe.id)}
                onToggleSave={(id, saved) => handleToggleSave(id, saved)}
                showAuthor
              />
            ))}
          </div>
        )}
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}
