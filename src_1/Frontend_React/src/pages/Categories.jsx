import { useEffect, useMemo, useState } from 'react'
import { useGroup } from '../context/GroupContext'
import * as catService from '../services/categories'

const COLORS = [
  '#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#f97316', '#06b6d4'
]

function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-3">
      {COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`w-14 h-14 rounded-xl border-4 shadow-md transition-all hover:scale-110 ${
            value === c ? 'border-white ring-4 ring-indigo-500 scale-110' : 'border-gray-200'
          }`}
          style={{ background: c }}
          aria-label={`Color ${c}`}
        />
      ))}
    </div>
  )
}

function TypeToggle({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        type="button"
        onClick={() => onChange('income')}
        className={`border-2 rounded-2xl p-6 text-center transition-all transform hover:scale-105 ${
          value === 'income'
            ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg scale-105'
            : 'border-gray-200 hover:border-green-300 hover:shadow-md'
        }`}
      >
        <div className="text-4xl mb-2">📈</div>
        <div className="font-bold text-gray-900">Ingreso</div>
        <div className="text-xs text-gray-500 mt-1">Dinero que entra</div>
      </button>
      <button
        type="button"
        onClick={() => onChange('expense')}
        className={`border-2 rounded-2xl p-6 text-center transition-all transform hover:scale-105 ${
          value === 'expense'
            ? 'border-red-500 bg-gradient-to-br from-red-50 to-rose-50 shadow-lg scale-105'
            : 'border-gray-200 hover:border-red-300 hover:shadow-md'
        }`}
      >
        <div className="text-4xl mb-2">📉</div>
        <div className="font-bold text-gray-900">Gasto</div>
        <div className="text-xs text-gray-500 mt-1">Dinero que sale</div>
      </button>
    </div>
  )
}

