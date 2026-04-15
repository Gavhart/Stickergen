import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, Users, Flame, Bookmark, BookmarkCheck, Trash2, ChevronLeft, Loader, Leaf } from 'lucide-react'
import { getRecipe, toggleSave, deleteRecipe, updateRecipe } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import type { Recipe, Nutrition } from '../lib/types'

function scaleAmount(amount: string, factor: number): string {
  const num = parseFloat(amount)
  if (isNaN(num)) return amount
  const result = num * factor
  return result % 1 === 0 ? String(result) : result.toFixed(1).replace(/\.0$/, '')
}

export function RecipePage() {
  const { id } = useParams<{ id: string }>()
  const { user, profile } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [servings, setServings] = useState(4)
  const [analyzing, setAnalyzing] = useState(false)
  const [nutrition, setNutrition] = useState<Nutrition | null>(null)

  useEffect(() => {
    if (!id) return
    getRecipe(id).then(r => {
      setRecipe(r)
      if (r) {
        setServings(r.servings)
        setNutrition(r.nutrition)
      }
      setLoading(false)
    })
  }, [id])

  const scale = recipe ? servings / recipe.servings : 1
  const totalTime = recipe ? (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0) : 0
  const isOwner = user && recipe && user.id === recipe.user_id

  const handleToggleSave = async () => {
    if (!user || !recipe) return
    setSaved(s => !s)
    await toggleSave(user.id, recipe.id, saved)
    showToast(saved ? 'REMOVED FROM VAULT' : 'SAVED TO VAULT')
  }

  const handleDelete = async () => {
    if (!isOwner || !recipe) return
    await deleteRecipe(recipe.id)
    showToast('RECIPE REMOVED FROM THE VAULT')
    navigate('/my-recipes')
  }

  const analyzeNutrition = async () => {
    if (!recipe || !user || profile?.plan !== 'pro') return
    setAnalyzing(true)
    try {
      const res = await fetch('/api/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe, userId: user.id }),
      })
      const data = await res.json() as { nutrition?: Nutrition; error?: string }
      if (!res.ok || !data.nutrition) throw new Error(data.error ?? 'Analysis failed')
      setNutrition(data.nutrition)
      await updateRecipe(recipe.id, { nutrition: data.nutrition })
      showToast('NUTRITION ANALYSIS COMPLETE')
    } catch (e) {
      showToast('ERR: ' + (e instanceof Error ? e.message : 'Analysis failed'))
    } finally {
      setAnalyzing(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex gap-1 items-end h-8">
        {[40, 70, 100, 70, 40].map((h, i) => (
          <div key={i} className="w-1" style={{ height: `${h}%`, background: '#b45309', animation: `barPulse 0.9s ease-in-out ${i * 0.12}s infinite` }} />
        ))}
      </div>
    </div>
  )

  if (!recipe) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="font-mono text-xs tracking-widest mb-4" style={{ color: 'var(--color-muted)' }}>[ RECIPE NOT FOUND ]</p>
        <Link to="/feed" className="btn-retro btn-retro-ghost px-6 py-3 font-display text-lg tracking-widest">BACK TO THE PIT</Link>
      </div>
    </div>
  )

  return (
    <div className="grid-bg scanlines corner-glow min-h-screen">
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-10">

        {/* Back */}
        <Link to="/feed" className="inline-flex items-center gap-2 font-mono text-xs tracking-widest mb-8 transition-all"
          style={{ color: 'var(--color-muted)' }}
          onMouseEnter={e => e.currentTarget.style.color = '#b45309'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}>
          <ChevronLeft size={14} /> BACK TO THE PIT
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          {/* Tags */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {recipe.source === 'ai' && (
              <span className="flex items-center gap-1 font-mono" style={{ fontSize: '0.58rem', letterSpacing: '0.1em', color: '#b45309', background: 'rgba(180,83,9,0.08)', padding: '2px 7px', border: '1px solid rgba(180,83,9,0.25)' }}>
                <Flame size={9} /> PITMASTER AI
              </span>
            )}
            {(recipe.tags ?? []).map(tag => (
              <span key={tag} className="font-mono" style={{ fontSize: '0.58rem', letterSpacing: '0.08em', color: 'var(--color-muted)', background: 'var(--color-surface2)', padding: '2px 6px' }}>
                {tag.toUpperCase()}
              </span>
            ))}
          </div>

          <h1 className="font-display mb-2" style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', letterSpacing: '0.06em', lineHeight: 1.05 }}>
            {recipe.title}
          </h1>

          {recipe.description && (
            <p className="font-body text-lg mb-4" style={{ color: 'var(--color-muted2)', fontWeight: 500, lineHeight: 1.6 }}>{recipe.description}</p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            {recipe.profiles?.username && (
              <span className="font-mono" style={{ fontSize: '0.65rem', color: 'var(--color-muted)', letterSpacing: '0.06em' }}>by @{recipe.profiles.username}</span>
            )}
            {totalTime > 0 && (
              <span className="flex items-center gap-1 font-mono" style={{ fontSize: '0.65rem', color: 'var(--color-muted)', letterSpacing: '0.06em' }}>
                <Clock size={12} /> {totalTime} min total
              </span>
            )}
            {recipe.prep_time ? <span className="font-mono" style={{ fontSize: '0.65rem', color: 'var(--color-muted)', letterSpacing: '0.06em' }}>{recipe.prep_time}m prep</span> : null}
            {recipe.cook_time ? <span className="font-mono" style={{ fontSize: '0.65rem', color: 'var(--color-muted)', letterSpacing: '0.06em' }}>{recipe.cook_time}m cook</span> : null}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 mb-8 flex-wrap">
            <button onClick={handleToggleSave}
              className="flex items-center gap-2 px-4 py-2 font-mono text-xs tracking-widest transition-all"
              style={{ border: '1px solid var(--color-border-strong)', color: saved ? '#b45309' : 'var(--color-muted)', background: saved ? 'rgba(180,83,9,0.08)' : 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#b45309'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border-strong)'}>
              {saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
              {saved ? 'SAVED' : 'SAVE TO VAULT'}
            </button>
            {isOwner && (
              <button onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 font-mono text-xs tracking-widest transition-all"
                style={{ border: '1px solid var(--color-border-strong)', color: 'var(--color-muted)' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#b91c1c'; e.currentTarget.style.borderColor = '#b91c1c' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-muted)'; e.currentTarget.style.borderColor = 'var(--color-border-strong)' }}>
                <Trash2 size={13} /> DELETE
              </button>
            )}
          </div>
        </motion.div>

        {/* Serving scaler */}
        <motion.div className="retro-card p-5 mb-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={15} style={{ color: '#b45309' }} />
              <span className="font-mono text-xs tracking-widest" style={{ color: 'var(--color-muted)', letterSpacing: '0.1em' }}>SERVINGS</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setServings(s => Math.max(1, s - 1))}
                className="w-8 h-8 font-display text-xl flex items-center justify-center transition-all"
                style={{ border: '1px solid var(--color-border-strong)', color: 'var(--color-ink)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#b45309'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border-strong)'}>
                -
              </button>
              <span className="font-display text-3xl" style={{ minWidth: '2.5rem', textAlign: 'center', color: '#b45309' }}>{servings}</span>
              <button onClick={() => setServings(s => s + 1)}
                className="w-8 h-8 font-display text-xl flex items-center justify-center transition-all"
                style={{ border: '1px solid var(--color-border-strong)', color: 'var(--color-ink)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#b45309'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border-strong)'}>
                +
              </button>
              {scale !== 1 && (
                <span className="font-mono text-xs" style={{ color: 'var(--color-muted)' }}>({scale.toFixed(1)}x)</span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Ingredients */}
        <motion.div className="retro-card p-6 mb-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <p className="font-mono text-xs tracking-widest mb-5" style={{ color: '#b45309', letterSpacing: '0.14em' }}>// THE PROVISIONS</p>
          <ul className="space-y-2.5">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-baseline gap-3" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                <span className="font-mono font-bold shrink-0" style={{ fontSize: '0.85rem', color: '#b45309', minWidth: '3rem' }}>
                  {scaleAmount(ing.amount, scale)} {ing.unit}
                </span>
                <span className="font-body text-base" style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{ing.item}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Steps */}
        <motion.div className="retro-card p-6 mb-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <p className="font-mono text-xs tracking-widest mb-5" style={{ color: '#b45309', letterSpacing: '0.14em' }}>// THE METHOD</p>
          <ol className="space-y-5">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="font-display shrink-0" style={{ fontSize: '1.8rem', color: '#b45309', lineHeight: 1, letterSpacing: '0.06em', minWidth: '2rem' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="font-body text-base pt-1" style={{ fontWeight: 500, color: 'var(--color-ink)', lineHeight: 1.65 }}>{step}</p>
              </li>
            ))}
          </ol>
        </motion.div>

        {/* Nutrition */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          {nutrition ? (
            <div className="retro-card p-6 mb-6">
              <div className="flex items-center gap-2 mb-5">
                <Leaf size={14} style={{ color: '#b45309' }} />
                <p className="font-mono text-xs tracking-widest" style={{ color: '#b45309', letterSpacing: '0.14em' }}>NUTRITION PER SERVING</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[['CALORIES', String(nutrition.calories)], ['PROTEIN', nutrition.protein], ['CARBS', nutrition.carbs], ['FAT', nutrition.fat], ...(nutrition.fiber ? [['FIBER', nutrition.fiber]] : []), ...(nutrition.sodium ? [['SODIUM', nutrition.sodium]] : [])].map(([label, val]) => (
                  <div key={label} className="text-center p-3" style={{ background: 'var(--color-surface2)' }}>
                    <p className="font-display" style={{ fontSize: '1.4rem', color: '#b45309', letterSpacing: '0.06em' }}>{val}</p>
                    <p className="font-mono" style={{ fontSize: '0.55rem', letterSpacing: '0.1em', color: 'var(--color-muted)', marginTop: '2px' }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : profile?.plan === 'pro' && isOwner ? (
            <button onClick={analyzeNutrition} disabled={analyzing}
              className="btn-retro btn-retro-ghost w-full py-4 font-display text-lg tracking-widest flex items-center justify-center gap-3 mb-6">
              {analyzing ? <><Loader size={16} className="animate-spin" /> ANALYZING...</> : <><Leaf size={16} /> GET NUTRITION ANALYSIS</>}
            </button>
          ) : !profile || profile.plan === 'free' ? (
            <Link to="/pricing" className="flex items-center justify-center gap-2 py-4 mb-6 font-mono text-xs tracking-widest transition-all"
              style={{ border: '1px solid rgba(180,83,9,0.3)', color: '#b45309', background: 'rgba(180,83,9,0.05)' }}>
              <Leaf size={13} /> UPGRADE TO PRO FOR NUTRITION ANALYSIS
            </Link>
          ) : null}
        </motion.div>
      </div>
    </div>
  )
}
