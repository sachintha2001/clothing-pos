import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import {
  Users,
  Package,
  LayoutDashboard,
  LogOut,
  ShoppingBag,
  Wallet,
  Receipt,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Boxes
} from 'lucide-react'
import Inventory from './Inventory'
import Employees from './Employees'
import AuroraBackground from '../../components/AuroraBackground'
import Logo from '../../components/Logo'
import { LiveClock } from '../../components/LiveClock'
import { api, sellableStock, type Product, type Stats } from '../../lib/api'
import { greeting, initials, money, tileGradient } from '../../lib/format'

type Tab = 'dashboard' | 'inventory' | 'employees'

const nav: { id: Tab; label: string; icon: typeof Package; hint: string }[] = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, hint: 'Sales & insights' },
  { id: 'inventory', label: 'Inventory', icon: Package, hint: 'Products & stock' },
  { id: 'employees', label: 'Employees', icon: Users, hint: 'Staff accounts' }
]

const titles: Record<Tab, { title: string; subtitle: string }> = {
  dashboard: { title: `${greeting()}, Admin`, subtitle: 'Here’s how your store is doing today.' },
  inventory: { title: 'Inventory', subtitle: 'Manage products, pricing and stock levels.' },
  employees: { title: 'Employees', subtitle: 'Manage cashier and admin accounts.' }
}

