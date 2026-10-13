import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

type ToastKind = 'success' | 'error' | 'info'
interface ToastItem {
  id: number
  kind: ToastKind
  title: string
  message?: string
}

interface ToastApi {
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const styles: Record<ToastKind, { icon: typeof Info; ring: string; iconCls: string }> = {
  success: { icon: CheckCircle2, ring: 'before:bg-mint-400', iconCls: 'text-mint-400' },
  error: { icon: AlertTriangle, ring: 'before:bg-coral-400', iconCls: 'text-coral-400' },
  info: { icon: Info, ring: 'before:bg-brand-400', iconCls: 'text-brand-300' }
}

let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const push = useCallback(
    (kind: ToastKind, title: string, message?: string) => {
      const id = nextId++
      setToasts((t) => [...t.slice(-3), { id, kind, title, message }])
      setTimeout(() => dismiss(id), kind === 'error' ? 6000 : 3500)
    },
    [dismiss]
  )

  const api: ToastApi = {
    success: (t, m) => push('success', t, m),
    error: (t, m) => push('error', t, m),
    info: (t, m) => push('info', t, m)
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-5 bottom-5 z-[100] flex w-[360px] flex-col gap-2.5 print:hidden">
        {toasts.map((t) => {
          const s = styles[t.kind]
          const Icon = s.icon
          return (
            <div
              key={t.id}
              role="status"
              className={`glass-strong animate-slide-in-right pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-2xl p-4 pl-5 before:absolute before:inset-y-0 before:left-0 before:w-1 ${s.ring}`}
            >
              <Icon size={20} className={`mt-0.5 shrink-0 ${s.iconCls}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{t.title}</p>
                {t.message && <p className="mt-0.5 text-xs break-words text-slate-400">{t.message}</p>}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="rounded-md p-1 text-slate-500 transition hover:bg-white/5 hover:text-slate-200"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
