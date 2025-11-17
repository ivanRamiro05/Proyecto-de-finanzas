import api from './api'

const LS_KEY = 'demo_users'

function readLS() { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] } }
function writeLS(items) { localStorage.setItem(LS_KEY, JSON.stringify(items)) }

export async function create(user) {
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    const items = readLS(); const item = { id: crypto.randomUUID(), ...user }; items.unshift(item); writeLS(items); return item
  }
  const { data } = await api.post('/usuarios/', user)
  return data
}

export async function list() {
  if (import.meta.env.VITE_DEMO_MODE === 'true') return readLS()
  const { data } = await api.get('/usuarios/')
  return data
}

export async function getById(id) {
  if (import.meta.env.VITE_DEMO_MODE === 'true') return readLS().find(u => u.id === id)
  const { data } = await api.get(`/usuarios/${id}/`)
  return data
}

export async function update(id, payload) {
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    const items = readLS(); const idx = items.findIndex(u=>u.id===id); if (idx>=0) { items[idx] = { ...items[idx], ...payload }; writeLS(items); return items[idx] }
    return null
  }
  const { data } = await api.put(`/usuarios/${id}`, payload)
  return data
}

export async function remove(id) {
  if (import.meta.env.VITE_DEMO_MODE === 'true') { writeLS(readLS().filter(u=>u.id!==id)); return { ok: true } }
  const { data } = await api.delete(`/usuarios/${id}`)
  return data
}

export async function me() {
  const { data } = await api.get('/usuarios/me/')
  return data
}

export async function checkEmailExists(email) {
  try {
    const { data } = await api.get(`/usuarios/check-email/?email=${encodeURIComponent(email)}`)
    return data.exists
  } catch (err) {
    // Si el endpoint no existe, intentar con la lista completa
    try {
      const users = await list()
      return users.some(u => u.email === email)
    } catch {
      return false
    }
  }
}

export default { create, list, getById, update, remove, me, checkEmailExists }
