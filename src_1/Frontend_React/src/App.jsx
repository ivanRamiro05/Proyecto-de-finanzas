import { Link, Route, Routes, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import { useAuth } from './context/AuthContext.jsx'
import { GroupProvider } from './context/GroupContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Sidebar from './components/Sidebar.jsx'
import Transactions from './pages/Transactions.jsx'
import Categories from './pages/Categories.jsx'
import Pockets from './pages/Pockets.jsx'
import Groups from './pages/Groups.jsx'
import BackendStatus from './components/BackendStatus.jsx'
import './App.css'
import Header from './components/Header.jsx'
import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

function Layout({ children }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const prevFocusRef = useRef(null)

  // Cerrar al cambiar de ruta
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    if (mobileOpen) {
      window.addEventListener('keydown', handleKey)
    }
    return () => window.removeEventListener('keydown', handleKey)
  }, [mobileOpen])

  // Guardar foco previo al abrir y restaurar al cerrar
  useEffect(() => {
    if (mobileOpen) {
      prevFocusRef.current = document.activeElement
    } else if (!mobileOpen && prevFocusRef.current) {
      // Intentar enfocar el botón hamburguesa si existe
      const hamburger = document.querySelector('[aria-controls="mobile-sidebar"]')
      if (hamburger) {
        hamburger.focus()
      } else {
        prevFocusRef.current.focus?.()
      }
      prevFocusRef.current = null
    }
  }, [mobileOpen])

  if (!isAuthenticated) {
    return <div className="min-h-screen">{children}</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
  <Header onMenuToggle={() => setMobileOpen(o => !o)} isMenuOpen={mobileOpen} />
      {/* Backdrop oscuro para móvil */}
      {mobileOpen && (
        <button
          aria-label="Cerrar menú"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/25 backdrop-blur-sm md:hidden z-40"
        />
      )}
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] w-full">
        <Sidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <main className="bg-gray-50 p-4 sm:p-6 lg:p-10">
          <div className="w-full max-w-[1920px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

function Placeholder({ title, children }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      {children}
    </div>
  )
}

// Redirección inteligente para la ruta raíz
function HomeRedirect() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  return <Navigate to="/login" replace />
}

function App() {
  return (
    <GroupProvider>
      <BackendStatus />
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route
          path="/login"
          element={<Layout><Login /></Layout>}
        />
        <Route
          path="/register"
          element={<Layout><Register /></Layout>}
        />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/transactions" element={<Layout><Transactions /></Layout>} />
          <Route path="/categories" element={<Layout><Categories /></Layout>} />
          <Route path="/pockets" element={<Layout><Pockets /></Layout>} />
          <Route path="/groups" element={<Layout><Groups /></Layout>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </GroupProvider>
  )
}

export default App
