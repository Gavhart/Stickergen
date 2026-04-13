import { motion } from 'framer-motion'
import { STYLE_OPTIONS, type StickerStyle } from '../../lib/types'

interface Props {
  selected: StickerStyle
  onChange: (s: StickerStyle) => void
}

export function StyleSelector({ selected, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {STYLE_OPTIONS.map(opt => (
        <motion.button key={opt.id} onClick={() => onChange(opt.id)}
          whileTap={{ scale: 0.96 }}
          className="relative text-center py-2.5 px-2 transition-all cursor-pointer overflow-hidden"
          style={{
            background: selected === opt.id ? 'var(--color-red-dim)' : 'var(--color-surface2)',
            border: selected === opt.id ? '1px solid #dc2626' : '1px solid var(--color-border)',
          }}>
          {/* Active top bar */}
          {selected === opt.id && (
            <motion.div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: '#dc2626' }}
              layoutId="styleBar" transition={{ type: 'spring', damping: 25, stiffness: 400 }} />
          )}
          <span className="block font-mono text-xs mb-1" style={{ color: selected === opt.id ? '#dc2626' : 'var(--color-muted)', letterSpacing: '2px' }}>
            {opt.index}
          </span>
          <span className="block font-body font-bold text-sm uppercase tracking-wide"
            style={{ color: 'var(--color-ink)', letterSpacing: '1px' }}>
            {opt.label}
          </span>
        </motion.button>
      ))}
    </div>
  )
}
