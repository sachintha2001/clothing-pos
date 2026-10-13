import { useEffect, useState } from 'react'

export function useClock(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

export function LiveClock({ className = '' }: { className?: string }): React.JSX.Element {
  const now = useClock()
  return (
    <div className={`text-right leading-tight ${className}`}>
      <p className="font-display text-sm font-semibold text-white tabular-nums">
        {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </p>
      <p className="text-[11px] text-slate-500">
        {now.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
    </div>
  )
}
