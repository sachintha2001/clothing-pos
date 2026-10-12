import { useEffect, useState } from 'react'

export default function Inventory() {
  const [products, setProducts] = useState<any[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({ name: '', category: '', basePrice: 0 })

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      // @ts-ignore
      const data = await window.electron.ipcRenderer.invoke('get-products')
      setProducts(data)
    } catch (err: any) {
      console.error(err)
      alert("Error loading products: " + err.message)
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // @ts-ignore
      await window.electron.ipcRenderer.invoke('create-product', {
        name: formData.name,
        category: formData.category,
        basePrice: Number(formData.basePrice),
        variants: [] // To be implemented for variants
      })
      setIsAdding(false)
      loadProducts()
    } catch (err: any) {
      console.error(err)
      alert("Error saving product: " + err.message)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {isAdding ? 'Cancel' : 'Add New Product'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddProduct} className="bg-white p-6 rounded-lg shadow-sm border mb-6 flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Product Name</label>
            <input required type="text" className="w-full border rounded p-2" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Category</label>
            <input required type="text" className="w-full border rounded p-2" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium mb-1">Base Price</label>
            <input required type="number" min="0" className="w-full border rounded p-2" value={formData.basePrice} onChange={e => setFormData({ ...formData, basePrice: Number(e.target.value) })} />
          </div>
          <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">Save</button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold">Name</th>
              <th className="p-4 font-semibold">Category</th>
              <th className="p-4 font-semibold">Base Price</th>
              <th className="p-4 font-semibold">Variants</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-b">
                <td className="p-4">{p.name}</td>
                <td className="p-4">{p.category}</td>
                <td className="p-4">Rs. {p.basePrice}</td>
                <td className="p-4">{p.variants.length}</td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">No products found. Add one!</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
