import { useEffect, useMemo, useState } from 'react'
import { useGroup } from '../context/GroupContext'
import * as pocketsService from '../services/pockets'
import * as transfersService from '../services/transfers'
import { formatCurrency } from '../utils/currency'

function Icon({ name, className = 'w-6 h-6' }) {
  switch (name) {
    case 'wallet':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M21 7H3a2 2 0 0 0-2 2v6a4 4 0 0 0 4 4h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Zm-1 7h-3a2 2 0 1 1 0-4h3v4Z"/>
          <path d="M17 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/>
        </svg>
      )
    case 'savings':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M21 11h-1.28a8 8 0 1 0-13.9 4H3v4h3v-1h12v1h3v-4h-1v-4ZM9 9h3V7H9V5H7v2H5v2h2v2h2V9Z"/>
        </svg>
      )
    case 'card':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2H2V6Zm20 4H2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-8ZM6 16h5v2H6v-2Z"/>
        </svg>
      )
    case 'cash':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M3 6h18v12H3z"/>
          <circle cx="12" cy="12" r="3" fill="#fff"/>
        </svg>
      )
    default:
      return null
  }
}

const ICONS = [
  { id: 'wallet', label: 'Billetera' },
  { id: 'savings', label: 'Ahorros' },
  { id: 'card', label: 'Tarjeta' },
  { id: 'cash', label: 'Efectivo' },
]

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f97316', '#ef4444', '#06b6d4']

