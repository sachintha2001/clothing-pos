import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  icon?: ReactNode
  children: ReactNode
  footer?: ReactNode
  width?: string
  className?: string
  hideClose?: boolean
}

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  width = 'w-[480px]',
  className = '',
  hideClose
}: ModalProps): React.JSX.Element | null {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 p-6 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`glass-strong animate-scale-in max-h-full overflow-y-auto rounded-3xl ${width} ${className}`}>
        {(title || !hideClose) && (
          <div className="flex items-start gap-4 px-7 pt-7">
            {icon && (
              <div className="bg-brand-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg shadow-brand-600/30">
                {icon}
              </div>
            )}
            <div className="min-w-0 flex-1">
              {title && <h2 className="font-display text-xl font-semibold text-white">{title}</h2>}
              {subtitle && <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>}
            </div>
            {!hideClose && (
              <button onClick={onClose} className="btn btn-ghost btn-icon -mt-1 -mr-2 h-9 w-9" aria-label="Close">
                <X size={16} />
              </button>
            )}
          </div>
        )}
        <div className="px-7 py-6">{children}</div>
        {footer && <div className="flex justify-end gap-3 border-t border-white/[0.06] px-7 py-5">{footer}</div>}
      </div>
    </div>
  )
}
