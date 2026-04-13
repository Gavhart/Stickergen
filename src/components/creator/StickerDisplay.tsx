import { motion } from 'framer-motion'

interface Props {
  imageData: string | null
  loading: boolean
  loadingText: string
}

export function StickerDisplay({ imageData, loading, loadingText }: Props) {
  return (
    <div className="relative w-full max-w-sm aspect-square flex items-center justify-center overflow-hidden"
      style={{
        background: 'var(--color-surface2)',
        border: imageData ? '1px solid var(--color-border-strong)' : '1px solid var(--color-border)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
      }}>
      {/* Corner brackets */}
      <div className="absolute top-2 left-2 w-5 h-5" style={{ borderTop: '2px solid #dc2626', borderLeft: '2px solid #dc2626' }} />
      <div className="absolute bottom-2 right-2 w-5 h-5" style={{ borderBottom: '2px solid #dc2626', borderRight: '2px solid #dc2626' }} />

      {loading && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-1 items-end h-9">
            {[40, 70, 100, 70, 40].map((h, i) => (
              <div key={i} className="w-1 rounded-sm" style={{
                height: `${h}%`, background: '#dc2626',
                animation: `barPulse 0.9s ease-in-out ${i * 0.12}s infinite`,
              }} />
            ))}
          </div>
          <p className="font-mono text-xs tracking-widest uppercase" style={{ color: 'var(--color-muted)', animation: 'blink 0.9s step-end infinite' }}>
            {loadingText}
          </p>
        </div>
      )}

      {!loading && !imageData && (
        <div className="text-center">
          <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--color-muted)', animation: 'blink 4s ease-in-out infinite' }}>
            [ No Output ]
          </p>
          <p className="font-mono text-xs tracking-widest" style={{ color: 'var(--color-muted2)' }}>
            AWAITING INPUT_
          </p>
        </div>
      )}

      {!loading && imageData && (
        <motion.img
          src={`data:image/png;base64,${imageData}`}
          alt="Generated sticker"
          className="w-full h-full object-contain"
          initial={{ filter: 'brightness(4) saturate(0)', scale: 1.06, skewX: -3 }}
          animate={{ filter: 'brightness(1) saturate(1)', scale: 1, skewX: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        />
      )}
    </div>
  )
}
