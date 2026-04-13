import { motion } from 'framer-motion'
import { COLOR_OPTIONS, type ColorMood } from '../../lib/types'

interface Props {
  selected: ColorMood
  onChange: (c: ColorMood) => void
}

export function ColorSelector({ selected, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {COLOR_OPTIONS.map(opt => (
        <motion.button key={opt.id} onClick={() => onChange(opt.id)}
          whileTap={{ scale: 0.95 }}
          className="px-3 py-1.5 font-mono text-xs tracking-widest uppercase transition-all"
          style={{
            border: selected === opt.id ? '1px solid #dc2626' : '1px solid var(--color-border)',
            color: selected === opt.id ? '#dc2626' : 'var(--color-muted)',
            background: selected === opt.id ? 'var(--color-red-dim)' : 'transparent',
          }}>
          {opt.label}
        </motion.button>
      ))}
    </div>
  )
}
