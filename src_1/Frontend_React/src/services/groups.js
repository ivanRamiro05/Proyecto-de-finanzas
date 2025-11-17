import api from './api'

const LS_KEY = 'demo_groups'

function readLS() { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] } }
function writeLS(items) { localStorage.setItem(LS_KEY, JSON.stringify(items)) }

export async function list() {
  if (import.meta.env.VITE_DEMO_MODE === 'true') return readLS()
  const { data } = await api.get('/grupos/')
  return data
}

export async function create(group) {
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    const items = readLS()
    const newItem = { id: crypto.randomUUID(), nombre: group.nombre, descripcion: group.descripcion || '' }
    items.unshift(newItem)
    writeLS(items)
    return newItem
  }
  const { data } = await api.post('/grupos/', group)
  return data
}

export async function update(id, group) {
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    const items = readLS()
    const idx = items.findIndex(g => g.id === id)
    if (idx >= 0) {
      items[idx] = { ...items[idx], ...group }
      writeLS(items)
      return items[idx]
    }
    return null
  }
  const { data } = await api.put(`/grupos/${id}/`, group)
  return data
}

export async function remove(id) {
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    writeLS(readLS().filter(x => x.id !== id))
    return { ok: true }
  }
  const { data } = await api.delete(`/grupos/${id}/`)
  return data
}

export default { list, create, update, remove }
