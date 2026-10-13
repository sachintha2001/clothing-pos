import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag, ShieldCheck, ArrowRight, Sparkles, Zap, BarChart3, Package } from 'lucide-react'
import AuroraBackground from '../components/AuroraBackground'
import Logo from '../components/Logo'
import { useClock } from '../components/LiveClock'
import { greeting } from '../lib/format'

const roles = [
  {
    key: '1',
    to: '/pos',
    title: 'Cashier',
    subtitle: 'Open the POS terminal and start selling',
    icon: ShoppingBag,
    accent: 'from-brand-500 to-blush-500',
    glow: 'group-hover:shadow-brand-600/30'
  },
  {
    key: '2',
    to: '/admin',
    title: 'Administrator',
    subtitle: 'Manage inventory, staff & sales insights',
    icon: ShieldCheck,
    accent: 'from-sky-400 to-indigo-500',
    glow: 'group-hover:shadow-sky-500/25'
  }
]

const features = [
  { icon: Zap, label: 'Lightning-fast checkout' },
  { icon: Package, label: 'Live stock tracking' },
  { icon: BarChart3, label: 'Daily sales insights' }
]

export default function Login(): React.JSX.Element {
  const navigate = useNavigate()
  const now = useClock()

  // Keyboard shortcuts: 1 → Cashier, 2 → Admin
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const r = roles.find((x) => x.key === e.key)
      if (r) navigate(r.to)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  return (
    <div className="relative flex h-screen w-full overflow-hidden">
      <AuroraBackground intensity={1.2} />

      {/* Left — brand hero */}
      <section className="relative hidden flex-1 flex-col justify-between p-12 lg:flex">
        <div className="animate-fade-up">
          <Logo size="lg" />
        </div>

        <div className="max-w-xl">
          <div className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 backdrop-blur [animation-delay:80ms]">
            <Sparkles size={14} className="text-sun-400" />
            Smart retail, beautifully simple
          </div>
          <h1 className="animate-fade-up font-display text-6xl leading-[1.05] font-bold tracking-tight text-white [animation-delay:140ms]">
            Sell style.
            <br />
            <span className="text-gradient">Not spreadsheets.</span>
          </h1>
          <p className="animate-fade-up mt-6 max-w-md text-lg leading-relaxed text-slate-400 [animation-delay:200ms]">
            Everything your clothing store needs — checkout, stock and staff — in one fast, focused workspace.
          </p>

          <div className="animate-fade-up mt-10 flex flex-wrap gap-3 [animation-delay:260ms]">
            {features.map(({ icon: Icon, label }) => (
              <div key={label} className="glass flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm text-slate-300">
                <Icon size={16} className="text-brand-300" />
                {label}
              </div>
            ))}
          </div>
        </div>

        <p className="animate-fade-up text-xs text-slate-600 [animation-delay:320ms]">
          © {now.getFullYear()} ThreadsPOS · v1.0.0
        </p>
      </section>

      {/* Right — role picker */}
      <section className="relative flex w-full items-center justify-center p-8 lg:w-[540px] lg:p-12">
        <div className="glass-strong animate-scale-in w-full max-w-[440px] rounded-[28px] p-9">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <p className="font-display text-5xl font-semibold text-white tabular-nums">
            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>

          <div className="my-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <h2 className="font-display text-2xl font-semibold text-white">{greeting(now)} 👋</h2>
          <p className="mt-1 text-sm text-slate-400">Choose how you’d like to sign in.</p>

          <div className="mt-6 space-y-3">
            {roles.map(({ key, to, title, subtitle, icon: Icon, accent, glow }, i) => (
              <button
                key={to}
                id={`login-${title.toLowerCase()}`}
                onClick={() => navigate(to)}
                style={{ animationDelay: `${150 + i * 80}ms` }}
                className={`group animate-fade-up relative flex w-full cursor-pointer items-center gap-4 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.06] hover:shadow-2xl active:scale-[0.99] ${glow}`}
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-4deg] ${accent}`}
                >
                  <Icon size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">{title}</p>
                  <p className="truncate text-xs text-slate-400">{subtitle}</p>
                </div>
                <span className="kbd">{key}</span>
                <ArrowRight
                  size={18}
                  className="text-slate-500 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white"
                />
              </button>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-slate-600">
            Tip: press <span className="kbd">1</span> or <span className="kbd">2</span> to jump straight in
          </p>
        </div>
      </section>
    </div>
  )
}
