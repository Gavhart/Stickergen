import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, Users, Bookmark, BookmarkCheck, Flame } from 'lucide-react'
import type { Recipe } from '../../lib/types'

interface Props {
  recipe: Recipe
  index?: number
  saved?: boolean
  onToggleSave?: (id: string, saved: boolean) => void
  showAuthor?: boolean
}

export function RecipeCard({ recipe, index = 0, saved = false, onToggleSave, showAuthor = true }: Props) {
  const totalTime = (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0)

  return (
    <motion.div
      className="smoke-card group flex flex-col"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ borderColor: '#b45309', boxShadow: '3px 3px 0 rgba(180,83,9,0.12)' }}
    >
      {/* Color band based on source */}
      <div style={{ height: '3px', background: recipe.source === 'ai' ? 'linear-gradient(90deg,#b45309,#b91c1c)' : '#6b6058' }} />

      <div className="p-5 flex flex-col flex-1">
        {/* Tags row */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {recipe.source === 'ai' && (
            <span className="flex items-center gap-1 font-mono" style={{ fontSize: '0.55rem', letterSpacing: '0.1em', color: '#b45309', background: 'rgba(180,83,9,0.08)', padding: '2px 6px', border: '1px solid rgba(180,83,9,0.2)' }}>
              <Flame size={9} /> AI
            </span>
          )}
          {(recipe.tags ?? []).slice(0, 2).map(tag => (
            <span key={tag} className="font-mono" style={{ fontSize: '0.55rem', letterSpacing: '0.08em', color: 'var(--color-muted)', background: 'var(--color-surface2)', padding: '2px 6px' }}>
              {tag.toUpperCase()}
            </span>
          ))}
        </div>

        {/* Title */}
        <Link to={`/recipe/${recipe.id}`} className="flex-1">
          <h3 className="font-display mb-1 transition-colors group-hover:text-amber-700"
            style={{ fontSize: '1.4rem', letterSpacing: '0.08em', lineHeight: 1.15, color: 'var(--color-ink)' }}>
            {recipe.title}
          </h3>
        </Link>

        {/* Description */}
        {recipe.description && (
          <p className="font-body text-sm mb-4 line-clamp-2" style={{ color: 'var(--color-muted2)', lineHeight: 1.5, fontWeight: 500 }}>
            {recipe.description}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center justify-between mt-auto pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-3">
            {totalTime > 0 && (
              <span className="flex items-center gap-1 font-mono" style={{ fontSize: '0.6rem', color: 'var(--color-muted)', letterSpacing: '0.06em' }}>
                <Clock size={11} /> {totalTime}m
              </span>
            )}
            <span className="flex items-center gap-1 font-mono" style={{ fontSize: '0.6rem', color: 'var(--color-muted)', letterSpacing: '0.06em' }}>
              <Users size={11} /> {recipe.servings}
            </span>
            {showAuthor && recipe.profiles?.username && (
              <span className="font-mono" style={{ fontSize: '0.6rem', color: 'var(--color-muted)', letterSpacing: '0.06em' }}>
                @{recipe.profiles.username}
              </span>
            )}
          </div>

          {onToggleSave && (
            <button
              onClick={e => { e.preventDefault(); onToggleSave(recipe.id, saved) }}
              className="p-1 transition-all"
              style={{ color: saved ? '#b45309' : 'var(--color-muted)' }}
              onMouseEnter={e => e.currentTarget.style.color = '#b45309'}
              onMouseLeave={e => e.currentTarget.style.color = saved ? '#b45309' : 'var(--color-muted)'}
            >
              {saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
