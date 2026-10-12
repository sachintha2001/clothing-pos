import { HashRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import POSDashboard from './pages/pos/POSDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'

function App(): JSX.Element {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/pos" element={<POSDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </HashRouter>
  )
}

export default App
