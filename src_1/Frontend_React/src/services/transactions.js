import api from './api'
const LS_KEY = 'demo_transactions'
const POCKETS_KEY = 'demo_pockets'

function readLS() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}
function writeLS(items) {
  localStorage.setItem(LS_KEY, JSON.stringify(items))
}

function readPockets() {
  try { return JSON.parse(localStorage.getItem(POCKETS_KEY) || '[]') } catch { return [] }
}
function writePockets(items) {
  localStorage.setItem(POCKETS_KEY, JSON.stringify(items))
}
function pocketLabel(id) {
  const map = { principal: 'Cuenta Principal', ahorros: 'Ahorros', efectivo: 'Efectivo' }
  return map[id] || id || 'Sin bolsillo'
}

export async function list(grupoId = null) {
  if (import.meta.env.VITE_DEMO_MODE === 'true') return readLS()
  // Combinar ingresos y egresos en una sola lista normalizada
  const params = grupoId ? { grupo_id: grupoId } : {}
  const [ing, egr] = await Promise.all([
    api.get('/ingresos/', { params }),
    api.get('/egresos/', { params }),
  ])
  const normalize = (arr, type) => (arr?.data || arr).map(x => ({
    id: x.ingreso_id ?? x.egreso_id ?? x.id,
    type,
    amount: Number(x.monto ?? x.amount),
    date: x.fecha ?? x.date,
    category: x.categoria?.nombre ?? x.categoria?.name ?? x.category,
    categoryId: x.categoria?.categoria_id ?? x.categoria?.id ?? x.categoriaId,
    pocket: x.bolsillo?.nombre ?? x.bolsillo?.name ?? x.pocket,
    pocketId: x.bolsillo?.bolsillo_id ?? x.bolsillo?.id ?? x.bolsilloId,
    description: x.descripcion ?? x.description ?? '',
    // Información del usuario que creó la transacción
    creado_por_info: x.creado_por_info ?? null,
    userName: x.usuario?.nombre ?? x.creado_por_info?.nombre ?? null,
    userEmail: x.usuario?.email ?? x.creado_por_info?.email ?? null,
  }))
  const items = [...normalize(ing, 'income'), ...normalize(egr, 'expense')]
  return items.sort((a,b)=> new Date(b.date) - new Date(a.date))
}

export async function create(tx, grupoId = null) {
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    const items = readLS()
    const withId = { ...tx, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    items.unshift(withId)
    writeLS(items)
    // actualizar bolsillos
    if (withId.pocket) {
      const pockets = readPockets()
      const idx = pockets.findIndex(p => p.id === withId.pocket)
      const delta = Number(withId.amount) * (withId.type === 'income' ? 1 : -1)
      if (idx >= 0) {
        pockets[idx] = { ...pockets[idx], balance: Number((pockets[idx].balance || 0)) + delta }
      } else {
        pockets.push({ id: withId.pocket, name: pocketLabel(withId.pocket), balance: delta })
      }
      writePockets(pockets)
    }
    return withId
  }
  // En backend crear según tipo
  const basePayload = {
    monto: tx.amount,
    fecha: tx.date,
    categoria: tx.categoryId ?? tx.category,
    bolsillo: tx.pocketId ?? tx.pocket,
    descripcion: tx.description,
  }
  // Agregar grupo_id si existe
  if (grupoId) {
    basePayload.grupo_id = grupoId
  }
  
  if (tx.type === 'income') {
    const { data } = await api.post('/ingresos/', basePayload)
    return {
      id: data.ingreso_id ?? data.id,
      type: 'income',
      amount: Number(data.monto ?? tx.amount),
      date: data.fecha ?? tx.date,
      category: data.categoria?.nombre ?? tx.category,
      categoryId: data.categoria?.categoria_id ?? data.categoria?.id ?? tx.categoryId,
      pocket: data.bolsillo?.nombre ?? tx.pocket,
      pocketId: data.bolsillo?.bolsillo_id ?? data.bolsillo?.id ?? tx.pocketId,
      description: data.descripcion ?? tx.description,
      creado_por_info: data.creado_por_info ?? null,
      userName: data.creado_por_info?.nombre ?? null,
      userEmail: data.creado_por_info?.email ?? null,
    }
  } else {
    const { data } = await api.post('/egresos/', basePayload)
    return {
      id: data.egreso_id ?? data.id,
      type: 'expense',
      amount: Number(data.monto ?? tx.amount),
      date: data.fecha ?? tx.date,
      category: data.categoria?.nombre ?? tx.category,
      categoryId: data.categoria?.categoria_id ?? data.categoria?.id ?? tx.categoryId,
      pocket: data.bolsillo?.nombre ?? tx.pocket,
      pocketId: data.bolsillo?.bolsillo_id ?? data.bolsillo?.id ?? tx.pocketId,
      description: data.descripcion ?? tx.description,
      creado_por_info: data.creado_por_info ?? null,
      userName: data.creado_por_info?.nombre ?? null,
      userEmail: data.creado_por_info?.email ?? null,
    }
  }
}

