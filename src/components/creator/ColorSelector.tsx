import { motion } from 'framer-motion'
import { COLOR_OPTIONS, type ColorMood } from '../../lib/types'

interface Props {
  selected: ColorMood
  onChange: (c: ColorMood) => void
}

const SWATCH: Record<ColorMood, string> = {
  dark: 'linear-gradient(145deg, #f4f4f5 0%, #d4d4d8 45%, #a8a29e 100%)',
  blood: 'linear-gradient(145deg, #fecaca 0%, #f87171 45%, #ef4444 100%)',
  chrome: 'linear-gradient(145deg, #fafafa 0%, #d4d4d8 40%, #e7e5e4 100%)',
  neon: 'linear-gradient(145deg, #fce7f3 0%, #22d3ee 40%, #a855f7 100%)',
  toxic: 'linear-gradient(145deg, #ecfccb 0%, #bef264 45%, #84cc16 100%)',
  void: 'linear-gradient(145deg, #ede9fe 0%, #c4b5fd 45%, #a78bfa 100%)',
  gold: 'linear-gradient(145deg, #fef9c3 0%, #fde047 45%, #facc15 100%)',
}

export function ColorSelector({ selected, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLOR_OPTIONS.map(opt => {
        const isSel = selected === opt.id
        return (
          <motion.button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            whileTap={{ scale: 0.96 }}
            className="inline-flex items-center gap-2 rounded-full pl-1.5 pr-3.5 py-1.5 font-mono text-[11px] tracking-widest uppercase transition-all border shadow-sm"
            style={{
              borderColor: isSel ? 'rgba(220, 38, 38, 0.45)' : 'rgba(14, 165, 233, 0.2)',
              color: isSel ? '#dc2626' : 'var(--color-muted)',
              background: isSel
                ? 'linear-gradient(135deg, rgba(254, 226, 226, 0.85), #fff)'
                : 'linear-gradient(180deg, #fff 0%, rgba(240, 249, 255, 0.5) 100%)',
              boxShadow: isSel ? '0 2px 10px rgba(220, 38, 38, 0.1)' : '0 1px 2px rgba(15, 23, 42, 0.04)',
            }}
          >
            <span
              className="h-6 w-6 shrink-0 rounded-full border border-white/80 shadow-inner"
              style={{ background: SWATCH[opt.id] }}
              aria-hidden
            />
            {opt.label}
          </motion.button>
        )
      })}
    </div>
  )
}
