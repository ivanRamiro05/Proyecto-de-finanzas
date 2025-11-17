import api from './api'
const LS_KEY = 'demo_categories'

function readLS() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}
function writeLS(items) {
  localStorage.setItem(LS_KEY, JSON.stringify(items))
  // trigger listeners (dashboard/others)
  localStorage.setItem(LS_KEY, JSON.stringify(items))
}

function normalizeCategory(data) {
  if (!data) return null
  const id = data.categoria_id ?? data.id
  const name = data.nombre ?? data.name
  const tipo = (data.tipo || '').toString().toLowerCase()
  const type = tipo.includes('ing') ? 'income' : 'expense'
  return { id, name, type, color: data.color || '#ef4444' }
}

export async function list(grupoId = null) {
  if (import.meta.env.VITE_DEMO_MODE === 'true') return readLS()
  const params = grupoId ? { grupo_id: grupoId } : {}
  const { data } = await api.get('/categorias/', { params })
  // Normalizar a {id, name, type, color}
  return (data || []).map(c => normalizeCategory(c))
}

export async function create(category, grupoId = null) {
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    const items = readLS()
    const newItem = { id: crypto.randomUUID(), ...category, createdAt: new Date().toISOString() }
    items.unshift(newItem)
    writeLS(items)
    return newItem
  }
  const payload = {
    nombre: category.name ?? category.nombre,
    // Backend expects 'ing' for ingreso and 'eg' for egreso
    tipo: category.type ? (category.type === 'income' ? 'ing' : 'eg') : category.tipo,
    color: category.color ?? '#ef4444',
  }
  // Agregar grupo_id si existe
  if (grupoId) {
    payload.grupo_id = grupoId
  }
  const { data } = await api.post('/categorias/', payload)
  return normalizeCategory(data)
}

export async function remove(id, grupoId = null) {
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    const items = readLS().filter(x => x.id !== id)
    writeLS(items)
    return { ok: true }
  }
  const params = grupoId ? { params: { grupo_id: grupoId } } : {}
  const { data } = await api.delete(`/categorias/${id}/`, params)
  return data
}

export async function getById(id, grupoId = null) {
  if (import.meta.env.VITE_DEMO_MODE === 'true') return readLS().find(x=>x.id===id)
  const params = grupoId ? { params: { grupo_id: grupoId } } : {}
  const { data } = await api.get(`/categorias/${id}/`, params)
  return normalizeCategory(data)
}

export async function update(id, category, grupoId = null) {
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    const items = readLS(); const idx = items.findIndex(x=>x.id===id); if (idx>=0) { items[idx] = { ...items[idx], ...category }; writeLS(items); return items[idx] } return null
  }
  const payload = { nombre: category.name ?? category.nombre, tipo: category.type ? (category.type==='income'?'ing':'eg') : category.tipo }
  const payload2 = { ...payload, color: category.color ?? '#ef4444' }
  const params = grupoId ? { params: { grupo_id: grupoId } } : {}
  const { data } = await api.patch(`/categorias/${id}/`, payload2, params)
  return normalizeCategory(data)
}

export default { list, create, remove, getById, update }
