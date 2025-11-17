import api from './api'
const LS_KEY = 'demo_pockets'

function readLS() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}
function writeLS(items) {
  localStorage.setItem(LS_KEY, JSON.stringify(items))
}

export async function list(grupoId = null) {
  if (import.meta.env.VITE_DEMO_MODE === 'true') return readLS()
  const params = grupoId ? { grupo_id: grupoId } : {}
  const { data } = await api.get('/bolsillos/', { params })
  return (data || []).map(p => ({ id: p.id ?? p.bolsillo_id ?? p.pk, name: p.nombre ?? p.name, balance: Number(p.balance ?? p.saldo ?? 0), color: p.color || '#3b82f6', icon: p.icono || p.icon || 'wallet' }))
}

export async function create(pocket, grupoId = null) {
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    const items = readLS()
    const newItem = { id: crypto.randomUUID(), balance: 0, color: '#3b82f6', icon: 'wallet', ...pocket }
    items.unshift(newItem)
    writeLS(items)
    return newItem
  }
  const payload = { 
    nombre: pocket.name ?? pocket.nombre, 
    saldo: pocket.balance ?? pocket.saldo ?? 0, 
    color: pocket.color, 
    icono: pocket.icon 
  }
  // Agregar grupo_id si existe
  if (grupoId) {
    payload.grupo_id = grupoId
  }
  const { data } = await api.post('/bolsillos/', payload)
  // Normalizar la forma del objeto para que coincida con list()
  return { id: data.id ?? data.bolsillo_id ?? data.pk, name: data.nombre ?? data.name, balance: Number(data.saldo ?? data.balance ?? 0), color: data.color || '#3b82f6', icon: data.icono || data.icon || 'wallet' }
}

export async function remove(id) {
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    const items = readLS().filter(x => x.id !== id)
    writeLS(items)
    return { ok: true }
  }
  const { data } = await api.delete(`/bolsillos/${id}/`)
  return data
}

export async function getById(id) {
  if (import.meta.env.VITE_DEMO_MODE === 'true') return readLS().find(x=>x.id===id)
  const { data } = await api.get(`/bolsillos/${id}/`)
  return { id: data.id ?? data.bolsillo_id ?? data.pk, name: data.nombre, balance: Number(data.saldo ?? data.balance ?? 0), color: data.color, icon: data.icono || 'wallet' }
}

export async function update(id, payload) {
  if (import.meta.env.VITE_DEMO_MODE === 'true') { const items=readLS(); const idx=items.findIndex(x=>x.id===id); if(idx>=0){ items[idx] = { ...items[idx], ...payload }; writeLS(items); return items[idx] } return null }
  const body = { nombre: payload.name ?? payload.nombre, saldo: payload.balance ?? payload.saldo, color: payload.color, icono: payload.icon }
  const { data } = await api.patch(`/bolsillos/${id}/`, body)
  // Normalizar la respuesta
  return { id: data.id ?? data.bolsillo_id ?? data.pk, name: data.nombre ?? data.name, balance: Number(data.saldo ?? data.balance ?? 0), color: data.color || '#3b82f6', icon: data.icono || data.icon || 'wallet' }
}

export default { list, create, remove, getById, update }
