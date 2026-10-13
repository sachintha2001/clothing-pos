import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  ArrowLeft,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Printer,
  Search,
  X,
  Banknote,
  CreditCard,
  PackageOpen,
  Check,
  RotateCcw,
  ScanBarcode
} from 'lucide-react'
import AuroraBackground from '../../components/AuroraBackground'
import Logo from '../../components/Logo'
import { LiveClock } from '../../components/LiveClock'
import { useToast } from '../../components/ui/Toast'
import { api, errorMessage, sellableStock, type PaymentType, type Product } from '../../lib/api'
import { initials, money, tileGradient } from '../../lib/format'

interface CartItem extends Product {
  quantity: number
}

interface Receipt {
  id: string
  items: CartItem[]
  total: number
  date: string
  paymentType: PaymentType
  tendered: number
  change: number
}

export default function POSDashboard(): React.JSX.Element {
  const navigate = useNavigate()
  const toast = useToast()
  const searchRef = useRef<HTMLInputElement>(null)

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [paymentType, setPaymentType] = useState<PaymentType>('CASH')
  const [tendered, setTendered] = useState('')
  const [processing, setProcessing] = useState(false)
  const [receiptData, setReceiptData] = useState<Receipt | null>(null)
  const [bump, setBump] = useState(0)

  const loadProducts = useCallback(async () => {
    try {
      setProducts(await api.getProducts())
    } catch (err) {
      toast.error('Could not load products', errorMessage(err))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // ── Derived data ────────────────────────────────────────────
  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    products.forEach((p) => counts.set(p.category, (counts.get(p.category) ?? 0) + 1))
    return [['All', products.length] as const, ...[...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))]
  }, [products])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter(
      (p) =>
        (category === 'All' || p.category === category) &&
        (!q ||
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.variants.some((v) => v.sku.toLowerCase().includes(q)))
    )
  }, [products, query, category])

  const itemCount = cart.reduce((n, i) => n + i.quantity, 0)
  const cartTotal = cart.reduce((total, item) => total + item.basePrice * item.quantity, 0)
  const tenderedNum = parseFloat(tendered) || 0
  const change = paymentType === 'CASH' && tenderedNum > 0 ? tenderedNum - cartTotal : 0
  const insufficientCash = paymentType === 'CASH' && tenderedNum > 0 && tenderedNum < cartTotal

  const quickCash = useMemo(() => {
    if (cartTotal <= 0) return []
    const steps = [500, 1000, 5000]
    const set = new Set<number>()
    steps.forEach((s) => set.add(Math.ceil(cartTotal / s) * s))
    return [...set].sort((a, b) => a - b).slice(0, 3)
  }, [cartTotal])

  // ── Cart actions ────────────────────────────────────────────
  const addToCart = (product: Product): void => {
    const stock = sellableStock(product)
    if (!product.variants.length || stock <= 0) {
      toast.error('Out of stock', `${product.name} is not available right now.`)
      return
    }
    const existing = cart.find((item) => item.id === product.id)
    if (existing && existing.quantity >= stock) {
      toast.info('Stock limit reached', `Only ${stock} × ${product.name} available.`)
      return
    }
    setCart(
      existing
        ? cart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
        : [...cart, { ...product, quantity: 1 }]
    )
    setBump((b) => b + 1)
  }

  const updateQuantity = (id: string, delta: number): void => {
    setCart(
      cart.map((item) => {
        if (item.id !== id) return item
        const next = item.quantity + delta
        const stock = sellableStock(item)
        if (next > stock) {
          toast.info('Stock limit reached', `Only ${stock} available.`)
          return item
        }
        return next > 0 ? { ...item, quantity: next } : item
      })
    )
  }

  const removeFromCart = (id: string): void => setCart(cart.filter((item) => item.id !== id))

  const clearCart = (): void => {
    setCart([])
    setTendered('')
  }

  const handleCheckout = async (): Promise<void> => {
    if (cart.length === 0 || processing || insufficientCash) return
    setProcessing(true)

    const itemsForOrder = cart.map((item) => ({
      variantId: item.variants[0].id,
      quantity: item.quantity,
      priceAtTime: item.basePrice
    }))

    try {
      const order = await api.createOrder({ cashierId: '', paymentType, items: itemsForOrder })
      const paid = paymentType === 'CASH' && tenderedNum > 0 ? tenderedNum : cartTotal

      setReceiptData({
        id: order.id.split('-')[0].toUpperCase(),
        items: [...cart],
        total: cartTotal,
        date: new Date().toLocaleString(),
        paymentType,
        tendered: paid,
        change: paid - cartTotal
      })
      clearCart()
      loadProducts()
    } catch (err) {
      toast.error('Checkout failed', errorMessage(err))
    } finally {
      setProcessing(false)
    }
  }

  const newOrder = (): void => {
    setReceiptData(null)
    setTimeout(() => searchRef.current?.focus(), 50)
  }

  // ── Keyboard shortcuts ──────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const typing = (e.target as HTMLElement)?.tagName === 'INPUT'
      if (receiptData) {
        if (e.key === 'Enter' || e.key === 'Escape') newOrder()
        return
      }
      if (e.key === '/' && !typing) {
        e.preventDefault()
        searchRef.current?.focus()
      } else if (e.key === 'F9' || ((e.metaKey || e.ctrlKey) && e.key === 'Enter')) {
        e.preventDefault()
        handleCheckout()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Escape') {
      setQuery('')
      searchRef.current?.blur()
    } else if (e.key === 'Enter' && query.trim()) {
      // Barcode-scanner friendly: exact SKU match first, else the single/first result
      const q = query.trim().toLowerCase()
      const exact = products.find((p) => p.variants.some((v) => v.sku.toLowerCase() === q))
      const target = exact ?? filtered[0]
      if (target) {
        addToCart(target)
        setQuery('')
      } else {
        toast.error('No match', `Nothing found for “${query.trim()}”.`)
      }
    }
  }

  return (
    <>
      <div className="relative flex h-screen flex-col print:hidden">
        <AuroraBackground intensity={0.6} />

        {/* ── Top bar ── */}
        <header className="flex items-center gap-5 border-b border-white/[0.06] bg-ink-950/40 px-6 py-3.5 backdrop-blur-xl">
          <button
            id="pos-back"
            onClick={() => navigate('/')}
            className="btn btn-ghost btn-icon"
            title="Back to sign in"
          >
            <ArrowLeft size={18} />
          </button>
          <Logo size="sm" />

          <div className="relative mx-auto w-full max-w-xl">
            <Search size={17} className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-500" />
            <input
              id="pos-search"
              ref={searchRef}
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onSearchKey}
              placeholder="Search products, categories or scan SKU…"
              className="input rounded-2xl py-3 pr-20 pl-11"
            />
            <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1.5">
              {query ? (
                <button onClick={() => setQuery('')} className="rounded-md p-1 text-slate-500 hover:text-white">
                  <X size={15} />
                </button>
              ) : (
                <>
                  <ScanBarcode size={15} className="text-slate-600" />
                  <span className="kbd">/</span>
                </>
              )}
            </div>
          </div>

          <LiveClock />
          <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03] py-1.5 pr-3.5 pl-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-mint-400 to-emerald-600 text-xs font-bold text-ink-950">
              C
            </div>
            <div className="leading-tight">
              <p className="text-xs font-semibold text-white">Cashier</p>
              <p className="flex items-center gap-1 text-[10px] text-mint-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-mint-400" /> On shift
              </p>
            </div>
          </div>
        </header>

        {/* ── Main ── */}
        <main className="flex min-h-0 flex-1 gap-5 p-5">
          {/* Products */}
          <section className="flex min-w-0 flex-1 flex-col">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-semibold text-white">Products</h1>
                <p className="text-sm text-slate-500">
                  {filtered.length} item{filtered.length !== 1 && 's'} · tap to add to order
                </p>
              </div>
            </div>

            <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
              {categories.map(([name, count]) => (
                <button
                  key={name}
                  onClick={() => setCategory(name)}
                  className={`chip ${category === name ? 'chip-active' : ''}`}
                >
                  {name}
                  <span
                    className={`rounded-full px-1.5 text-[10px] ${category === name ? 'bg-white/20' : 'bg-white/5 text-slate-500'}`}
                  >
                    {count}
                  </span>
                </button>
              ))}
            </div>

            <div className="-mr-2 min-h-0 flex-1 overflow-y-auto pr-2 pb-2">
              {loading ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="animate-shimmer h-[210px] rounded-2xl border border-white/5 bg-[linear-gradient(90deg,rgb(255_255_255/0.02),rgb(255_255_255/0.06),rgb(255_255_255/0.02))] bg-[length:200%_100%]"
                    />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="glass mb-5 flex h-20 w-20 items-center justify-center rounded-3xl">
                    <PackageOpen size={34} className="text-slate-500" />
                  </div>
                  <p className="font-display text-lg font-semibold text-white">
                    {products.length === 0 ? 'No products yet' : 'No matches found'}
                  </p>
                  <p className="mt-1 max-w-xs text-sm text-slate-500">
                    {products.length === 0
                      ? 'Add products from the Admin panel to start selling.'
                      : 'Try a different search term or category.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4">
                  {filtered.map((product, i) => {
                    const stock = sellableStock(product)
                    const inCart = cart.find((c) => c.id === product.id)?.quantity ?? 0
                    const out = stock <= 0 || !product.variants.length
                    return (
                      <button
                        key={product.id}
                        onClick={() => addToCart(product)}
                        disabled={out}
                        style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
                        className="group glass animate-fade-up relative flex cursor-pointer flex-col overflow-hidden rounded-2xl p-3 text-left transition-all duration-300 hover:-translate-y-1 hover:border-brand-400/40 hover:bg-white/[0.06] hover:shadow-2xl hover:shadow-brand-600/20 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
                      >
                        <div
                          className="relative mb-3 flex h-24 items-center justify-center overflow-hidden rounded-xl"
                          style={{ background: tileGradient(product.category) }}
                        >
                          <span className="font-display text-3xl font-bold text-white/90 drop-shadow transition-transform duration-500 group-hover:scale-110">
                            {initials(product.name)}
                          </span>
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgb(255_255_255/0.35),transparent_60%)]" />
                          {inCart > 0 && (
                            <span
                              key={inCart}
                              className="animate-pop absolute top-2 right-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-ink-950/80 px-1.5 text-xs font-bold text-white backdrop-blur"
                            >
                              {inCart}
                            </span>
                          )}
                          <div className="absolute right-2 bottom-2 flex h-8 w-8 translate-y-2 items-center justify-center rounded-full bg-white text-ink-950 opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                            <Plus size={16} strokeWidth={2.8} />
                          </div>
                        </div>
                        <p className="line-clamp-1 font-semibold text-white">{product.name}</p>
                        <p className="mb-2 text-xs text-slate-500">{product.category}</p>
                        <div className="mt-auto flex items-center justify-between">
                          <span className="font-display font-semibold text-brand-300">{money(product.basePrice)}</span>
                          <span
                            className={`badge ${
                              out
                                ? 'bg-coral-500/15 text-coral-400'
                                : stock <= 5
                                  ? 'bg-sun-400/15 text-sun-400'
                                  : 'bg-white/5 text-slate-400'
                            }`}
                          >
                            {out ? 'Sold out' : `${stock} left`}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Cart */}
          <aside className="glass flex w-[400px] shrink-0 flex-col overflow-hidden rounded-3xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="bg-brand-gradient relative flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg shadow-brand-600/30">
                  <ShoppingBag size={18} />
                  {itemCount > 0 && (
                    <span
                      key={bump}
                      className="animate-pop absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-ink-950"
                    >
                      {itemCount}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="font-display font-semibold text-white">Current order</h2>
                  <p className="text-xs text-slate-500">
                    {itemCount} item{itemCount !== 1 && 's'}
                  </p>
                </div>
              </div>
              {cart.length > 0 && (
                <button onClick={clearCart} className="btn btn-ghost px-3 py-1.5 text-xs" title="Clear order">
                  <RotateCcw size={13} /> Clear
                </button>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <div className="relative mb-5">
                    <div className="absolute inset-0 rounded-full bg-brand-500/20 blur-2xl" />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-white/15">
                      <ShoppingBag size={30} className="text-slate-500" />
                    </div>
                  </div>
                  <p className="font-medium text-slate-300">Your order is empty</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Tap a product or press <span className="kbd">/</span> to search
                  </p>
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {cart.map((item) => (
                    <li
                      key={item.id}
                      className="group animate-slide-in-right flex items-center gap-3 rounded-2xl p-2.5 transition hover:bg-white/[0.04]"
                    >
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                        style={{ background: tileGradient(item.category) }}
                      >
                        {initials(item.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{item.name}</p>
                        <p className="text-xs text-slate-500">{money(item.basePrice)} each</p>
                      </div>
                      <div className="flex items-center rounded-xl border border-white/[0.08] bg-ink-900/60">
                        <button
                          onClick={() => (item.quantity === 1 ? removeFromCart(item.id) : updateQuantity(item.id, -1))}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-l-xl text-slate-400 transition hover:bg-white/5 hover:text-white"
                        >
                          {item.quantity === 1 ? <Trash2 size={13} /> : <Minus size={14} />}
                        </button>
                        <span className="w-7 text-center text-sm font-semibold text-white tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-r-xl text-slate-400 transition hover:bg-white/5 hover:text-white"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="w-[86px] text-right">
                        <p className="text-sm font-semibold text-white tabular-nums">
                          {money(item.basePrice * item.quantity)}
                        </p>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-[11px] text-slate-600 opacity-0 transition group-hover:opacity-100 hover:text-coral-400"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Checkout */}
            <div className="space-y-4 border-t border-white/[0.06] bg-ink-950/30 p-5">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-ink-900/70 p-1">
                {(
                  [
                    ['CASH', 'Cash', Banknote],
                    ['CARD', 'Card', CreditCard]
                  ] as const
                ).map(([value, label, Icon]) => (
                  <button
                    key={value}
                    id={`pay-${value.toLowerCase()}`}
                    onClick={() => setPaymentType(value)}
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                      paymentType === value
                        ? 'bg-white text-ink-950 shadow-lg'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon size={16} /> {label}
                  </button>
                ))}
              </div>

              {paymentType === 'CASH' && cart.length > 0 && (
                <div className="animate-fade-in space-y-2">
                  <div className="relative">
                    <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-xs font-semibold text-slate-500">
                      Rs.
                    </span>
                    <input
                      id="cash-tendered"
                      type="number"
                      min="0"
                      value={tendered}
                      onChange={(e) => setTendered(e.target.value)}
                      placeholder="Cash received (optional)"
                      className={`input pl-11 ${insufficientCash ? 'border-coral-400/60 focus:border-coral-400/80 focus:ring-coral-500/15' : ''}`}
                    />
                  </div>
                  <div className="flex gap-2">
                    {quickCash.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setTendered(String(amt))}
                        className="chip flex-1 justify-center py-1.5"
                      >
                        {amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{money(cartTotal)}</span>
                </div>
                {paymentType === 'CASH' && tenderedNum > 0 && (
                  <div className={`flex justify-between ${insufficientCash ? 'text-coral-400' : 'text-mint-400'}`}>
                    <span>{insufficientCash ? 'Amount due' : 'Change'}</span>
                    <span className="font-semibold tabular-nums">{money(Math.abs(change))}</span>
                  </div>
                )}
                <div className="flex items-end justify-between pt-2">
                  <span className="font-medium text-slate-300">Total</span>
                  <span className="font-display text-3xl font-bold text-white tabular-nums">{money(cartTotal)}</span>
                </div>
              </div>

              <button
                id="checkout"
                onClick={handleCheckout}
                disabled={cart.length === 0 || processing || insufficientCash}
                className="btn btn-success w-full rounded-2xl py-4 text-base"
              >
                {processing ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" />
                ) : (
                  <>
                    <Check size={19} strokeWidth={2.6} />
                    Charge {cart.length > 0 && money(cartTotal)}
                    <span className="ml-1 rounded-md bg-ink-950/15 px-1.5 py-0.5 text-[10px] font-bold">F9</span>
                  </>
                )}
              </button>
            </div>
          </aside>
        </main>
      </div>

      {/* ── Receipt modal & print area ── */}
      {receiptData && (
        <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-6 backdrop-blur-md print:static print:block print:bg-white print:p-0 print:backdrop-blur-none">
          <div className="animate-scale-in w-[400px] print:w-full print:animate-none">
            {/* Success header */}
            <div className="mb-5 flex flex-col items-center text-center print:hidden">
              <div className="relative mb-3">
                <div className="absolute inset-0 animate-ping rounded-full bg-mint-400/30 [animation-iteration-count:2]" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-mint-400 to-emerald-600 shadow-xl shadow-mint-500/40">
                  <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="#06060b" strokeWidth={3}>
                    <path
                      d="M5 12.5l4.5 4.5L19 7.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray={48}
                      className="animate-check"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="font-display text-2xl font-semibold text-white">Payment successful</h2>
              <p className="text-sm text-slate-400">
                {money(receiptData.total)} via {receiptData.paymentType === 'CASH' ? 'cash' : 'card'}
                {receiptData.change > 0 && (
                  <>
                    {' '}
                    · <span className="font-semibold text-mint-400">Change {money(receiptData.change)}</span>
                  </>
                )}
              </p>
            </div>

            {/* Paper receipt */}
            <div className="relative rounded-2xl bg-white p-7 font-mono text-[13px] text-slate-800 shadow-2xl print:rounded-none print:p-0 print:shadow-none">
              <div className="text-center">
                <p className="font-sans text-xl font-extrabold tracking-tight">CLOTHING POS</p>
                <p className="text-xs text-slate-500">Colombo, Sri Lanka</p>
                <p className="text-xs text-slate-500">Tel: 011-2345678</p>
              </div>

              <div className="my-4 flex justify-between border-y border-dashed border-slate-300 py-2 text-[11px] text-slate-600">
                <span>#{receiptData.id}</span>
                <span>{receiptData.date}</span>
              </div>

              <div className="space-y-1.5">
                {receiptData.items.map((item, i) => (
                  <div key={i} className="flex justify-between gap-3">
                    <span className="min-w-0 flex-1">
                      {item.name}
                      <span className="text-slate-500"> ×{item.quantity}</span>
                    </span>
                    <span className="tabular-nums">{money(item.basePrice * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-1 border-t border-dashed border-slate-300 pt-3">
                <div className="flex justify-between text-base font-bold">
                  <span>TOTAL</span>
                  <span className="tabular-nums">{money(receiptData.total)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Paid ({receiptData.paymentType})</span>
                  <span className="tabular-nums">{money(receiptData.tendered)}</span>
                </div>
                {receiptData.change > 0 && (
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Change</span>
                    <span className="tabular-nums">{money(receiptData.change)}</span>
                  </div>
                )}
              </div>

              <p className="mt-6 text-center font-sans text-sm italic">Thank you for shopping with us!</p>
              <p className="mt-0.5 text-center text-[11px] text-slate-400">Please come again.</p>

              {/* zig-zag paper edge */}
              <div
                className="absolute inset-x-0 -bottom-2 h-2 print:hidden"
                style={{
                  background:
                    'linear-gradient(-45deg, transparent 6px, white 0) 0 0 / 12px 12px repeat-x, linear-gradient(45deg, transparent 6px, white 0) 0 0 / 12px 12px repeat-x'
                }}
              />
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3 print:hidden">
              <button id="print-receipt" onClick={() => window.print()} className="btn btn-ghost flex-1 py-3.5">
                <Printer size={17} /> Print receipt
              </button>
              <button id="new-order" onClick={newOrder} className="btn btn-primary flex-1 py-3.5">
                New order <span className="kbd border-white/20 bg-white/10 text-white/80">↵</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