export default function AdminDashboard(): React.JSX.Element {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  return (
    <div className="relative flex h-screen">
      <AuroraBackground intensity={0.55} />

      {/* ── Sidebar ── */}
      <aside className="flex w-[260px] shrink-0 flex-col border-r border-white/[0.06] bg-ink-950/50 p-4 backdrop-blur-xl">
        <div className="px-2 pt-2 pb-8">
          <Logo />
        </div>

        <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.2em] text-slate-600 uppercase">Menu</p>
        <nav className="space-y-1">
          {nav.map(({ id, label, icon: Icon, hint }) => {
            const active = activeTab === id
            return (
              <button
                key={id}
                id={`nav-${id}`}
                onClick={() => setActiveTab(id)}
                className={`group relative flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                  active ? 'bg-white/[0.07] text-white' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                }`}
              >
                {active && (
                  <span className="bg-brand-gradient absolute top-1/2 -left-4 h-6 w-1 -translate-y-1/2 rounded-r-full" />
                )}
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                    active
                      ? 'bg-brand-gradient text-white shadow-lg shadow-brand-600/30'
                      : 'bg-white/[0.04] group-hover:bg-white/[0.07]'
                  }`}
                >
                  <Icon size={17} />
                </span>
                <span className="leading-tight">
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="block text-[11px] text-slate-500">{hint}</span>
                </span>
              </button>
            )
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <button
            id="open-pos"
            onClick={() => navigate('/pos')}
            className="group relative w-full cursor-pointer overflow-hidden rounded-2xl p-4 text-left"
          >
            <div className="bg-brand-gradient absolute inset-0 opacity-90 transition group-hover:opacity-100" />
            <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/20 blur-xl" />
            <div className="relative">
              <ShoppingBag size={20} className="mb-2 text-white" />
              <p className="text-sm font-semibold text-white">Open POS terminal</p>
              <p className="flex items-center gap-1 text-xs text-white/75">
                Start selling <ArrowUpRight size={12} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </p>
            </div>
          </button>

          <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 text-sm font-bold text-white">
              A
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-sm font-semibold text-white">Admin</p>
              <p className="text-[11px] text-slate-500">Store manager</p>
            </div>
            <button
              id="sign-out"
              onClick={() => navigate('/')}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-coral-400"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/[0.06] bg-ink-950/30 px-8 py-5 backdrop-blur-xl">
          <div key={activeTab} className="animate-fade-up">
            <h1 className="font-display text-2xl font-semibold text-white">{titles[activeTab].title}</h1>
            <p className="text-sm text-slate-500">{titles[activeTab].subtitle}</p>
          </div>
          <LiveClock />
        </header>

        <main key={activeTab} className="animate-fade-up flex-1 overflow-y-auto p-8">
          {activeTab === 'dashboard' && <Overview onNavigate={setActiveTab} />}
          {activeTab === 'inventory' && <Inventory />}
          {activeTab === 'employees' && <Employees />}
        </main>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */

function Overview({ onNavigate }: { onNavigate: (t: Tab) => void }): React.JSX.Element {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats>({ todaysSales: 0, totalOrders: 0 })
  const [products, setProducts] = useState<Product[]>([])
  const [staffCount, setStaffCount] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    setRefreshing(true)
    try {
      const [s, p, e] = await Promise.all([api.getStats(), api.getProducts(), api.getEmployees()])
      setStats(s)
      setProducts(p)
      setStaffCount(e.length)
    } catch (err) {
      console.error(err)
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const avgOrder = stats.totalOrders ? stats.todaysSales / stats.totalOrders : 0
  const lowStock = products
    .filter((p) => sellableStock(p) <= 10)
    .sort((a, b) => sellableStock(a) - sellableStock(b))
  const categories = new Set(products.map((p) => p.category)).size

  const cards = [
    {
      label: 'Today’s revenue',
      value: money(stats.todaysSales),
      icon: Wallet,
      accent: 'from-mint-400 to-emerald-600',
      glow: 'bg-mint-500'
    },
    {
      label: 'Orders today',
      value: stats.totalOrders.toString(),
      icon: Receipt,
      accent: 'from-brand-500 to-blush-500',
      glow: 'bg-brand-500'
    },
    {
      label: 'Average order',
      value: money(avgOrder),
      icon: TrendingUp,
      accent: 'from-sky-400 to-indigo-500',
      glow: 'bg-sky-500'
    },
    {
      label: 'Low stock items',
      value: lowStock.length.toString(),
      icon: AlertTriangle,
      accent: 'from-amber-400 to-orange-500',
      glow: 'bg-amber-500'
    }
  ]

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-5 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, accent, glow }, i) => (
          <div
            key={label}
            style={{ animationDelay: `${i * 60}ms` }}
            className="glass animate-fade-up group relative overflow-hidden rounded-3xl p-5 transition hover:-translate-y-0.5 hover:border-white/15"
          >
            <div className={`absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-20 blur-3xl transition group-hover:opacity-35 ${glow}`} />
            <div className="relative flex items-start justify-between">
              <p className="text-sm text-slate-400">{label}</p>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg ${accent}`}
              >
                <Icon size={18} />
              </div>
            </div>
            <p className="font-display relative mt-4 text-3xl font-bold tracking-tight text-white tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Low stock */}
        <div className="glass animate-fade-up rounded-3xl p-6 [animation-delay:200ms] xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold text-white">Stock alerts</h3>
              <p className="text-sm text-slate-500">Products with 10 or fewer units left</p>
            </div>
            <button onClick={load} className="btn btn-ghost btn-icon h-9 w-9" title="Refresh">
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>

          {lowStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-12 text-center">
              <Boxes size={30} className="mb-3 text-mint-400" />
              <p className="font-medium text-slate-200">All stocked up</p>
              <p className="text-sm text-slate-500">No products are running low right now.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {lowStock.slice(0, 6).map((p) => {
                const s = sellableStock(p)
                const pct = Math.min(100, (s / 10) * 100)
                return (
                  <li key={p.id} className="flex items-center gap-4 rounded-2xl bg-white/[0.02] p-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                      style={{ background: tileGradient(p.category) }}
                    >
                      {initials(p.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex justify-between text-sm">
                        <span className="truncate font-medium text-white">{p.name}</span>
                        <span className={s === 0 ? 'text-coral-400' : 'text-sun-400'}>
                          {s === 0 ? 'Out of stock' : `${s} left`}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                        <div
                          className={`h-full rounded-full ${s === 0 ? 'bg-coral-400' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}
                          style={{ width: `${Math.max(pct, 4)}%` }}
                        />
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Store snapshot + quick actions */}
        <div className="space-y-5">
          <div className="glass animate-fade-up rounded-3xl p-6 [animation-delay:260ms]">
            <h3 className="font-display mb-4 text-lg font-semibold text-white">Store snapshot</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                ['Products', products.length],
                ['Categories', categories],
                ['Staff', staffCount]
              ].map(([l, v]) => (
                <div key={l} className="rounded-2xl bg-white/[0.03] p-3">
                  <p className="font-display text-2xl font-bold text-white">{v}</p>
                  <p className="text-[11px] text-slate-500">{l}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-mint-500/10 px-3 py-2 text-xs text-mint-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-mint-400" />
              System online · database connected
            </div>
          </div>

          <div className="glass animate-fade-up rounded-3xl p-6 [animation-delay:320ms]">
            <h3 className="font-display mb-4 text-lg font-semibold text-white">Quick actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Add a product', icon: Package, onClick: () => onNavigate('inventory') },
                { label: 'Add an employee', icon: Users, onClick: () => onNavigate('employees') },
                { label: 'Open POS terminal', icon: ShoppingBag, onClick: () => navigate('/pos') }
              ].map(({ label, icon: Icon, onClick }) => (
                <button
                  key={label}
                  onClick={onClick}
                  className="group flex w-full cursor-pointer items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5 text-sm text-slate-300 transition hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
                >
                  <Icon size={16} className="text-brand-300" />
                  {label}
                  <ArrowUpRight
                    size={14}
                    className="ml-auto text-slate-600 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
