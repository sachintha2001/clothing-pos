import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Package, PackageOpen, AlertTriangle, Tag } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import { useToast } from '../../components/ui/Toast'
import { api, errorMessage, sellableStock, type Product } from '../../lib/api'
import { initials, money, tileGradient } from '../../lib/format'

const emptyForm = { name: '', category: '', basePrice: '' }

export default function Inventory(): React.JSX.Element {
  const toast = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Product | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState<Product | null>(null)

  const loadProducts = async (): Promise<void> => {
    try {
      setProducts(await api.getProducts())
    } catch (err) {
      toast.error('Could not load products', errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const existingCategories = useMemo(() => [...new Set(products.map((p) => p.category))].sort(), [products])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.variants.some((v) => v.sku.toLowerCase().includes(q))
        )
      : products
  }, [products, query])

  const openAdd = (): void => {
    setEditing(null)
    setFormData(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (p: Product): void => {
    setEditing(p)
    setFormData({ name: p.name, category: p.category, basePrice: String(p.basePrice) })
    setFormOpen(true)
  }

  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      name: formData.name.trim(),
      category: formData.category.trim(),
      basePrice: Number(formData.basePrice)
    }
    try {
      if (editing) {
        await api.updateProduct({ id: editing.id, ...payload })
        toast.success('Product updated', payload.name)
      } else {
        await api.createProduct({ ...payload, variants: [] })
        toast.success('Product added', `${payload.name} is now available at the POS.`)
      }
      setFormOpen(false)
      loadProducts()
    } catch (err) {
      toast.error('Could not save product', errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (): Promise<void> => {
    if (!toDelete) return
    try {
      await api.deleteProduct(toDelete.id)
      toast.success('Product deleted', toDelete.name)
      loadProducts()
    } catch (err) {
      toast.error('Could not delete product', 'It may already have sales recorded. ' + errorMessage(err))
    } finally {
      setToDelete(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-500" />
          <input
            id="inventory-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, category or SKU…"
            className="input pl-10"
          />
        </div>
        <p className="text-sm text-slate-500">
          {filtered.length} of {products.length} products
        </p>
        <button id="add-product" onClick={openAdd} className="btn btn-primary ml-auto">
          <Plus size={17} /> Add product
        </button>
      </div>

      {/* Table */}
      <div className="glass overflow-hidden rounded-3xl">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-[11px] tracking-wider text-slate-500 uppercase">
              <th className="px-6 py-4 font-semibold">Product</th>
              <th className="px-6 py-4 font-semibold">Category</th>
              <th className="px-6 py-4 font-semibold">SKU</th>
              <th className="px-6 py-4 text-right font-semibold">Price</th>
              <th className="px-6 py-4 font-semibold">Stock</th>
              <th className="px-6 py-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-white/[0.04]">
                  <td colSpan={6} className="px-6 py-4">
                    <div className="animate-shimmer h-10 rounded-xl bg-[linear-gradient(90deg,rgb(255_255_255/0.02),rgb(255_255_255/0.06),rgb(255_255_255/0.02))] bg-[length:200%_100%]" />
                  </td>
                </tr>
              ))}

            {!loading &&
              filtered.map((p) => {
                const stock = sellableStock(p)
                const pct = Math.min(100, stock)
                const tone = stock === 0 ? 'coral' : stock <= 10 ? 'sun' : 'mint'
                return (
                  <tr key={p.id} className="group border-b border-white/[0.04] transition last:border-0 hover:bg-white/[0.025]">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-md"
                          style={{ background: tileGradient(p.category) }}
                        >
                          {initials(p.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{p.name}</p>
                          <p className="text-xs text-slate-500">
                            {p.variants.length} variant{p.variants.length !== 1 && 's'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="badge bg-white/5 text-slate-300">
                        <Tag size={11} /> {p.category}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs text-slate-500">{p.variants[0]?.sku ?? '—'}</td>
                    <td className="font-display px-6 py-3.5 text-right font-semibold text-white tabular-nums">
                      {money(p.basePrice)}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/5">
                          <div
                            className={`h-full rounded-full ${tone === 'coral' ? 'bg-coral-400' : tone === 'sun' ? 'bg-sun-400' : 'bg-mint-400'}`}
                            style={{ width: `${Math.max(pct, 3)}%` }}
                          />
                        </div>
                        <span
                          className={`text-xs font-semibold tabular-nums ${tone === 'coral' ? 'text-coral-400' : tone === 'sun' ? 'text-sun-400' : 'text-slate-300'}`}
                        >
                          {stock}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex justify-end gap-1.5 opacity-60 transition group-hover:opacity-100">
                        <button
                          onClick={() => openEdit(p)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setToDelete(p)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-coral-500/10 hover:text-coral-400"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-16">
                  <div className="flex flex-col items-center text-center">
                    <PackageOpen size={34} className="mb-3 text-slate-600" />
                    <p className="font-medium text-slate-200">
                      {products.length === 0 ? 'No products yet' : 'No matching products'}
                    </p>
                    <p className="mb-4 text-sm text-slate-500">
                      {products.length === 0 ? 'Add your first product to start selling.' : 'Try another search.'}
                    </p>
                    {products.length === 0 && (
                      <button onClick={openAdd} className="btn btn-primary">
                        <Plus size={16} /> Add product
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit product' : 'New product'}
        subtitle={editing ? 'Update the product details below.' : 'A default variant with 100 units is created automatically.'}
        icon={<Package size={20} />}
      >
        <form id="product-form" onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label" htmlFor="p-name">
              Product name
            </label>
            <input
              id="p-name"
              required
              autoFocus
              className="input"
              placeholder="e.g. Linen Summer Shirt"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="p-category">
                Category
              </label>
              <input
                id="p-category"
                required
                list="category-options"
                className="input"
                placeholder="e.g. Shirts"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
              <datalist id="category-options">
                {existingCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="label" htmlFor="p-price">
                Price
              </label>
              <div className="relative">
                <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-xs font-semibold text-slate-500">
                  Rs.
                </span>
                <input
                  id="p-price"
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  className="input pl-11"
                  placeholder="0.00"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                />
              </div>
            </div>
          </div>

          {formData.name && (
            <div className="animate-fade-in flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl font-bold text-white"
                style={{ background: tileGradient(formData.category || 'x') }}
              >
                {initials(formData.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-white">{formData.name}</p>
                <p className="text-xs text-slate-500">{formData.category || 'No category'}</p>
              </div>
              <p className="font-display font-semibold text-brand-300">{money(Number(formData.basePrice))}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setFormOpen(false)} className="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary min-w-[130px]">
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : editing ? (
                'Save changes'
              ) : (
                'Add product'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!toDelete} onClose={() => setToDelete(null)} hideClose width="w-[420px]">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-coral-500/15 text-coral-400">
            <AlertTriangle size={26} />
          </div>
          <h2 className="font-display text-xl font-semibold text-white">Delete product?</h2>
          <p className="mt-1 text-sm text-slate-400">
            <span className="font-semibold text-slate-200">{toDelete?.name}</span> and all its variants will be
            permanently removed.
          </p>
          <div className="mt-6 flex w-full gap-3">
            <button onClick={() => setToDelete(null)} className="btn btn-ghost flex-1">
              Cancel
            </button>
            <button id="confirm-delete" onClick={handleDelete} className="btn btn-danger flex-1">
              <Trash2 size={15} /> Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
