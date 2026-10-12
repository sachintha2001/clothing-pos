import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ArrowLeft, Users, Package, TrendingUp } from 'lucide-react'
import Inventory from './Inventory'
import Employees from './Employees'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState({ todaysSales: 0, totalOrders: 0 })

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadStats()
    }
  }, [activeTab])

  const loadStats = async () => {
    try {
      // @ts-ignore
      const data = await window.electron.ipcRenderer.invoke('get-stats')
      setStats(data)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-4 bg-slate-950 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="hover:text-blue-400">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 p-3 rounded-md transition ${activeTab === 'dashboard' ? 'bg-slate-800 text-blue-400' : 'hover:bg-slate-800'}`}
          >
            <TrendingUp size={20} /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-3 p-3 rounded-md transition ${activeTab === 'inventory' ? 'bg-slate-800 text-blue-400' : 'hover:bg-slate-800'}`}
          >
            <Package size={20} /> Inventory (Products)
          </button>
          <button 
            onClick={() => setActiveTab('employees')}
            className={`w-full flex items-center gap-3 p-3 rounded-md transition ${activeTab === 'employees' ? 'bg-slate-800 text-blue-400' : 'hover:bg-slate-800'}`}
          >
            <Users size={20} /> Employees
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Overview</h2>
            
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-gray-500 font-medium">Today's Sales</h3>
                <p className="text-3xl font-bold mt-2 text-green-600">Rs. {stats.todaysSales.toFixed(2)}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-gray-500 font-medium">Total Orders (Today)</h3>
                <p className="text-3xl font-bold mt-2">{stats.totalOrders}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-gray-500 font-medium">System Status</h3>
                <p className="text-xl font-bold text-blue-600 mt-2">Online</p>
              </div>
            </div>

            <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold mb-4">How to use</h3>
              <ul className="list-disc pl-5 text-gray-600 space-y-2">
                <li>Go to <b>Inventory</b> to add products.</li>
                <li>Go to <b>Employees</b> to add cashiers.</li>
                <li>Go back to the Login screen and enter <b>Cashier Mode</b> to make sales.</li>
                <li>Check this dashboard later to see your total sales for the day.</li>
              </ul>
            </div>
          </>
        )}

        {activeTab === 'inventory' && <Inventory />}
        {activeTab === 'employees' && <Employees />}
      </div>
    </div>
  )
}