function CatRow({ it, onDelete, onEdit }) {
  return (
    <div className="group flex items-center justify-between px-5 py-4 border-2 border-gray-100 rounded-2xl bg-gradient-to-br from-white to-gray-50 transition-all hover:shadow-lg hover:scale-105 hover:border-indigo-200">
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-2xl shadow-md group-hover:scale-110 transition-transform"
          style={{ background: it.color }}
        />
        <div>
          <div className="font-bold text-gray-900 text-lg">{it.name}</div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
            <span>{it.type === 'income' ? '📈' : '📉'}</span>
            <span className="font-medium">{it.type === 'income' ? 'Ingreso' : 'Gasto'}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit && onEdit(it)}
          className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold rounded-xl transition-all hover:shadow-md"
        >
          ✏️ Editar
        </button>
        <button
          onClick={() => onDelete && onDelete(it.id)}
          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl transition-all hover:shadow-md"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}

export default function Categories() {
  const { activeGroup } = useGroup()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ id: null, name: '', type: 'expense', color: COLORS[0] })
  const [error, setError] = useState('')
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => {
    (async () => {
      const data = await catService.list(activeGroup)
      setItems(data)
      setLoading(false)
    })()
  }, [activeGroup]) // Recargar cuando cambie el grupo activo

  const canSave = useMemo(() => form.name && form.type && form.color, [form])

  const save = async (e) => {
    e.preventDefault()
    setError('')
    if (!canSave) { setError('Completa los campos'); return }
    try {
      if (form.id) {
        const updated = await catService.update(form.id, form, activeGroup)
        setItems(prev => prev.map(x => x.id === updated.id ? updated : x))
      } else {
        const created = await catService.create(form, activeGroup)
        setItems(prev => [created, ...prev])
      }
      setOpen(false)
      setForm({ id: null, name: '', type: 'expense', color: COLORS[0] })
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Error al guardar la categoría')
    }
  }

  const remove = async (id) => {
    // open confirm modal
    setConfirmId(id)
  }
  const confirmRemove = async () => {
    try {
      await catService.remove(confirmId, activeGroup)
      setItems(prev => prev.filter(x => x.id !== confirmId))
      setConfirmId(null)
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Error al eliminar categoría')
      setConfirmId(null)
    }
  }

  const startEdit = (c) => {
    setForm({ id: c.id, name: c.name, type: c.type, color: c.color })
    setOpen(true)
    setError('')
  }

  const income = items.filter(i => i.type === 'income')
  const expense = items.filter(i => i.type === 'expense')

  return (
  <div className="px-3 sm:px-5 lg:px-10 xl:px-14 2xl:px-18 max-w-[1900px] mx-auto space-y-14 sm:space-y-18 xl:space-y-22 fade-in py-6">
      {/* Header con gradiente */}
  <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-lime-500 text-white rounded-2xl md:rounded-3xl p-8 md:p-10 lg:p-12 shadow-2xl mb-4 sm:mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <span className="text-3xl">🏷️</span>
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold">Categorías</h2>
                <p className="text-indigo-100 text-sm md:text-base">Organiza tus transacciones</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold px-6 py-3 rounded-xl transition-all hover:shadow-xl hover:scale-105 flex items-center gap-2"
          >
            <span className="text-xl">＋</span>
            <span className="hidden md:inline">Nueva Categoría</span>
          </button>
        </div>
      </div>

      {/* Divisor visual tras header */}
  <div className="relative flex items-center justify-center mt-10 sm:mt-12 pb-8 sm:pb-10">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent"></div>
        <div className="absolute px-4 py-1.5 sm:px-6 sm:py-2 rounded-full bg-white shadow-lg border border-emerald-200 flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-700">
          <span>🏷️</span>
          <span>{activeGroup ? 'Categorías del Grupo' : 'Tus Categorías'}</span>
        </div>
      </div>

      {/* Espaciador visual */}
      <div className="w-full h-6"></div>

      {/* Formulario */}
      {open && (
  <div className="bg-white rounded-3xl border border-gray-100 p-12 xl:p-14 shadow-xl scale-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-2xl">🏷️</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {form.id ? 'Editar Categoría' : 'Nueva Categoría'}
              </h3>
              <p className="text-sm text-gray-500">Clasifica tus movimientos</p>
            </div>
          </div>

          <form onSubmit={save} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nombre de la Categoría <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Alimentación, Transporte..."
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Tipo <span className="text-red-500">*</span>
                </label>
                <TypeToggle value={form.type} onChange={(v) => setForm({ ...form, type: v })} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Color <span className="text-red-500">*</span>
              </label>
              <ColorPicker value={form.color} onChange={(c) => setForm({ ...form, color: c })} />
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
                className={`btn btn-primary ${!canSave ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {form.id ? '💾 Actualizar' : '✨ Crear Categoría'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid de Ingresos y Gastos */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-12">
        {/* Ingresos */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
          <div className="px-8 py-6 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <span className="text-xl">📈</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Ingresos</h3>
                <p className="text-xs text-gray-600">{income.length} categorías</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
            {income.length ? (
              income.map((c) => (
                <div key={c.id}>
                  <CatRow it={c} onDelete={remove} onEdit={startEdit} />
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">📈</div>
                <p className="text-gray-500 font-medium">No hay categorías de ingreso</p>
                <p className="text-sm text-gray-400 mt-1">Crea una para empezar</p>
              </div>
            )}
          </div>
        </div>

        {/* Gastos */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
          <div className="px-8 py-6 bg-gradient-to-r from-red-50 to-rose-50 border-b border-red-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                <span className="text-xl">📉</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Gastos</h3>
                <p className="text-xs text-gray-600">{expense.length} categorías</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
            {expense.length ? (
              expense.map((c) => (
                <div key={c.id}>
                  <CatRow it={c} onDelete={remove} onEdit={startEdit} />
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">📉</div>
                <p className="text-gray-500 font-medium">No hay categorías de gasto</p>
                <p className="text-sm text-gray-400 mt-1">Crea una para empezar</p>
              </div>
            )}
          </div>
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
              ¿Estás seguro de que deseas eliminar esta categoría? Esta acción no se puede deshacer y podría afectar las transacciones asociadas.
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
