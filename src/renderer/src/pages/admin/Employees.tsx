import { useEffect, useState } from 'react'

export default function Employees() {
  const [employees, setEmployees] = useState<any[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({ username: '', password: '', role: 'CASHIER' })

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      // @ts-ignore
      const data = await window.electron.ipcRenderer.invoke('get-employees')
      setEmployees(data)
    } catch (err: any) {
      console.error(err)
      alert("Error loading employees: " + err.message)
    }
  }

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // @ts-ignore
      await window.electron.ipcRenderer.invoke('create-employee', formData)
      setIsAdding(false)
      loadEmployees()
    } catch (err: any) {
      console.error(err)
      alert("Error saving employee: " + err.message)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Employee Management</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {isAdding ? 'Cancel' : 'Add New Employee'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddEmployee} className="bg-white p-6 rounded-lg shadow-sm border mb-6 flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Username</label>
            <input required type="text" className="w-full border rounded p-2" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Password</label>
            <input required type="password" className="w-full border rounded p-2" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium mb-1">Role</label>
            <select className="w-full border rounded p-2 bg-white" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
              <option value="CASHIER">CASHIER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">Save</button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold">Username</th>
              <th className="p-4 font-semibold">Role</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id} className="border-b">
                <td className="p-4">{emp.username}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${emp.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {emp.role}
                  </span>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={2} className="p-4 text-center text-gray-500">No employees found. Add one!</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
