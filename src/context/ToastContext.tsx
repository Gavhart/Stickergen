import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface Toast { id: number; message: string }
interface ToastContextValue { showToast: (msg: string) => void; toasts: Toast[] }

const ToastContext = createContext<ToastContextValue>({ showToast: () => {}, toasts: [] })

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const showToast = useCallback((message: string) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2800)
  }, [])
  return (
    <ToastContext.Provider value={{ showToast, toasts }}>
      {children}
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
