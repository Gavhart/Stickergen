import { motion } from 'framer-motion'
import { STYLE_OPTIONS, type StickerStyle } from '../../lib/types'

interface Props {
  selected: StickerStyle
  onChange: (s: StickerStyle) => void
}

export function StyleSelector({ selected, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {STYLE_OPTIONS.map(opt => {
        const isSel = selected === opt.id
        return (
          <motion.button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            whileTap={{ scale: 0.97 }}
            className="relative text-center rounded-2xl py-3 px-2 transition-all cursor-pointer overflow-hidden border shadow-sm"
            style={{
              borderColor: isSel ? 'rgba(220, 38, 38, 0.45)' : 'rgba(16, 185, 129, 0.22)',
              background: isSel
                ? 'linear-gradient(165deg, rgba(254, 226, 226, 0.95) 0%, #fff 55%)'
                : 'linear-gradient(180deg, #fff 0%, rgba(236, 253, 245, 0.65) 100%)',
              boxShadow: isSel
                ? '0 4px 16px rgba(220, 38, 38, 0.12)'
                : '0 1px 3px rgba(15, 23, 42, 0.05)',
            }}
          >
            {isSel && (
              <motion.div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                style={{ background: 'linear-gradient(90deg, #dc2626, #f87171)' }}
                layoutId="styleBar"
                transition={{ type: 'spring', damping: 28, stiffness: 380 }}
              />
            )}
            <span
              className="block font-mono text-[10px] mb-1 font-bold"
              style={{
                color: isSel ? '#dc2626' : 'rgba(5, 150, 105, 0.75)',
                letterSpacing: '0.2em',
              }}
            >
              {opt.index}
            </span>
            <span
              className="block font-body font-bold text-sm uppercase tracking-wide"
              style={{ color: 'var(--color-ink)', letterSpacing: '0.04em' }}
            >
              {opt.label}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
