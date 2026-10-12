import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ArrowLeft, ShoppingCart, Plus, Minus, Trash2, Printer } from 'lucide-react'

export default function POSDashboard() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [receiptData, setReceiptData] = useState<any>(null)

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

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id)
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + delta
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item
      }
      return item
    }))
  }

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id))
  }

  const cartTotal = cart.reduce((total, item) => total + (item.basePrice * item.quantity), 0)

  const handleCheckout = async () => {
    if (cart.length === 0) return
    
    const itemsForOrder = cart.map(item => ({
      variantId: item.variants[0].id, 
      quantity: item.quantity,
      priceAtTime: item.basePrice
    }))

    try {
      // @ts-ignore
      const order = await window.electron.ipcRenderer.invoke('create-order', {
        cashierId: '', 
        paymentType: 'CASH',
        items: itemsForOrder
      })
      
      // Save data for receipt printing
      setReceiptData({
        id: order.id.split('-')[0].toUpperCase(), // Short ID
        items: [...cart],
        total: cartTotal,
        date: new Date().toLocaleString()
      })

      setCart([]) 
      loadProducts() 
    } catch (err: any) {
      console.error(err)
      alert("Checkout failed: " + err.message)
    }
  }

  return (
    <>
      <div className="flex h-screen flex-col bg-gray-100 print:hidden">
        {/* Topbar */}
        <div className="flex items-center justify-between bg-blue-600 px-6 py-4 text-white shadow-md">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="rounded-full bg-blue-700 p-2 hover:bg-blue-800 transition">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold">POS Terminal</h1>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <ShoppingCart size={20} />
            Cashier Mode
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 gap-4 p-4 overflow-hidden">
          {/* Left Side: Product Grid */}
          <div className="flex-1 flex flex-col rounded-lg bg-white shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Products List</h2>
              <p className="text-sm text-gray-500">Click a product to add to cart</p>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              <div className="grid grid-cols-3 gap-4 xl:grid-cols-4">
                {products.map(product => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-blue-500 hover:shadow-md transition active:scale-95 text-left h-32"
                  >
                    <span className="font-bold text-gray-800 text-center line-clamp-2">{product.name}</span>
                    <span className="text-sm text-gray-500 mt-1">{product.category}</span>
                    <span className="font-bold text-blue-600 mt-2">Rs. {product.basePrice.toFixed(2)}</span>
                  </button>
                ))}
                {products.length === 0 && (
                  <div className="col-span-3 text-center py-10 text-gray-500">
                    No products available. Add some from the Admin Panel.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side: Cart & Checkout */}
          <div className="w-[400px] flex flex-col rounded-lg bg-white shadow-sm border border-gray-200">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">Current Order</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                  <ShoppingCart size={48} className="opacity-20" />
                  <p>Cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center border-b pb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{item.name}</h4>
                        <p className="text-sm text-gray-500">Rs. {item.basePrice.toFixed(2)} x {item.quantity}</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-gray-100 rounded-md border">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 hover:bg-gray-200 rounded-l-md text-gray-600"><Minus size={16} /></button>
                          <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 hover:bg-gray-200 rounded-r-md text-gray-600"><Plus size={16} /></button>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-md">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t bg-gray-50">
              <div className="flex justify-between items-end mb-4">
                <span className="text-gray-500 font-medium">Total Amount</span>
                <span className="font-bold text-3xl text-gray-800">Rs. {cartTotal.toFixed(2)}</span>
              </div>
              <button 
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full rounded-lg bg-green-600 py-4 font-bold text-lg text-white transition hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Pay (Checkout)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal & Print Area */}
      {receiptData && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 print:bg-white print:p-0">
          <div className="bg-white p-8 rounded-lg shadow-xl w-[400px] print:w-full print:shadow-none print:border-none print:p-0">
            
            {/* Receipt Content */}
            <div className="text-gray-800">
              <h1 className="text-2xl font-bold text-center mb-1">CLOTHING POS</h1>
              <p className="text-center text-sm text-gray-500">Colombo, Sri Lanka</p>
              <p className="text-center text-sm text-gray-500 mb-4">Tel: 011-2345678</p>
              
              <div className="flex justify-between text-xs mb-4 border-b border-dashed pb-2">
                <span>Receipt: #{receiptData.id}</span>
                <span>{receiptData.date}</span>
              </div>
              
              <div className="space-y-2 mb-4 text-sm font-medium">
                <div className="flex justify-between border-b pb-1 font-bold">
                  <span>Item</span>
                  <span>Amount</span>
                </div>
                {receiptData.items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between">
                    <span>{item.name} x{item.quantity}</span>
                    <span>Rs. {(item.basePrice * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between font-bold text-lg border-t border-dashed pt-2 mt-4">
                <span>TOTAL</span>
                <span>Rs. {receiptData.total.toFixed(2)}</span>
              </div>
              
              <p className="text-center mt-8 text-sm italic">Thank you for shopping with us!</p>
              <p className="text-center text-xs text-gray-400 mt-1">Please come again.</p>
            </div>

            {/* Modal Actions (Hidden in print) */}
            <div className="print:hidden mt-8 flex gap-3">
              <button 
                onClick={() => window.print()} 
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold transition"
              >
                <Printer size={18} /> Print
              </button>
              <button 
                onClick={() => setReceiptData(null)} 
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 font-bold transition"
              >
                New Order
              </button>
            </div>
            
          </div>
        </div>
      )}
    </>
  )
}
