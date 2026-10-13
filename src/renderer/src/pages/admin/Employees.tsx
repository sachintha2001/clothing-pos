import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, UserPlus, Eye, EyeOff, ShieldCheck, ShoppingBag, Users } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import { useToast } from '../../components/ui/Toast'
import { api, errorMessage, type Employee } from '../../lib/api'
import { initials } from '../../lib/format'

const emptyForm = { username: '', password: '', role: 'CASHIER' }

const roleMeta: Record<string, { label: string; icon: typeof Users; badge: string; avatar: string }> = {
  ADMIN: {
    label: 'Admin',
    icon: ShieldCheck,
    badge: 'bg-sky-400/15 text-sky-300',
    avatar: 'from-sky-400 to-indigo-500'
  },
  CASHIER: {
    label: 'Cashier',
    icon: ShoppingBag,
    badge: 'bg-brand-500/15 text-brand-300',
    avatar: 'from-brand-500 to-blush-500'
  }
}

export default function Employees(): React.JSX.Element {
  const toast = useToast()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'CASHIER'>('ALL')
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadEmployees = async (): Promise<void> => {
    try {
      setEmployees(await api.getEmployees())
    } catch (err) {
      toast.error('Could not load employees', errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEmployees()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return employees.filter(
      (e) => (roleFilter === 'ALL' || e.role === roleFilter) && (!q || e.username.toLowerCase().includes(q))
    )
  }, [employees, query, roleFilter])

  const counts = {
    ALL: employees.length,
    ADMIN: employees.filter((e) => e.role === 'ADMIN').length,
    CASHIER: employees.filter((e) => e.role === 'CASHIER').length
  }

  const openAdd = (): void => {
    setFormData(emptyForm)
    setShowPw(false)
    setIsAdding(true)
  }

  const handleAddEmployee = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.createEmployee({ ...formData, username: formData.username.trim() })
      toast.success('Employee added', `${formData.username} can now sign in as ${formData.role.toLowerCase()}.`)
      setIsAdding(false)
      loadEmployees()
    } catch (err) {
      const msg = errorMessage(err)
      toast.error(
        'Could not add employee',
        /unique/i.test(msg) ? 'That username is already taken.' : msg
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-500" />
          <input
            id="employee-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search employees…"
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(['ALL', 'CASHIER', 'ADMIN'] as const).map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)} className={`chip ${roleFilter === r ? 'chip-active' : ''}`}>
              {r === 'ALL' ? 'All' : roleMeta[r].label}
              <span className={`rounded-full px-1.5 text-[10px] ${roleFilter === r ? 'bg-white/20' : 'bg-white/5'}`}>
                {counts[r]}
              </span>
            </button>
          ))}
        </div>
        <button id="add-employee" onClick={openAdd} className="btn btn-primary ml-auto">
          <Plus size={17} /> Add employee
        </button>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-shimmer h-[150px] rounded-3xl bg-[linear-gradient(90deg,rgb(255_255_255/0.02),rgb(255_255_255/0.06),rgb(255_255_255/0.02))] bg-[length:200%_100%]"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass flex flex-col items-center rounded-3xl py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
            <Users size={28} className="text-slate-500" />
          </div>
          <p className="font-medium text-slate-200">{employees.length === 0 ? 'No employees yet' : 'No matches'}</p>
          <p className="mb-4 text-sm text-slate-500">
            {employees.length === 0 ? 'Add a cashier so they can start making sales.' : 'Try a different filter.'}
          </p>
          {employees.length === 0 && (
            <button onClick={openAdd} className="btn btn-primary">
              <UserPlus size={16} /> Add employee
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
          {filtered.map((emp, i) => {
            const meta = roleMeta[emp.role] ?? roleMeta.CASHIER
            const Icon = meta.icon
            return (
              <div
                key={emp.id}
                style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
                className="glass animate-fade-up group relative overflow-hidden rounded-3xl p-5 transition hover:-translate-y-0.5 hover:border-white/15"
              >
                <div
                  className={`absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br opacity-15 blur-2xl transition group-hover:opacity-30 ${meta.avatar}`}
                />
                <div className="relative flex items-center gap-4">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-bold text-white shadow-lg ${meta.avatar}`}
                  >
                    {initials(emp.username)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-semibold text-white">{emp.username}</p>
                    <span className={`badge mt-1 ${meta.badge}`}>
                      <Icon size={11} /> {meta.label}
                    </span>
                  </div>
                </div>
                <div className="relative mt-5 flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs text-slate-500">
                  <span className="font-mono">ID · {emp.id.slice(0, 8)}</span>
                  <span className="flex items-center gap-1.5 text-mint-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-mint-400" /> Active
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add modal */}
      <Modal
        open={isAdding}
        onClose={() => setIsAdding(false)}
        title="New employee"
        subtitle="Create a login for a team member."
        icon={<UserPlus size={20} />}
      >
        <form id="employee-form" onSubmit={handleAddEmployee} className="space-y-4">
          <div>
            <label className="label" htmlFor="e-username">
              Username
            </label>
            <input
              id="e-username"
              required
              autoFocus
              className="input"
              placeholder="e.g. nimal"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="e-password">
              Password
            </label>
            <div className="relative">
              <input
                id="e-password"
                required
                type={showPw ? 'text' : 'password'}
                className="input pr-11"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:text-white"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <span className="label">Role</span>
            <div className="grid grid-cols-2 gap-3">
              {(['CASHIER', 'ADMIN'] as const).map((r) => {
                const m = roleMeta[r]
                const Icon = m.icon
                const active = formData.role === r
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: r })}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 text-left transition ${
                      active
                        ? 'border-brand-400/60 bg-brand-500/10 ring-4 ring-brand-500/10'
                        : 'border-white/[0.08] bg-white/[0.02] hover:border-white/15'
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white ${m.avatar}`}
                    >
                      <Icon size={16} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-white">{m.label}</span>
                      <span className="block text-[11px] text-slate-500">
                        {r === 'ADMIN' ? 'Full access' : 'POS only'}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsAdding(false)} className="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary min-w-[140px]">
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                'Create employee'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