export async function remove(id, type) {
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    const items = readLS()
    const tx = items.find(x => x.id === id)
    const rest = items.filter(x => x.id !== id)
    writeLS(rest)
    if (tx && tx.pocket) {
      const pockets = readPockets()
      const idx = pockets.findIndex(p => p.id === tx.pocket)
      const delta = Number(tx.amount) * (tx.type === 'income' ? -1 : 1) // revertir efecto
      if (idx >= 0) {
        pockets[idx] = { ...pockets[idx], balance: Number((pockets[idx].balance || 0)) + delta }
        writePockets(pockets)
      }
    }
    return { ok: true }
  }
  if (type === 'income') {
    const { data } = await api.delete(`/ingresos/${id}/`)
    return data
  } else {
    const { data } = await api.delete(`/egresos/${id}/`)
    return data
  }
}

export async function update(id, type, tx, grupoId = null) {
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    const items = readLS()
    const idx = items.findIndex(x => x.id === id)
    if (idx >= 0) {
      const old = items[idx]
      const updated = { ...old, ...tx }
      items[idx] = updated
      writeLS(items)
      
      // Actualizar bolsillos si cambió el monto o bolsillo
      if (old.pocket || updated.pocket) {
        const pockets = readPockets()
        // Revertir transacción antigua
        if (old.pocket) {
          const oldIdx = pockets.findIndex(p => p.id === old.pocket)
          const oldDelta = Number(old.amount) * (old.type === 'income' ? -1 : 1)
          if (oldIdx >= 0) {
            pockets[oldIdx].balance = Number((pockets[oldIdx].balance || 0)) + oldDelta
          }
        }
        // Aplicar transacción nueva
        if (updated.pocket) {
          const newIdx = pockets.findIndex(p => p.id === updated.pocket)
          const newDelta = Number(updated.amount) * (updated.type === 'income' ? 1 : -1)
          if (newIdx >= 0) {
            pockets[newIdx].balance = Number((pockets[newIdx].balance || 0)) + newDelta
          }
        }
        writePockets(pockets)
      }
      return updated
    }
    return null
  }
  
  const basePayload = {
    monto: tx.amount,
    fecha: tx.date,
    categoria: tx.categoryId ?? tx.category,
    bolsillo: tx.pocketId ?? tx.pocket,
    descripcion: tx.description,
  }
  // Agregar grupo_id si existe
  if (grupoId) {
    basePayload.grupo_id = grupoId
  }
  
  if (type === 'income') {
    const { data } = await api.patch(`/ingresos/${id}/`, basePayload)
    return {
      id: data.ingreso_id ?? data.id,
      type: 'income',
      amount: Number(data.monto ?? tx.amount),
      date: data.fecha ?? tx.date,
      category: data.categoria?.nombre ?? tx.category,
      categoryId: data.categoria?.categoria_id ?? data.categoria?.id ?? tx.categoryId,
      pocket: data.bolsillo?.nombre ?? tx.pocket,
      pocketId: data.bolsillo?.bolsillo_id ?? data.bolsillo?.id ?? tx.pocketId,
      description: data.descripcion ?? tx.description,
      creado_por_info: data.creado_por_info ?? null,
      userName: data.creado_por_info?.nombre ?? null,
      userEmail: data.creado_por_info?.email ?? null,
    }
  } else {
    const { data } = await api.patch(`/egresos/${id}/`, basePayload)
    return {
      id: data.egreso_id ?? data.id,
      type: 'expense',
      amount: Number(data.monto ?? tx.amount),
      date: data.fecha ?? tx.date,
      category: data.categoria?.nombre ?? tx.category,
      categoryId: data.categoria?.categoria_id ?? data.categoria?.id ?? tx.categoryId,
      pocket: data.bolsillo?.nombre ?? tx.pocket,
      pocketId: data.bolsillo?.bolsillo_id ?? data.bolsillo?.id ?? tx.pocketId,
      description: data.descripcion ?? tx.description,
      creado_por_info: data.creado_por_info ?? null,
      userName: data.creado_por_info?.nombre ?? null,
      userEmail: data.creado_por_info?.email ?? null,
    }
  }
}

export default { list, create, remove, update }