export default function Pockets() {
  const { activeGroup } = useGroup()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ id: null, name: '', color: COLORS[0], balance: 0, icon: 'wallet' })
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      const data = await pocketsService.list(activeGroup)
      setItems(data)
      setLoading(false)
    })()
  }, [activeGroup]) // Recargar cuando cambie el grupo activo

  const total = useMemo(() => items.reduce((acc, it) => acc + Number(it.balance || 0), 0), [items])
  const canSave = useMemo(() => form.name && form.icon && form.color, [form])

  const save = async (e) => {
    e.preventDefault()
    setError('')
    if (!canSave) { setError('Completa los campos requeridos'); return }
    if (form.id) {
      // actualizar
      try {
        // enviar solo campos modificados para evitar conflictos de unicidad
        const orig = items.find(x => x.id === form.id) || {}
        const payload = {}
        if ((form.name || '') !== (orig.name || '')) payload.name = form.name
        if ((form.color || '') !== (orig.color || '')) payload.color = form.color
        if ((form.icon || '') !== (orig.icon || '')) payload.icon = form.icon
        if (Number(form.balance || 0) !== Number(orig.balance || 0)) payload.balance = Number(form.balance || 0)
        const updated = await pocketsService.update(form.id, payload)
        setItems(prev => prev.map(p => p.id === updated.id ? updated : p))
        setOpen(false)
        setForm({ id: null, name: '', color: COLORS[0], balance: 0, icon: 'wallet' })
      } catch (err) {
        const msg = err?.response?.data?.detail || err?.message || 'Error al actualizar el bolsillo'
        setError(msg)
      }
    } else {
      try {
        const initialAmount = Number(form.balance || 0)
        const createPayload = {
          name: form.name,
          color: form.color,
          // Si es un grupo y hay monto inicial, crear con saldo 0 y luego transferir desde General
          balance: activeGroup && initialAmount > 0 ? 0 : initialAmount,
          icon: form.icon
        }

        const created = await pocketsService.create(createPayload, activeGroup)

        // Si estamos en un grupo y se indicó monto inicial, intentar transferir desde "General"
        if (activeGroup && initialAmount > 0) {
          // Buscar bolsillo General ya cargado en el listado
          let general = items.find(x => (x.name || '').toLowerCase() === 'general')
          // Si no está en memoria, recargar lista de bolsillos del grupo y buscarlo
          if (!general) {
            const fresh = await pocketsService.list(activeGroup)
            general = fresh.find(x => (x.name || '').toLowerCase() === 'general')
          }

          if (!general) {
            setError('Bolsillo "General" no encontrado en el grupo. El bolsillo se creó sin monto inicial.')
          } else {
            try {
              await transfersService.transfer(
                general.id,
                created.id,
                initialAmount,
                `Asignación inicial a ${created.name}`
              )
              // Refrescar listado para reflejar saldos actualizados
              const refreshed = await pocketsService.list(activeGroup)
              setItems(refreshed)
            } catch (txErr) {
              const txMsg = txErr?.response?.data?.detail || txErr?.message || 'No se pudo asignar el monto inicial desde "General"'
              setError(txMsg)
              // Aun así, agregar el bolsillo creado a la lista local si aún no está
              setItems(prev => [created, ...prev])
            }
          }
        } else {
          // Caso personal o sin monto inicial
          setItems(prev => [created, ...prev])
        }

        setOpen(false)
        setForm({ id: null, name: '', color: COLORS[0], balance: 0, icon: 'wallet' })
      } catch (err) {
        const msg = err?.response?.data?.detail || err?.message || 'Error al crear el bolsillo'
        setError(msg)
      }
    }
    localStorage.setItem('demo_pockets', JSON.stringify(JSON.parse(localStorage.getItem('demo_pockets') || '[]')))
  }

  const [confirmId, setConfirmId] = useState(null)
  const remove = async (id) => {
    setError('')
    setConfirmId(id)
  }
  const confirmRemove = async () => {
    try {
      await pocketsService.remove(confirmId)
      setItems(prev => prev.filter(x => x.id !== confirmId))
      localStorage.setItem('demo_pockets', JSON.stringify(JSON.parse(localStorage.getItem('demo_pockets') || '[]')))
      setConfirmId(null)
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'Error al eliminar el bolsillo'
      setError(msg)
      setConfirmId(null)
    }
  }

  return (
  <div className="space-y-16 sm:space-y-24 xl:space-y-28 fade-in max-w-[1900px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-8 sm:py-12">
      {/* Header con gradiente */}
  <div className="bg-gradient-to-r from-emerald-500 via-green-600 to-lime-500 rounded-2xl md:rounded-3xl p-10 md:p-12 lg:p-14 text-white shadow-2xl mb-12 sm:mb-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Bolsillos</h2>
            <p className="text-emerald-100 text-xl">Organiza tus cuentas y balances</p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="btn bg-white text-emerald-600 hover:bg-gray-50 shadow-lg flex items-center gap-3 font-bold text-lg px-6 py-4"
          >
            <span className="text-xl">＋</span>
            <span>Nuevo Bolsillo</span>
          </button>
        </div>
      </div>

      {/* Espaciador visual */}
      <div className="w-full h-6"></div>

      {/* Card de balance total */}
      <div className="bg-gradient-to-br from-emerald-500 via-green-600 to-lime-500 rounded-3xl p-14 xl:p-16 text-white shadow-2xl hover:shadow-3xl transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base text-white/90 font-semibold uppercase tracking-wider mb-4">Balance Total</div>
            <div className="text-5xl md:text-6xl font-extrabold mb-4">{formatCurrency(total)}</div>
            <div className="text-base text-white/90">{items.length} bolsillo{items.length !== 1 ? 's' : ''} activo{items.length !== 1 ? 's' : ''}</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
            <Icon name="wallet" className="w-16 h-16" />
          </div>
        </div>
      </div>

      {/* Espaciador visual */}
      <div className="w-full h-6"></div>

      {/* Divisor visual antes del listado */}
  <div className="relative flex items-center justify-center mt-14 sm:mt-20 pb-10 sm:pb-12">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent"></div>
        <div className="absolute px-4 py-1.5 sm:px-6 sm:py-2 rounded-full bg-white shadow-lg border border-emerald-200 flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-700">
          <span>{activeGroup ? '�' : '🧍'}</span>
          <span>{activeGroup ? 'Bolsillos del Grupo' : 'Tus Bolsillos'}</span>
        </div>
      </div>

      {/* Formulario de nuevo/editar bolsillo */}
      {open && (
  <div className="bg-white rounded-3xl border border-gray-100 p-10 shadow-xl scale-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
              <span className="text-2xl">💼</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {form.id ? 'Editar Bolsillo' : 'Nuevo Bolsillo'}
              </h3>
              <p className="text-sm text-gray-500">Personaliza tu cuenta</p>
            </div>
          </div>

          <form onSubmit={save} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Nombre del Bolsillo <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Cuenta Principal, Ahorros..."
                  className="input h-12"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Monto inicial</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-base">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={form.balance}
                    onChange={(e) => setForm({ ...form, balance: e.target.value })}
                    className="input pl-10 text-lg font-semibold h-12"
                  />
                </div>
                {activeGroup && (
                  <p className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                    💡 Si indicas un monto, se transferirá desde el bolsillo General de tu grupo.
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Icono <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {ICONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setForm({ ...form, icon: opt.id })}
                    className={`border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${
                      form.icon === opt.id
                        ? 'bg-blue-50 border-blue-500 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <Icon name={opt.id} className="w-8 h-8" />
                    <span className="text-xs font-semibold">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Color <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-5">
                {COLORS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    className={`w-14 h-14 rounded-xl border-4 shadow-md transition-all hover:scale-110 ${
                      form.color === c ? 'border-white ring-4 ring-blue-500 scale-110' : 'border-gray-200'
                    }`}
                    style={{ background: c }}
                    aria-label={`Color ${c}`}
                  ></button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <div className="flex items-center">
                  <span className="text-red-500 mr-2">⚠️</span>
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-4 pt-6 border-t">
              <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">
                Cancelar
              </button>
              <button
                disabled={!canSave}
                className={`btn btn-primary inline-flex items-center gap-2 ${
                  !canSave ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                <Icon name="wallet" className="w-5 h-5" />
                {form.id ? '💾 Actualizar' : '✨ Crear Bolsillo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Bolsillos */}
      <div className="bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="px-6 py-6 md:px-10 md:py-8 bg-gradient-to-r from-gray-50 to-white border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            <h3 className="font-bold text-gray-900">Listado de Bolsillos</h3>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="spinner w-4 h-4"></div>
              <span>Cargando…</span>
            </div>
          )}
        </div>
  <div className="p-14 xl:p-16 grid grid-cols-1 md:grid-cols-2 gap-14 xl:gap-16">
          {items.length ? (
            items.map((p) => (
              <div
                key={p.id}
                className="relative group border-2 border-gray-100 rounded-2xl p-10 transition-all hover:shadow-xl hover:scale-[1.03] hover:border-emerald-200 bg-gradient-to-br from-white to-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-6 flex-1">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform"
                      style={{ background: p.color }}
                    >
                      <Icon name={p.icon || 'wallet'} className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 text-xl mb-2">{p.name}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 font-medium">Saldo:</span>
                        <span className="text-base font-bold text-blue-600">
                          {formatCurrency(Number(p.balance || 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-8 pt-8 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setForm({
                        id: p.id,
                        name: p.name,
                        color: p.color,
                        balance: p.balance,
                        icon: p.icon,
                      });
                      setOpen(true);
                      setError('');
                    }}
                    className="flex-1 px-6 py-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-semibold rounded-xl transition-all hover:shadow-md"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => remove(p.id)}
                    className="flex-1 px-6 py-4 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl transition-all hover:shadow-md"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <div className="text-6xl mb-4">💼</div>
              <p className="text-gray-500 font-medium">Aún no hay bolsillos creados</p>
              <p className="text-sm text-gray-400 mt-2">Crea tu primer bolsillo para organizar tus finanzas</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación */}
      {confirmId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 scale-in">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Confirmar Eliminación</h3>
            </div>
            <p className="text-gray-600 mb-6 leading-relaxed">
              ¿Estás seguro de que deseas eliminar este bolsillo? Esta acción no se puede deshacer y se perderán todos los datos asociados.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all"
                onClick={() => setConfirmId(null)}
              >
                Cancelar
              </button>
              <button
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
                onClick={confirmRemove}
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
