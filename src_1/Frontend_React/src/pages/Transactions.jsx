import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useGroup } from '../context/GroupContext'
import { useAuth } from '../context/AuthContext'
import * as txService from '../services/transactions'
import * as catService from '../services/categories'
import * as pocketsService from '../services/pockets'
import * as contributionsService from '../services/contributions'
import * as transfersService from '../services/transfers'
import { formatCurrency } from '../utils/currency'

// Función para formatear fechas sin problemas de zona horaria
function formatLocalDate(dateString) {
  if (!dateString) return ''
  // Si la fecha viene en formato YYYY-MM-DD, parsearlo como fecha local
  if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('es-ES')
  }
  return new Date(dateString).toLocaleDateString('es-ES')
}

function ToggleType({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => onChange('income')}
        className={`relative overflow-hidden border-2 rounded-xl p-6 text-center transition-all duration-300 ${
          value === 'income'
            ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg scale-105'
            : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
        }`}
      >
        <div className="text-4xl mb-2">📈</div>
        <div className="font-bold text-lg">Ingreso</div>
        <div className="text-xs text-gray-500 mt-1">Dinero que entra</div>
      </button>
      <button
        type="button"
        onClick={() => onChange('expense')}
        className={`relative overflow-hidden border-2 rounded-xl p-6 text-center transition-all duration-300 ${
          value === 'expense'
            ? 'border-red-500 bg-gradient-to-br from-red-50 to-pink-50 shadow-lg scale-105'
            : 'border-gray-200 bg-white hover:border-red-300 hover:shadow-md'
        }`}
      >
        <div className="text-4xl mb-2">📉</div>
        <div className="font-bold text-lg">Gasto</div>
        <div className="text-xs text-gray-500 mt-1">Dinero que sale</div>
      </button>
    </div>
  )
}

