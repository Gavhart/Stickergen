import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Flame, BookOpen, Plus } from 'lucide-react'
import { getMyRecipes, getSavedRecipes, toggleSave, deleteRecipe } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { type Recipe } from '../lib/types'
import { RecipeCard } from '../components/recipe/RecipeCard'
import { AuthModal } from '../components/auth/AuthModal'

type Tab = 'mine' | 'saved'

export function MyRecipesPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [tab, setTab] = useState<Tab>('mine')
  const [myRecipes, setMyRecipes] = useState<Recipe[]>([])
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([])
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    Promise.all([getMyRecipes(user.id), getSavedRecipes(user.id)]).then(([mine, saved]) => {
      setMyRecipes(mine)
      setSavedRecipes(saved)
      setSavedIds(new Set(saved.map(r => r.id)))
      setLoading(false)
    })
  }, [user])

  const handleToggleSave = async (recipeId: string, isSaved: boolean) => {
    if (!user) return
    setSavedIds(prev => { const next = new Set(prev); isSaved ? next.delete(recipeId) : next.add(recipeId); return next })
    if (isSaved) setSavedRecipes(prev => prev.filter(r => r.id !== recipeId))
    await toggleSave(user.id, recipeId, isSaved)
    showToast(isSaved ? 'REMOVED FROM VAULT' : 'SAVED TO VAULT')
  }

  const handleDelete = async (recipeId: string) => {
    await deleteRecipe(recipeId)
    setMyRecipes(prev => prev.filter(r => r.id !== recipeId))
    showToast('RECIPE REMOVED')
  }

  if (!user) return (
    <div className="grid-bg scanlines corner-glow min-h-screen flex items-center justify-center px-6">
      <motion.div className="retro-card max-w-md w-full text-center p-10" style={{ background: 'var(--color-surface)' }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="font-mono text-xs tracking-widest mb-3" style={{ color: '#b91c1c' }}>// ACCESS RESTRICTED</p>
        <h2 className="font-display mb-4" style={{ fontSize: '3.5rem', letterSpacing: '0.1em' }}>SIGN IN<span style={{ color: '#b91c1c' }}>.</span></h2>
        <p className="font-mono text-xs leading-loose mb-8" style={{ color: 'var(--color-muted)' }}>Sign in to access your recipe vault.</p>
        <button onClick={() => setShowAuth(true)} className="btn-retro btn-retro-primary w-full py-4 font-display text-xl tracking-widest">
          SIGN IN
        </button>
      </motion.div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )

  const displayed = tab === 'mine' ? myRecipes : savedRecipes

  return (
    <div className="grid-bg scanlines corner-glow min-h-screen">
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <motion.div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            <p className="font-mono text-xs tracking-widest mb-2" style={{ color: '#b45309' }}>// YOUR COLLECTION</p>
            <h1 className="font-display leading-none" style={{ fontSize: 'clamp(3rem, 10vw, 6rem)', letterSpacing: '0.06em' }}>
              THE VAULT<span style={{ color: '#b91c1c' }}>.</span>
            </h1>
          </div>
          <Link to="/create" className="btn-retro btn-retro-amber inline-flex items-center gap-2 px-6 py-3 font-display text-lg tracking-widest self-start md:self-end">
            <Plus size={16} /> ADD RECIPE
          </Link>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {([['mine', 'MY RECIPES', myRecipes.length], ['saved', 'SAVED', savedRecipes.length]] as [Tab, string, number][]).map(([t, label, count]) => (
            <button key={t} onClick={() => setTab(t)}
              className="flex items-center gap-2 px-5 py-2.5 font-display text-lg tracking-widest transition-all"
              style={{
                background: tab === t ? '#b45309' : 'transparent',
                color: tab === t ? 'white' : 'var(--color-muted2)',
                border: tab === t ? '1px solid #92400e' : '1px solid var(--color-border-strong)',
                boxShadow: tab === t ? '3px 3px 0 rgba(0,0,0,0.18)' : 'none',
              }}>
              {t === 'mine' ? <Flame size={14} /> : <BookOpen size={14} />}
              {label}
              <span className="font-mono text-xs opacity-70">({count})</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {loading && (
          <div className="flex items-center justify-center py-32">
            <div className="flex gap-1 items-end h-8">
              {[40, 70, 100, 70, 40].map((h, i) => (
                <div key={i} className="w-1" style={{ height: `${h}%`, background: '#b45309', animation: `barPulse 0.9s ease-in-out ${i * 0.12}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        {!loading && displayed.length === 0 && (
          <motion.div className="text-center py-32" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="font-mono text-xs tracking-widest mb-2" style={{ color: 'var(--color-muted)' }}>[ VAULT IS EMPTY ]</p>
            <p className="font-mono text-xs mb-6" style={{ color: 'var(--color-muted2)' }}>
              {tab === 'mine' ? 'NO RECIPES YET — FIRE UP THE FORGE' : 'BROWSE THE PIT AND SAVE RECIPES YOU LOVE'}
            </p>
            <Link to={tab === 'mine' ? '/create' : '/feed'}
              className="btn-retro btn-retro-amber inline-flex items-center gap-2 px-6 py-3 font-display text-lg tracking-widest">
              {tab === 'mine' ? <><Flame size={15} /> FIRE IT UP</> : <><BookOpen size={15} /> BROWSE THE PIT</>}
            </Link>
          </motion.div>
        )}

        {!loading && displayed.length > 0 && (
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            {displayed.map((recipe, i) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                index={i}
                saved={savedIds.has(recipe.id)}
                onToggleSave={(id, s) => handleToggleSave(id, s)}
                showAuthor={false}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
