import { HashRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import POSDashboard from './pages/pos/POSDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import { ToastProvider } from './components/ui/Toast'

function App(): React.JSX.Element {
  return (
    <ToastProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/pos" element={<POSDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </HashRouter>
    </ToastProvider>
  )
}

export default App
