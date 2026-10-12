import { useNavigate } from 'react-router-dom'
import { User, Shield } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="w-[400px] rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">Clothing POS Login</h1>
        
        <div className="space-y-4">
          <button 
            onClick={() => navigate('/pos')}
            className="flex w-full items-center justify-center gap-3 rounded-md bg-blue-600 py-3 text-white transition hover:bg-blue-700"
          >
            <User size={20} />
            Login as Cashier (POS)
          </button>

          <button 
            onClick={() => navigate('/admin')}
            className="flex w-full items-center justify-center gap-3 rounded-md bg-slate-800 py-3 text-white transition hover:bg-slate-900"
          >
            <Shield size={20} />
            Login as Admin
          </button>
        </div>
      </div>
    </div>
  )
}
