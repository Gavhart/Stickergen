import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Flame, PenLine, Plus, Trash2, Loader } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { createRecipe } from '../lib/supabase'
import { RECIPE_TAGS, CUISINE_SUGGESTIONS, FREE_AI_LIMIT, type Ingredient } from '../lib/types'
import { AuthModal } from '../components/auth/AuthModal'

type Mode = 'ai' | 'manual'

const EMPTY_INGREDIENT: Ingredient = { amount: '', unit: '', item: '' }

function blankRecipe() {
  return {
    title: '',
    description: '',
    servings: 4,
    prep_time: 0,
    cook_time: 0,
    tags: [] as string[],
    ingredients: [{ ...EMPTY_INGREDIENT }] as Ingredient[],
    steps: [''] as string[],
    is_public: true,
    source: 'manual' as const,
    nutrition: null,
    image_url: null,
  }
}

export function CreateRecipePage() {
  const { user, profile } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [mode, setMode] = useState<Mode>('ai')
  const [aiPrompt, setAiPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [form, setForm] = useState(blankRecipe())
  const [generated, setGenerated] = useState(false)

  const aiUsesLeft = profile ? (profile.plan === 'pro' ? Infinity : Math.max(0, FREE_AI_LIMIT - (profile.ai_uses_today ?? 0))) : FREE_AI_LIMIT

  const fireUpAI = async () => {
    if (!user) { setShowAuth(true); return }
    if (!aiPrompt.trim()) { showToast('ERR: DESCRIBE YOUR DISH FIRST'); return }
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, userId: user.id }),
      })
      const data = await res.json() as { recipe?: typeof form; error?: string }
      if (!res.ok || !data.recipe) throw new Error(data.error ?? 'Generation failed')
      setForm({ ...blankRecipe(), ...data.recipe, source: 'ai', is_public: true, nutrition: null, image_url: null })
      setGenerated(true)
      showToast('RECIPE GENERATED — REVIEW AND SAVE')
    } catch (e) {
      showToast('ERR: ' + (e instanceof Error ? e.message : 'Generation failed'))
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!user) { setShowAuth(true); return }
    if (!form.title.trim()) { showToast('ERR: RECIPE NEEDS A TITLE'); return }
    if (form.ingredients.length === 0 || !form.ingredients[0].item) { showToast('ERR: ADD AT LEAST ONE INGREDIENT'); return }
    if (form.steps.length === 0 || !form.steps[0]) { showToast('ERR: ADD AT LEAST ONE STEP'); return }
    setSaving(true)
    const { data, error } = await createRecipe(user.id, form)
    setSaving(false)
    if (error || !data) { showToast('ERR: SAVE FAILED'); return }
    showToast('RECIPE ADDED TO THE VAULT')
    navigate(`/recipe/${data.id}`)
  }

  const addIngredient = () => setForm(f => ({ ...f, ingredients: [...f.ingredients, { ...EMPTY_INGREDIENT }] }))
  const updateIngredient = (i: number, field: keyof Ingredient, val: string) =>
    setForm(f => { const ing = [...f.ingredients]; ing[i] = { ...ing[i], [field]: val }; return { ...f, ingredients: ing } })
  const removeIngredient = (i: number) =>
    setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, j) => j !== i) }))

  const addStep = () => setForm(f => ({ ...f, steps: [...f.steps, ''] }))
  const updateStep = (i: number, val: string) =>
    setForm(f => { const steps = [...f.steps]; steps[i] = val; return { ...f, steps } })
  const removeStep = (i: number) =>
    setForm(f => ({ ...f, steps: f.steps.filter((_, j) => j !== i) }))

  const toggleTag = (tag: string) =>
    setForm(f => ({ ...f, tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag] }))

  if (!user) {
    return (
      <div className="grid-bg scanlines corner-glow min-h-screen flex items-center justify-center px-6">
        <motion.div className="retro-card max-w-md w-full text-center p-10" style={{ background: 'var(--color-surface)' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="font-mono text-xs tracking-widest mb-3" style={{ color: '#b91c1c' }}>// ACCESS RESTRICTED</p>
          <h2 className="font-display mb-4" style={{ fontSize: '3.5rem', letterSpacing: '0.1em' }}>SIGN IN<span style={{ color: '#b91c1c' }}>.</span></h2>
          <p className="font-mono text-xs leading-loose mb-8" style={{ color: 'var(--color-muted)' }}>Create a free account to start building your recipe vault.</p>
          <button onClick={() => setShowAuth(true)} className="btn-retro btn-retro-primary w-full py-4 font-display text-xl tracking-widest">
            CREATE ACCOUNT / SIGN IN
          </button>
        </motion.div>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </div>
    )
  }

  return (
    <div className="grid-bg scanlines corner-glow min-h-screen">
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-10">

        {/* Header */}
        <motion.div className="mb-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="font-mono text-xs tracking-widest mb-2" style={{ color: '#b45309' }}>// RECIPE FORGE</p>
          <h1 className="font-display leading-none" style={{ fontSize: 'clamp(3rem, 10vw, 6rem)', letterSpacing: '0.06em' }}>
            FIRE IT UP<span style={{ color: '#b91c1c' }}>.</span>
          </h1>
        </motion.div>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-8">
          {(['ai', 'manual'] as Mode[]).map(m => (
            <button key={m} onClick={() => { setMode(m); setGenerated(false) }}
              className="px-6 py-2.5 font-display text-xl tracking-widest transition-all"
              style={{
                background: mode === m ? '#b45309' : 'transparent',
                color: mode === m ? 'white' : 'var(--color-muted2)',
                border: mode === m ? '1px solid #92400e' : '1px solid var(--color-border-strong)',
                boxShadow: mode === m ? '3px 3px 0 rgba(0,0,0,0.2)' : 'none',
              }}>
              {m === 'ai' ? 'PITMASTER AI' : 'BUILD YOUR OWN'}
            </button>
          ))}
          {profile?.plan === 'free' && mode === 'ai' && (
            <span className="font-mono text-xs self-center ml-2" style={{ color: 'var(--color-muted)' }}>
              {aiUsesLeft === 0 ? '— limit reached today' : `${aiUsesLeft} of ${FREE_AI_LIMIT} left today`}
            </span>
          )}
        </div>

        {/* AI MODE */}
        <AnimatePresence mode="wait">
        {mode === 'ai' && !generated && (
          <motion.div key="ai-input" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="retro-card p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Flame size={16} style={{ color: '#b45309' }} />
                <span className="font-mono text-xs tracking-widest" style={{ color: '#b45309' }}>PITMASTER AI — DESCRIBE YOUR DISH</span>
              </div>
              <textarea
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                rows={4}
                placeholder="e.g. slow-smoked brisket with a dry rub, low and slow for 12 hours..."
                className="w-full px-4 py-3 font-body font-semibold text-base outline-none resize-none transition-all"
                style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border-strong)', color: 'var(--color-ink)', lineHeight: 1.6 }}
                onFocus={e => e.currentTarget.style.borderColor = '#b45309'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border-strong)'}
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) fireUpAI() }}
              />
              <div className="flex flex-wrap gap-2 mt-3">
                {CUISINE_SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => setAiPrompt(s)}
                    className="font-mono px-2.5 py-1 transition-all"
                    style={{ fontSize: '0.6rem', letterSpacing: '0.06em', color: 'var(--color-muted)', background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#b45309'; e.currentTarget.style.color = '#b45309' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-muted)' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={fireUpAI} disabled={generating || aiUsesLeft === 0}
              className="btn-retro btn-retro-amber w-full py-5 font-display text-2xl tracking-widest flex items-center justify-center gap-3">
              {generating ? <><Loader size={20} className="animate-spin" /> FIRING UP THE PIT...</> : <><Flame size={20} /> FIRE IT UP</>}
            </button>
            {aiUsesLeft === 0 && profile?.plan === 'free' && (
              <p className="text-center font-mono text-xs mt-3" style={{ color: '#b45309' }}>
                Daily limit reached — <a href="/pricing" style={{ textDecoration: 'underline' }}>upgrade to Pro</a> for unlimited
              </p>
            )}
          </motion.div>
        )}
        </AnimatePresence>

        {/* RECIPE FORM — shown after AI generation or in manual mode */}
        {(mode === 'manual' || generated) && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {generated && (
              <div className="flex items-center gap-3 p-3 font-mono text-xs" style={{ background: 'rgba(180,83,9,0.08)', border: '1px solid rgba(180,83,9,0.25)', color: '#b45309', letterSpacing: '0.06em' }}>
                <Flame size={13} /> PITMASTER AI GENERATED THIS RECIPE — REVIEW AND EDIT BEFORE SAVING
              </div>
            )}

            {/* Title + description */}
            <div className="retro-card p-6 space-y-4">
              <p className="font-mono text-xs tracking-widest" style={{ color: 'var(--color-muted)' }}>// THE DISH</p>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Recipe title..."
                className="w-full px-4 py-3 font-display text-2xl tracking-wide outline-none transition-all"
                style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border-strong)', color: 'var(--color-ink)', letterSpacing: '0.08em' }}
                onFocus={e => e.currentTarget.style.borderColor = '#b45309'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border-strong)'}
              />
              <textarea value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Short description of the dish..."
                rows={2} className="w-full px-4 py-3 font-body text-base outline-none resize-none transition-all"
                style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border-strong)', color: 'var(--color-ink)', fontWeight: 500 }}
                onFocus={e => e.currentTarget.style.borderColor = '#b45309'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border-strong)'}
              />
            </div>

            {/* Times + servings */}
            <div className="retro-card p-6">
              <p className="font-mono text-xs tracking-widest mb-4" style={{ color: 'var(--color-muted)' }}>// THE CLOCK</p>
              <div className="grid grid-cols-3 gap-4">
                {[['PREP', 'prep_time'], ['COOK', 'cook_time'], ['SERVES', 'servings']].map(([label, key]) => (
                  <div key={key}>
                    <p className="font-mono mb-1" style={{ fontSize: '0.6rem', letterSpacing: '0.1em', color: 'var(--color-muted)' }}>{label} {key !== 'servings' ? '(min)' : ''}</p>
                    <input type="number" min={0}
                      value={form[key as keyof typeof form] as number}
                      onChange={e => setForm(f => ({ ...f, [key]: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 font-mono text-center outline-none transition-all"
                      style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border-strong)', color: 'var(--color-ink)', fontSize: '1rem' }}
                      onFocus={e => e.currentTarget.style.borderColor = '#b45309'}
                      onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border-strong)'}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Ingredients */}
            <div className="retro-card p-6">
              <p className="font-mono text-xs tracking-widest mb-4" style={{ color: 'var(--color-muted)' }}>// THE PROVISIONS</p>
              <div className="space-y-2">
                {form.ingredients.map((ing, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input value={ing.amount} onChange={e => updateIngredient(i, 'amount', e.target.value)}
                      placeholder="2" className="w-16 px-2 py-2 font-mono text-sm text-center outline-none transition-all"
                      style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border-strong)', color: 'var(--color-ink)' }}
                      onFocus={e => e.currentTarget.style.borderColor = '#b45309'}
                      onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border-strong)'}
                    />
                    <input value={ing.unit} onChange={e => updateIngredient(i, 'unit', e.target.value)}
                      placeholder="cups" className="w-20 px-2 py-2 font-mono text-sm outline-none transition-all"
                      style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border-strong)', color: 'var(--color-ink)' }}
                      onFocus={e => e.currentTarget.style.borderColor = '#b45309'}
                      onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border-strong)'}
                    />
                    <input value={ing.item} onChange={e => updateIngredient(i, 'item', e.target.value)}
                      placeholder="ingredient" className="flex-1 px-3 py-2 font-body font-semibold text-base outline-none transition-all"
                      style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border-strong)', color: 'var(--color-ink)' }}
                      onFocus={e => e.currentTarget.style.borderColor = '#b45309'}
                      onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border-strong)'}
                    />
                    <button onClick={() => removeIngredient(i)} style={{ color: 'var(--color-muted)' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#b91c1c'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={addIngredient} className="mt-3 flex items-center gap-2 font-mono text-xs tracking-widest transition-all"
                style={{ color: '#b45309' }}
                onMouseEnter={e => e.currentTarget.style.color = '#92400e'}
                onMouseLeave={e => e.currentTarget.style.color = '#b45309'}>
                <Plus size={13} /> ADD INGREDIENT
              </button>
            </div>

            {/* Steps */}
            <div className="retro-card p-6">
              <p className="font-mono text-xs tracking-widest mb-4" style={{ color: 'var(--color-muted)' }}>// THE METHOD</p>
              <div className="space-y-3">
                {form.steps.map((step, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="font-display mt-2 shrink-0" style={{ fontSize: '1.3rem', color: '#b45309', letterSpacing: '0.1em', lineHeight: 1 }}>{String(i + 1).padStart(2, '0')}</span>
                    <textarea value={step} onChange={e => updateStep(i, e.target.value)}
                      placeholder={`Step ${i + 1}...`} rows={2}
                      className="flex-1 px-3 py-2 font-body text-base outline-none resize-none transition-all"
                      style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border-strong)', color: 'var(--color-ink)', fontWeight: 500 }}
                      onFocus={e => e.currentTarget.style.borderColor = '#b45309'}
                      onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border-strong)'}
                    />
                    <button onClick={() => removeStep(i)} className="mt-2" style={{ color: 'var(--color-muted)' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#b91c1c'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={addStep} className="mt-3 flex items-center gap-2 font-mono text-xs tracking-widest transition-all"
                style={{ color: '#b45309' }}
                onMouseEnter={e => e.currentTarget.style.color = '#92400e'}
                onMouseLeave={e => e.currentTarget.style.color = '#b45309'}>
                <Plus size={13} /> ADD STEP
              </button>
            </div>

            {/* Tags */}
            <div className="retro-card p-6">
              <p className="font-mono text-xs tracking-widest mb-4" style={{ color: 'var(--color-muted)' }}>// TAGS</p>
              <div className="flex flex-wrap gap-2">
                {RECIPE_TAGS.map(tag => {
                  const active = form.tags.includes(tag)
                  return (
                    <button key={tag} onClick={() => toggleTag(tag)}
                      className="font-mono px-3 py-1 transition-all"
                      style={{ fontSize: '0.62rem', letterSpacing: '0.08em', background: active ? '#b45309' : 'var(--color-surface2)', color: active ? 'white' : 'var(--color-muted)', border: active ? '1px solid #92400e' : '1px solid var(--color-border)' }}>
                      {tag}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Visibility */}
            <div className="flex items-center gap-4 p-4" style={{ border: '1px solid var(--color-border)' }}>
              <PenLine size={14} style={{ color: 'var(--color-muted)' }} />
              <div className="flex gap-3">
                {[true, false].map(pub => (
                  <button key={String(pub)} onClick={() => setForm(f => ({ ...f, is_public: pub }))}
                    className="px-4 py-1.5 font-mono text-xs tracking-widest transition-all"
                    style={{ background: form.is_public === pub ? 'var(--color-ink)' : 'transparent', color: form.is_public === pub ? 'white' : 'var(--color-muted)', border: '1px solid var(--color-border-strong)' }}>
                    {pub ? 'PUBLIC — SHARE TO THE PIT' : 'PRIVATE — VAULT ONLY'}
                  </button>
                ))}
              </div>
            </div>

            {/* Save button */}
            <button onClick={handleSave} disabled={saving}
              className="btn-retro btn-retro-primary w-full py-5 font-display text-2xl tracking-widest">
              {saving ? 'SAVING TO THE VAULT...' : 'ADD TO THE VAULT'}
            </button>

            {generated && (
              <button onClick={() => { setGenerated(false); setForm(blankRecipe()) }}
                className="w-full py-3 font-mono text-xs tracking-widest transition-all"
                style={{ color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#b45309'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
                START OVER — FIRE UP A NEW RECIPE
              </button>
            )}
          </motion.div>
        )}
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}
