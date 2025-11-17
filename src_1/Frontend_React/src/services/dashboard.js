import api from './api'
import { formatCurrency } from '../utils/currency'

const demoData = { overview: { stats: [], pockets: [], categories: [] }, recent: [] }

const POCKETS_KEY = 'demo_pockets'
const TX_KEY = 'demo_transactions'

function readLS(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}

// Función para convertir fecha string a formato local sin problemas de zona horaria
function parseLocalDate(dateString) {
  // Si la fecha viene en formato YYYY-MM-DD, parsearlo como fecha local
  if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day) // month - 1 porque Date usa meses 0-11
  }
  return new Date(dateString)
}

function formatDate(dateString) {
  const date = parseLocalDate(dateString)
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

export async function getOverview(grupoId = null) {
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    const pockets = readLS(POCKETS_KEY)
    const txs = readLS(TX_KEY)
    if (import.meta.env.VITE_DEMO_EMPTY === 'true') return { stats: defaultStats(), pockets: [], categories: [] }

    // Sumar ingresos y gastos de las transacciones
    const incomes = txs.filter(t => t.type === 'income').reduce((a, b) => a + Number(b.amount || 0), 0)
    const expenses = txs.filter(t => t.type === 'expense').reduce((a, b) => a + Number(b.amount || 0), 0)
    const net = incomes - expenses
    
    // Calcular balance total de los bolsillos
    console.log('Pockets:', pockets) // Para debug
    const totalBalance = pockets.reduce((sum, p) => sum + Number(p.balance || p.saldo || 0), 0)
    console.log('Total Balance:', totalBalance) // Para debug

    const stats = [
      { title: 'Balance Total', value: totalBalance, icon: '👛' },
      { title: 'Ingresos', value: incomes, icon: '📈' },
      { title: 'Gastos', value: expenses, icon: '📉' },
      { title: 'Balance Neto', value: net, icon: '🎯' },
    ]

    const pocketCards = pockets.map(p => ({ name: p.name, amount: Number(p.balance || 0), color: p.color || colorForPocket(p.id) }))

    // categorías: suma por categoría sobre gastos
    const catMap = {}
    txs.filter(t => t.type === 'expense').forEach(t => { const k=t.category||'Otros'; catMap[k]=(catMap[k]||0)+Number(t.amount) })
    const categories = Object.entries(catMap).map(([name, val]) => ({ name, amount: val, percent: 100 }))

    return { stats, pockets: pocketCards, categories }
  }
  
  // Backend - agregar grupo_id como query param si existe
  const params = grupoId ? { grupo_id: grupoId } : {}
  
  try {
    const [pocketsRes, ingresosRes, egresosRes] = await Promise.all([
      api.get('/bolsillos/', { params }),
      api.get('/ingresos/', { params }),
      api.get('/egresos/', { params }),
    ])
    
    // Extraer datos de la respuesta
    const pocketsData = Array.isArray(pocketsRes?.data) ? pocketsRes.data : (Array.isArray(pocketsRes) ? pocketsRes : [])
    const ingresosData = Array.isArray(ingresosRes?.data) ? ingresosRes.data : (Array.isArray(ingresosRes) ? ingresosRes : [])
    const egresosData = Array.isArray(egresosRes?.data) ? egresosRes.data : (Array.isArray(egresosRes) ? egresosRes : [])

    console.log('Backend Response - Pockets:', pocketsData)
    console.log('Backend Response - Ingresos:', ingresosData)
    console.log('Backend Response - Egresos:', egresosData)

    // Procesar bolsillos
    const pockets = pocketsData.map(p => ({
      name: p.nombre ?? p.name ?? 'Sin nombre',
      amount: Number(p.balance ?? p.saldo ?? 0),
      color: p.color || '#3b82f6',
    }))

    // Calcular totales
    const ingresos = ingresosData.reduce((a, b) => a + Number(b.monto ?? b.amount ?? 0), 0)
    const egresos = egresosData.reduce((a, b) => a + Number(b.monto ?? b.amount ?? 0), 0)
    const neto = ingresos - egresos
    const totalBalance = pocketsData.reduce((s, p) => s + Number(p.balance ?? p.saldo ?? 0), 0)

    console.log('Calculated totals:', { totalBalance, ingresos, egresos, neto })

    // Estadísticas
    const stats = [
      { title: 'Balance Total', value: totalBalance, icon: '👛' },
      { title: 'Ingresos', value: ingresos, icon: '📈' },
      { title: 'Gastos', value: egresos, icon: '📉' },
      { title: 'Balance Neto', value: neto, icon: '🎯' },
    ]

    // categorías de egresos
    const catMap = {}
    egresosData.forEach(t => {
      const k = t.categoria?.nombre ?? t.categoria ?? t.category ?? 'Otros'
      catMap[k] = (catMap[k] || 0) + Number(t.monto ?? t.amount ?? 0)
    })
    const totalCat = Object.values(catMap).reduce((a,b)=>a+b,0) || 1
    const categories = Object.entries(catMap).map(([name, val]) => ({ 
      name, 
      amount: val,
      percent: Math.round((val/totalCat)*100) 
    }))

    return { stats, pockets, categories }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return { stats: defaultStats(), pockets: [], categories: [] }
  }
}

