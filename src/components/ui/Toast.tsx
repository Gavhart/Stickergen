import { AnimatePresence, motion } from 'framer-motion'
import { useToast } from '../../context/ToastContext'

export function ToastContainer() {
  const { toasts } = useToast()
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id}
            className="font-mono text-xs tracking-widest uppercase px-6 py-3 whitespace-nowrap"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderLeft: '3px solid #dc2626', color: 'var(--color-ink)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}>
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