export default function Transactions() {
  const { activeGroup, getActiveGroupInfo, groups } = useGroup()
  const [open, setOpen] = useState(false)
  const [openContribution, setOpenContribution] = useState(false)
  const [openTransfer, setOpenTransfer] = useState(false)
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [form, setForm] = useState({
    id: null,
    type: 'expense',
    amount: '',
    date: new Date().toISOString().slice(0,10),
    category: '',
    pocket: '',
    description: ''
  })
  const [contributionForm, setContributionForm] = useState({
    grupo: '',
    monto: '',
    bolsillo_usuario: '',
    bolsillo_grupo: ''
  })
  const [transferForm, setTransferForm] = useState({
    bolsillo_origen: '',
    bolsillo_destino: '',
    monto: '',
    descripcion: ''
  })
  const [groupPockets, setGroupPockets] = useState([])
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    (async () => {
      const data = await txService.list(activeGroup)
      setItems(data)
      setLoading(false)
    })()
  }, [activeGroup])

  const [categories, setCategories] = useState([])
  useEffect(() => {
    (async () => {
      const cats = await catService.list(activeGroup)
      setCategories(cats)
    })()
  }, [activeGroup])

  // Recargar categorías si vuelves a la pestaña o cambian en localStorage
  useEffect(() => {
    const reload = async () => setCategories(await catService.list(activeGroup))
    const onStorage = (e) => { if (e.key === 'demo_categories') reload() }
    const onFocus = () => reload()
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', onFocus)
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('focus', onFocus) }
  }, [activeGroup])

  // Limpiar categoría si cambias el tipo y la selección ya no aplica
  useEffect(() => {
    if (!categories.find(c => c.type === form.type && c.name === form.category)) {
      setForm(prev => ({ ...prev, category: '' }))
    }
  }, [form.type, categories])

  const [pockets, setPockets] = useState([])
  useEffect(() => {
    (async () => setPockets(await pocketsService.list(activeGroup)))()
  }, [activeGroup])
  useEffect(() => {
    const reload = async () => setPockets(await pocketsService.list(activeGroup))
    const onStorage = (e) => { if (e.key === 'demo_pockets') reload() }
    const onFocus = () => reload()
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', onFocus)
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('focus', onFocus) }
  }, [activeGroup])

  // Cargar bolsillos del grupo seleccionado para aportaciones
  useEffect(() => {
    if (contributionForm.grupo) {
      (async () => {
        const grupoPockets = await pocketsService.list(Number(contributionForm.grupo))
        setGroupPockets(grupoPockets)
      })()
    } else {
      setGroupPockets([])
    }
  }, [contributionForm.grupo])

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const categoriesByType = useMemo(() => categories.filter(c => c.type === form.type), [categories, form.type])
  const canSave = useMemo(() => Number(form.amount) > 0 && form.date && categoriesByType.length > 0 && !!form.category && pockets.length > 0 && !!form.pocket, [form, categoriesByType, pockets])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (categoriesByType.length === 0) {
  setError(`No hay categorías de ${form.type === 'income' ? 'ingreso' : 'gasto'}. Crea una en la sección Categorías.`)
      return
    }
  if (!form.category) { setError('Selecciona una categoría'); return }
  if (pockets.length === 0) { setError('No hay bolsillos creados. Crea uno en la sección Bolsillos.'); return }
    if (!form.pocket) { setError('Selecciona un bolsillo'); return }
    if (!Number(form.amount) || !form.date) { setError('Completa los campos obligatorios'); return }
    
    try {
      // Permitir enviar tanto id como nombre segÃºn servicio
      const selectedCat = categoriesByType.find(c => (c.id === form.category || c.name === form.category))
      const selectedPocket = pockets.find(p => (p.id === form.pocket || p.name === form.pocket))
      const payload = { 
        ...form, 
        amount: Number(form.amount),
        categoryId: selectedCat?.id, 
        pocketId: selectedPocket?.id,
      }
      
      if (form.id) {
        // Actualizar transacciÃ³n existente
        const updated = await txService.update(form.id, form.type, payload, activeGroup)
        setItems(prev => prev.map(x => x.id === updated.id ? updated : x))
      } else {
        // Crear nueva transacciÃ³n
        const created = await txService.create(payload, activeGroup)
        setItems(prev => [created, ...prev])
      }
      
      setOpen(false)
      setForm({ id: null, type: 'expense', amount: '', date: new Date().toISOString().slice(0,10), category: '', pocket: '', description: '' })
      // trigger dashboard reload in same tab
      localStorage.setItem('demo_transactions', JSON.stringify(JSON.parse(localStorage.getItem('demo_transactions')||'[]')))
    } catch (err) {
      // Capturar errores del backend (ej: saldo insuficiente)
      const detail = err?.response?.data?.detail
      if (detail) {
        setError(detail)
      } else if (err?.response?.data && typeof err.response.data === 'object') {
        // Si es un objeto con mÃºltiples errores
        const errors = Object.values(err.response.data).flat().join(', ')
  setError(errors || 'Error al guardar la transacción')
      } else {
  setError(err?.message || 'Error al guardar la transacción')
      }
    }
  }

  const startEdit = (tx) => {
    setForm({
      id: tx.id,
      type: tx.type,
      amount: String(tx.amount),
      date: tx.date,
      category: tx.categoryId || tx.category,
      pocket: tx.pocketId || tx.pocket,
      description: tx.description || ''
    })
    setOpen(true)
    setError('')
  }

  const remove = async () => {
    if (!confirmDelete) return
    try {
      await txService.remove(confirmDelete.id, confirmDelete.type)
      setItems(prev => prev.filter(x => x.id !== confirmDelete.id))
      localStorage.setItem('demo_transactions', JSON.stringify(JSON.parse(localStorage.getItem('demo_transactions')||'[]')))
      setConfirmDelete(null)
    } catch (err) {
  setError(err?.response?.data?.detail || err?.message || 'Error al eliminar la transacción')
      setConfirmDelete(null)
    }
  }

  const submitContribution = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!contributionForm.grupo || !contributionForm.monto || !contributionForm.bolsillo_usuario || !contributionForm.bolsillo_grupo) {
      setError('Completa todos los campos')
      return
    }

    if (Number(contributionForm.monto) <= 0) {
      setError('El monto debe ser mayor a 0')
      return
    }

    try {
      await contributionsService.contribute(
        Number(contributionForm.grupo),
        Number(contributionForm.monto),
        Number(contributionForm.bolsillo_usuario),
        Number(contributionForm.bolsillo_grupo)
      )
      
      setOpenContribution(false)
      setContributionForm({ grupo: '', monto: '', bolsillo_usuario: '', bolsillo_grupo: '' })
      setGroupPockets([])
      setError('')
      
      // Recargar transacciones
      const data = await txService.list(activeGroup)
      setItems(data)
      
      // Mostrar mensaje de Ã©xito
  alert('✅ Aportación realizada exitosamente')
    } catch (err) {
      const detail = err?.response?.data?.detail
      if (detail) {
        setError(detail)
      } else if (err?.response?.data && typeof err.response.data === 'object') {
        const errors = Object.values(err.response.data).flat().join(', ')
  setError(errors || 'Error al realizar la aportación')
      } else {
  setError(err?.message || 'Error al realizar la aportación')
      }
    }
  }

  const submitTransfer = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!transferForm.bolsillo_origen || !transferForm.bolsillo_destino || !transferForm.monto) {
      setError('Completa todos los campos obligatorios')
      return
    }

    if (Number(transferForm.monto) <= 0) {
      setError('El monto debe ser mayor a 0')
      return
    }

    if (transferForm.bolsillo_origen === transferForm.bolsillo_destino) {
      setError('No puedes transferir al mismo bolsillo')
      return
    }

    try {
      await transfersService.transfer(
        Number(transferForm.bolsillo_origen),
        Number(transferForm.bolsillo_destino),
        Number(transferForm.monto),
        transferForm.descripcion
      )
      
      setOpenTransfer(false)
      setTransferForm({ bolsillo_origen: '', bolsillo_destino: '', monto: '', descripcion: '' })
      setError('')
      
      const data = await txService.list(activeGroup)
      setItems(data)
      const updatedPockets = await pocketsService.list(activeGroup)
      setPockets(updatedPockets)
      
  alert('✅ Transferencia realizada exitosamente')
    } catch (err) {
      const detail = err?.response?.data?.detail
      if (detail) {
        setError(detail)
      } else if (err?.response?.data && typeof err.response.data === 'object') {
        const errors = Object.values(err.response.data).flat().join(', ')
  setError(errors || 'Error al realizar la transferencia')
      } else {
  setError(err?.message || 'Error al realizar la transferencia')
      }
    }
  }
  return (
  <div className="space-y-16 sm:space-y-24 xl:space-y-28 fade-in max-w-[1900px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-8 sm:py-12">
      {/* Header con gradiente */}
  <div className="bg-gradient-to-r from-emerald-500 via-green-600 to-lime-500 rounded-2xl md:rounded-3xl p-8 md:p-10 lg:p-12 text-white shadow-2xl mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Transacciones</h2>
            <p className="text-emerald-100 text-lg">Gestiona tus ingresos y gastos</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!activeGroup && groups.length > 0 && (
              <button
                onClick={() => setOpenContribution(true)}
                className="btn bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-white/30 flex items-center gap-2"
              >
                <span>💰</span>
                <span>Aportar al Grupo</span>
              </button>
            )}
            {activeGroup && pockets.length > 1 && (
              <button
                onClick={() => setOpenTransfer(true)}
                className="btn bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-white/30 flex items-center gap-2"
              >
                <span>🔄</span>
                <span>Transferir</span>
              </button>
            )}
            <button
              onClick={() => setOpen(true)}
              className="btn bg-white text-emerald-600 hover:bg-gray-50 shadow-lg flex items-center gap-2 font-bold"
            >
              <span className="text-xl">＋</span>
              <span>Nueva Transacción</span>
            </button>
          </div>
        </div>
      </div>

      {/* Divisor visual entre header y formulario/listado */}
  <div className="relative flex items-center justify-center mt-10 sm:mt-12 pb-8 sm:pb-10">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent"></div>
        <div className="absolute px-4 py-1.5 sm:px-6 sm:py-2 rounded-full bg-white shadow-lg border border-emerald-200 flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-700">
          <span>{activeGroup ? '👥' : '🧍'}</span>
          <span>{activeGroup ? 'Transacciones del Grupo' : 'Tus Transacciones'}</span>
        </div>
      </div>

      {/* Espaciador visual */}
      <div className="w-full h-6"></div>

      {/* Formulario de nueva transacción */}
      {open && (
  <div className="bg-white rounded-3xl border border-gray-100 p-12 xl:p-14 shadow-xl scale-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
              <span className="text-2xl">📝</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {form.id ? 'Editar Transacción' : 'Nueva Transacción'}
              </h3>
              <p className="text-sm text-gray-500">Registra un ingreso o gasto</p>
            </div>
          </div>
          
          <form onSubmit={submit} className="space-y-10">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Tipo de Transacción</label>
              <ToggleType value={form.type} onChange={(t) => setForm({ ...form, type: t })} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Cantidad <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-base">$</span>
                  <input
                    name="amount"
                    value={form.amount}
                    onChange={onChange}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="input pl-10 text-lg font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Fecha <span className="text-red-500">*</span>
                </label>
                <input name="date" value={form.date} onChange={onChange} type="date" className="input" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Categoría <span className="text-red-500">*</span>
                </label>
                {categoriesByType.length ? (
                  <select name="category" value={form.category} onChange={onChange} className="input">
                    <option value="">Seleccionar categoría</option>
                    {categoriesByType.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
                    No hay categorías de {form.type === 'income' ? 'ingreso' : 'gasto'}.{' '}
                    <Link to="/categories" className="font-semibold underline">Crea una</Link>.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Bolsillo <span className="text-red-500">*</span>
                </label>
                {pockets.length ? (
                  <select name="pocket" value={form.pocket} onChange={onChange} className="input">
                    <option value="">Seleccionar bolsillo</option>
                    {pockets.map(p => <option key={p.id} value={p.id}>{p.name || p.nombre}</option>)}
                  </select>
                ) : (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
                    No hay bolsillos creados.{' '}
                    <Link to="/pockets" className="font-semibold underline">Crea uno</Link>.
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Descripción</label>
              <input
                name="description"
                value={form.description}
                onChange={onChange}
                placeholder="Descripción de la transacción"
                autoComplete="off"
                className="input"
              />
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
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setForm({ id: null, type: 'expense', amount: '', date: new Date().toISOString().slice(0,10), category: '', pocket: '', description: '' })
                  setError('')
                }}
                className="btn btn-ghost"
              >
                Cancelar
              </button>
              <button disabled={!canSave} className="btn btn-primary" type="submit">
                {form.id ? '💾 Actualizar' : '✨ Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de transacciones */}
  <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <span className="text-xl">📋</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Historial de Transacciones</h3>
              <p className="text-xs text-gray-500">{items.length} transacciones registradas</p>
            </div>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="spinner border-indigo-500"></div>
              <span>Cargando...</span>
            </div>
          )}
        </div>
        {items.length ? (
          <div className="divide-y divide-gray-100">
            {items.map(it => (
              <div
                key={it.id}
                className="px-6 py-5 grid grid-cols-12 gap-6 items-center hover:bg-gray-50 transition-colors"
              >
                <div className="col-span-1">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    it.type === 'income'
                      ? 'bg-gradient-to-br from-green-100 to-emerald-100'
                      : 'bg-gradient-to-br from-red-100 to-pink-100'
                  }`}>
                    <span className="text-2xl">{it.type === 'income' ? '📈' : '📉'}</span>
                  </div>
                </div>
                <div className="col-span-3">
                  <div className="font-semibold text-gray-900 truncate">
                    {it.description || (it.type === 'income' ? 'Ingreso' : 'Gasto')}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                      {it.category || it.categoria?.nombre || 'Sin categoría'}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                      {it.pocket || it.bolsillo?.nombre || 'Sin bolsillo'}
                    </span>
                  </div>
                </div>
                {/* Mostrar quién hizo la transacción (tanto en grupos como personales) */}
                <div className="col-span-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <span>👤</span>
                    <span className="truncate">
                      {it.creado_por_info?.nombre || 
                       (it.creado_por_info?.email ? it.creado_por_info.email.split('@')[0] : null) ||
                       it.userName || 
                       (it.userEmail ? it.userEmail.split('@')[0] : 'Sin autor')}
                    </span>
                  </div>
                </div>
                <div className="col-span-2 text-sm text-gray-600">
                  {formatLocalDate(it.date || it.fecha)}
                </div>
                <div className="col-span-2 text-lg font-bold ${it.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                  {it.type === 'income' ? '+' : '-'}{formatCurrency(Number(it.amount))}
                </div>
                <div className="col-span-2 flex items-center gap-3 justify-end">
                  <button
                    onClick={() => startEdit(it)}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => setConfirmDelete(it)}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-8 py-20 text-center">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-lg font-semibold text-gray-900 mb-2">Aún no hay transacciones</p>
            <p className="text-sm text-gray-500">Comienza registrando tu primera transacción</p>
          </div>
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 scale-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🗑️</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Confirmar eliminación</h3>
              <p className="text-gray-600">
                ¿Eliminar esta transacción de{' '}
                <span className="font-semibold">
                  {confirmDelete.type === 'income' ? 'ingreso' : 'gasto'}
                </span>{' '}
                por{' '}
                <span className="font-bold text-red-600">{formatCurrency(Number(confirmDelete.amount))}</span>?
              </p>
              <p className="text-sm text-gray-500 mt-2">Esta acción no se puede deshacer.</p>
            </div>
            <div className="flex gap-3">
              <button
                className="btn btn-ghost flex-1"
                onClick={() => setConfirmDelete(null)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-danger flex-1"
                onClick={remove}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de transferencia entre bolsillos */}
      {openTransfer && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="card p-6 max-w-md mx-4 w-full">
            <h3 className="text-xl font-bold mb-4">🔄 Transferir entre Bolsillos</h3>
            <p className="text-sm text-gray-600 mb-4">
              Mueve dinero de un bolsillo a otro dentro del mismo contexto.
            </p>
            
            <form onSubmit={submitTransfer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Bolsillo Origen</label>
                <select
                  value={transferForm.bolsillo_origen}
                  onChange={(e) => setTransferForm({ ...transferForm, bolsillo_origen: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Selecciona el bolsillo origen</option>
                  {pockets.filter(p => parseFloat(p.balance || p.saldo || 0) > 0).map((p) => (
                    <option key={p.id || p.bolsillo_id} value={p.id || p.bolsillo_id}>
                      {p.name || p.nombre} - Saldo: {formatCurrency(Number(p.balance || p.saldo || 0))}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Bolsillo Destino</label>
                <select
                  value={transferForm.bolsillo_destino}
                  onChange={(e) => setTransferForm({ ...transferForm, bolsillo_destino: e.target.value })}
                  className="input"
                  required
                  disabled={!transferForm.bolsillo_origen}
                >
                  <option value="">
                    {!transferForm.bolsillo_origen ? 'Primero selecciona el origen' : 'Selecciona el destino'}
                  </option>
                  {pockets.filter(p => (p.id || p.bolsillo_id) !== transferForm.bolsillo_origen).map((p) => (
                    <option key={p.id || p.bolsillo_id} value={p.id || p.bolsillo_id}>
                      {p.name || p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Monto</label>
                <div className="flex items-center">
                  <span className="px-3 py-2 border border-r-0 rounded-l-lg bg-white">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={transferForm.monto}
                    onChange={(e) => setTransferForm({ ...transferForm, monto: e.target.value })}
                    placeholder="0.00"
                    className="input rounded-r-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descripción (opcional)</label>
                <input
                  type="text"
                  value={transferForm.descripcion}
                  onChange={(e) => setTransferForm({ ...transferForm, descripcion: e.target.value })}
                  placeholder="Motivo de la transferencia"
                  className="input"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setOpenTransfer(false)
                    setTransferForm({ bolsillo_origen: '', bolsillo_destino: '', monto: '', descripcion: '' })
                    setError('')
                  }} 
                  className="btn"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn bg-blue-600 hover:bg-blue-700 text-white">
                  Transferir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

  {/* Modal de aportación a grupo */}
      {openContribution && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="card p-6 max-w-md mx-4 w-full">
            <h3 className="text-xl font-bold mb-4">💰 Aportar Dinero al Grupo</h3>
            <p className="text-sm text-gray-600 mb-4">
              Selecciona un grupo y el bolsillo desde donde quieres enviar dinero. Esto creará un egreso en tu cuenta y un ingreso en el grupo.
            </p>
            
            <form onSubmit={submitContribution} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Grupo</label>
                <select
                  value={contributionForm.grupo}
                  onChange={(e) => setContributionForm({ ...contributionForm, grupo: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Selecciona un grupo</option>
                  {groups.map((g) => (
                    <option key={g.id || g.grupo_id} value={g.id || g.grupo_id}>
                      {g.nombre || g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Bolsillo de Origen (Personal)</label>
                <select
                  value={contributionForm.bolsillo_usuario}
                  onChange={(e) => setContributionForm({ ...contributionForm, bolsillo_usuario: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Selecciona tu bolsillo</option>
                  {pockets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - Saldo: {formatCurrency(Number(p.balance || 0))}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Monto</label>
                <div className="flex items-center">
                  <span className="px-3 py-2 border border-r-0 rounded-l-lg bg-white">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={contributionForm.monto}
                    onChange={(e) => setContributionForm({ ...contributionForm, monto: e.target.value })}
                    placeholder="0.00"
                    className="input rounded-r-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Bolsillo de Destino (Grupo)</label>
                <select
                  value={contributionForm.bolsillo_grupo}
                  onChange={(e) => setContributionForm({ ...contributionForm, bolsillo_grupo: e.target.value })}
                  className="input"
                  required
                  disabled={!contributionForm.grupo}
                >
                  <option value="">
                    {!contributionForm.grupo ? 'Primero selecciona un grupo' : 'Selecciona el bolsillo del grupo'}
                  </option>
                  {groupPockets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - Saldo: {formatCurrency(Number(p.balance || 0))}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setOpenContribution(false)
                    setContributionForm({ grupo: '', monto: '', bolsillo_usuario: '', bolsillo_grupo: '' })
                    setGroupPockets([])
                    setError('')
                  }} 
                  className="btn"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn bg-purple-600 hover:bg-purple-700 text-white">
                  Aportar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