export async function getRecentTransactions(grupoId = null) {
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    if (import.meta.env.VITE_DEMO_EMPTY === 'true') return []
    const txs = readLS(TX_KEY)
    const pockets = readLS(POCKETS_KEY)
    const pocketName = (id) => pockets.find(p => p.id === id)?.name || (id || 'Sin bolsillo')
    return txs.slice(0, 5).map(t => ({
      title: t.description || (t.type==='income' ? 'Ingreso' : 'Gasto'),
      subtitle: `${t.category || 'Sin categoría'} • ${pocketName(t.pocket)}`,
      amount: Number(t.amount),
      date: formatDate(t.date),
      positive: t.type === 'income',
    }))
  }
  
  // Backend - agregar grupo_id como query param si existe
  const params = grupoId ? { grupo_id: grupoId } : {}
  
  const [ing, egr, pocketsRes] = await Promise.all([
    api.get('/ingresos/', { params }),
    api.get('/egresos/', { params }),
    api.get('/bolsillos/', { params }),
  ])
  
  const pockets = pocketsRes?.data || pocketsRes
  const pname = (bolsilloObj) => {
    // bolsilloObj puede ser un ID o un objeto con información del bolsillo
    if (typeof bolsilloObj === 'object' && bolsilloObj !== null) {
      return bolsilloObj.nombre || bolsilloObj.name || 'Sin bolsillo'
    }
    // Si es solo un ID, buscar en la lista de bolsillos
    const pocket = pockets.find(p => p.bolsillo_id === bolsilloObj || p.id === bolsilloObj)
    return pocket?.nombre || pocket?.name || 'Sin bolsillo'
  }
  const normalize = (arr, type) => (arr?.data || arr).map(t => ({
    title: t.descripcion || (type==='income' ? 'Ingreso' : 'Gasto'),
    subtitle: `${t.categoria?.nombre || t.categoria?.name || 'Sin categoría'} • ${pname(t.bolsillo)}`,
    amount: Number(t.monto ?? t.amount ?? 0),
    date: formatDate(t.fecha ?? t.date),
    positive: type==='income',
    author: t.creado_por_info?.nombre || t.creado_por_info?.email || null,
  }))
  const items = [...normalize(ing, 'income'), ...normalize(egr, 'expense')].sort((a,b)=> new Date(b.date) - new Date(a.date))
  return items.slice(0,5)
}

function defaultStats() {
  return [
    { title: 'Balance Total', value: 0, icon: '👛' },
    { title: 'Ingresos', value: 0, icon: '📈' },
    { title: 'Gastos', value: 0, icon: '📉' },
    { title: 'Balance Neto', value: 0, icon: '🎯' },
  ]
}

function colorForPocket(id) {
  if (id === 'principal') return 'bg-blue-500'
  if (id === 'ahorros') return 'bg-green-500'
  if (id === 'efectivo') return 'bg-amber-500'
  return 'bg-gray-400'
}

export default { getOverview, getRecentTransactions }
