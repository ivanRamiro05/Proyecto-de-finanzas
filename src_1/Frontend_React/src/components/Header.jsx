import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useGroup } from '../context/GroupContext.jsx'

export default function Header({ onMenuToggle, isMenuOpen }) {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { activeGroup, getActiveGroupMembersCount } = useGroup()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const membersCount = getActiveGroupMembersCount()

  return (
  <header className="sticky top-0 z-40 w-full backdrop-blur bg-white/80 border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <button
              type="button"
              onClick={onMenuToggle}
              aria-label="Abrir menú"
              aria-controls="mobile-sidebar"
              aria-expanded={isMenuOpen ? 'true' : 'false'}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <span className="sr-only">Abrir menú</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          )}
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
            <span className="text-2xl">💰</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-extrabold tracking-tight text-gray-800">FinanzApp</span>
            <span className="text-[10px] uppercase font-semibold text-emerald-600">Gestor inteligente</span>
          </div>
          </Link>
        </div>

        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            {/* Mensaje de bienvenida */}
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-xs text-gray-500">Bienvenido</span>
              <span className="text-sm font-semibold text-gray-800">
                {user?.nombre || user?.email || 'Usuario'}
              </span>
            </div>
            
            {activeGroup && (
              <div className="hidden md:flex px-3 py-1.5 text-xs rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium">
                Grupo activo: {membersCount} {membersCount === 1 ? 'persona' : 'personas'}
              </div>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            >
              Salir
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm">
            {location.pathname !== '/login' && (
              <Link to="/login" className="text-emerald-600 hover:text-emerald-500 font-semibold">Ingresar</Link>
            )}
            {location.pathname !== '/register' && (
              <Link to="/register" className="px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 font-semibold">Registrarse</Link>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
