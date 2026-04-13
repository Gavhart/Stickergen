import { motion } from 'framer-motion'
import { COLOR_OPTIONS, type ColorMood } from '../../lib/types'

interface Props {
  selected: ColorMood
  onChange: (c: ColorMood) => void
}

const SWATCH: Record<ColorMood, string> = {
  dark: 'linear-gradient(145deg, #18181b 0%, #3f3f46 100%)',
  blood: 'linear-gradient(145deg, #7f1d1d 0%, #ef4444 100%)',
  chrome: 'linear-gradient(145deg, #d4d4d8 0%, #71717a 55%, #e4e4e7 100%)',
  neon: 'linear-gradient(145deg, #0e7490 0%, #22d3ee 50%, #a855f7 100%)',
  toxic: 'linear-gradient(145deg, #3f6212 0%, #84cc16 55%, #bef264 100%)',
  void: 'linear-gradient(145deg, #3b0764 0%, #7c3aed 55%, #c084fc 100%)',
  gold: 'linear-gradient(145deg, #713f12 0%, #eab308 55%, #fde68a 100%)',
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
