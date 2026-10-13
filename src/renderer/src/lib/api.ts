// Thin, typed wrapper around Electron IPC so pages don't need @ts-ignore everywhere.

export interface Variant {
  id: string
  productId: string
  sku: string
  size: string
  color: string
  stock: number
  price: number | null
}

export interface Product {
  id: string
  name: string
  category: string
  basePrice: number
  variants: Variant[]
  createdAt: string
}

export interface Employee {
  id: string
  username: string
  password: string
  role: 'ADMIN' | 'CASHIER' | string
}

export interface Stats {
  todaysSales: number
  totalOrders: number
}

export type PaymentType = 'CASH' | 'CARD'

export function invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T> {
  return window.electron.ipcRenderer.invoke(channel, ...args) as Promise<T>
}

export const api = {
  getProducts: () => invoke<Product[]>('get-products'),
  createProduct: (data: { name: string; category: string; basePrice: number; variants?: unknown[] }) =>
    invoke<Product>('create-product', data),
  updateProduct: (data: { id: string; name: string; category: string; basePrice: number }) =>
    invoke<Product>('update-product', data),
  deleteProduct: (id: string) => invoke('delete-product', id),
  createOrder: (data: {
    cashierId: string
    paymentType: PaymentType
    items: { variantId: string; quantity: number; priceAtTime: number }[]
  }) => invoke<{ id: string; totalAmount: number }>('create-order', data),
  getStats: () => invoke<Stats>('get-stats'),
  getEmployees: () => invoke<Employee[]>('get-employees'),
  createEmployee: (data: { username: string; password: string; role: string }) =>
    invoke<Employee>('create-employee', data)
}

/** Stock of the variant that the POS actually sells (the first one). */
export const sellableStock = (p: Product): number => p.variants[0]?.stock ?? 0

export const totalStock = (p: Product): number => p.variants.reduce((s, v) => s + v.stock, 0)

export const errorMessage = (err: unknown): string =>
  err instanceof Error ? err.message.replace(/^Error invoking remote method '[^']+': /, '') : String(err)
