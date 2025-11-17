import { NavLink } from 'react-router-dom'
import { useGroup } from '../context/GroupContext'
import { useEffect, useRef } from 'react'

const linkBase = 'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group'
const linkActive = 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg scale-105'
const linkInactive = 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 hover:scale-105'

function Item({ to, label, icon, onClick }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
      onClick={onClick}
      end={to === '/dashboard'}
    >
      <span className="text-2xl transform group-hover:scale-110 transition-transform">{icon}</span>
      <span className="font-semibold">{label}</span>
    </NavLink>
  )
}

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const { activeGroup, groups, selectPersonal, selectGroup, getActiveGroupInfo, loading } = useGroup()
  const closeBtnRef = useRef(null)
  const panelRef = useRef(null)

  const handleContextChange = (e) => {
    const value = e.target.value
    if (value === 'personal') {
      selectPersonal()
    } else {
      selectGroup(parseInt(value))
    }
  }

  const activeGroupInfo = getActiveGroupInfo()

  // Mover foco al botón cerrar al abrir
  useEffect(() => {
    if (isOpen && closeBtnRef.current) {
      closeBtnRef.current.focus()
    }
  }, [isOpen])

  // Focus trap dentro del panel cuando está abierto
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => {
      if (e.key !== 'Tab') return
      const focusable = panelRef.current?.querySelectorAll(
        'button, [href], select, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    panelRef.current?.addEventListener('keydown', handler)
    return () => panelRef.current?.removeEventListener('keydown', handler)
  }, [isOpen])

  return (
    <>
      {/* Panel móvil deslizante */}
      <aside
        id="mobile-sidebar"
        aria-label="Menú de navegación"
        className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-white md:hidden shadow-2xl border-r border-gray-100 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        ref={panelRef}
      >
        <div className="flex flex-col h-full p-6 overflow-y-auto">
          {/* Header móvil con botón cerrar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white">
                <span>💰</span>
              </div>
              <div className="text-sm font-bold text-gray-700">FinanzApp</div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Cerrar menú"
              ref={closeBtnRef}
            >
              ✕
            </button>
          </div>

          {/* Selector de contexto */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              📍 Contexto
            </label>
            {loading ? (
              <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-gray-500 bg-gray-50 flex items-center gap-2">
                <div className="spinner border-emerald-500"></div>
                <span>Cargando...</span>
              </div>
            ) : (
              <select
                value={activeGroup || 'personal'}
                onChange={handleContextChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white hover:border-emerald-300 cursor-pointer"
              >
                <option value="personal">🏠 Personal</option>
                {groups.length > 0 && <option disabled>──────────</option>}
                {groups.map((group) => (
                  <option key={group.id || group.grupo_id} value={group.id || group.grupo_id}>
                    👥 {group.nombre || group.name}
                  </option>
                ))}
              </select>
            )}

            {/* Indicador visual del contexto activo */}
            {activeGroupInfo && (
              <div className="mt-3 p-3 bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-emerald-600">👥</span>
                  <div className="font-bold text-emerald-900 text-sm">{activeGroupInfo.nombre || activeGroupInfo.name}</div>
                </div>
                {activeGroupInfo.descripcion && (
                  <div className="text-xs text-emerald-700 mt-1">{activeGroupInfo.descripcion}</div>
                )}
              </div>
            )}
            {!activeGroup && (
              <div className="mt-3 p-3 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <span>🏠</span>
                  <span className="text-xs font-semibold text-gray-600">Vista personal</span>
                </div>
              </div>
            )}
          </div>

          {/* Navegación */}
          <nav className="flex-1 space-y-2">
            <Item to="/dashboard" label="Dashboard" icon="📊" onClick={onClose} />
            <Item to="/transactions" label="Transacciones" icon="🔁" onClick={onClose} />
            <Item to="/categories" label="Categorías" icon="🏷️" onClick={onClose} />
            <Item to="/pockets" label="Bolsillos" icon="💼" onClick={onClose} />
            <Item to="/groups" label="Grupos" icon="👥" onClick={onClose} />
          </nav>

          {/* Footer del sidebar */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                <span>✨</span>
              </div>
              <div>
                <div className="font-semibold text-gray-700">Versión 2.0</div>
                <div>Diseño mejorado</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Sidebar de escritorio */}
      <aside className="hidden md:flex md:flex-col bg-white rounded-2xl shadow-lg border border-gray-100 p-6 h-fit sticky top-24">
      {/* Selector de contexto */}
      <div className="mb-8">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
          📍 Contexto
        </label>
        {loading ? (
          <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm text-gray-500 bg-gray-50 flex items-center gap-2">
            <div className="spinner border-emerald-500"></div>
            <span>Cargando...</span>
          </div>
        ) : (
          <select
            value={activeGroup || 'personal'}
            onChange={handleContextChange}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white hover:border-emerald-300 cursor-pointer"
          >
            <option value="personal">🏠 Personal</option>
            {groups.length > 0 && <option disabled>──────────</option>}
            {groups.map((group) => (
              <option key={group.id || group.grupo_id} value={group.id || group.grupo_id}>
                👥 {group.nombre || group.name}
              </option>
            ))}
          </select>
        )}
        
        {/* Indicador visual del contexto activo */}
        {activeGroupInfo && (
          <div className="mt-3 p-3 bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-emerald-600">👥</span>
              <div className="font-bold text-emerald-900 text-sm">{activeGroupInfo.nombre || activeGroupInfo.name}</div>
            </div>
            {activeGroupInfo.descripcion && (
              <div className="text-xs text-emerald-700 mt-1">{activeGroupInfo.descripcion}</div>
            )}
          </div>
        )}
        {!activeGroup && (
          <div className="mt-3 p-3 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl">
            <div className="flex items-center gap-2">
              <span>🏠</span>
              <span className="text-xs font-semibold text-gray-600">Vista personal</span>
            </div>
          </div>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-2">
        <Item to="/dashboard" label="Dashboard" icon="📊" />
        <Item to="/transactions" label="Transacciones" icon="🔁" />
        <Item to="/categories" label="Categorías" icon="🏷️" />
        <Item to="/pockets" label="Bolsillos" icon="💼" />
        <Item to="/groups" label="Grupos" icon="👥" />
      </nav>

      {/* Footer del sidebar */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
            <span>✨</span>
          </div>
          <div>
            <div className="font-semibold text-gray-700">Versión 2.0</div>
            <div>Diseño mejorado</div>
          </div>
        </div>
      </div>
      </aside>
    </>
  )
}
