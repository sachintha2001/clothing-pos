import { Shirt } from 'lucide-react'

export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }): React.JSX.Element {
  const box = { sm: 'h-9 w-9 rounded-xl', md: 'h-10 w-10 rounded-xl', lg: 'h-14 w-14 rounded-2xl' }[size]
  const icon = { sm: 18, md: 20, lg: 28 }[size]
  const text = { sm: 'text-base', md: 'text-lg', lg: 'text-2xl' }[size]

  return (
    <div className="flex items-center gap-3">
      <div
        className={`bg-brand-gradient relative flex items-center justify-center text-white shadow-lg shadow-brand-600/40 ${box}`}
      >
        <Shirt size={icon} strokeWidth={2.2} />
        <span className="absolute inset-0 rounded-[inherit] ring-1 ring-white/25 ring-inset" />
      </div>
      <div className="leading-tight">
        <p className={`font-display font-bold tracking-tight text-white ${text}`}>
          Threads<span className="text-gradient">POS</span>
        </p>
        {size !== 'sm' && <p className="text-[11px] font-medium tracking-[0.18em] text-slate-500 uppercase">Clothing Store</p>}
      </div>
    </div>
  )
}
