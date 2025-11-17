import { useEffect, useState } from 'react'
import { useGroup } from '../context/GroupContext'
import { useAuth } from '../context/AuthContext'
import * as dashboardService from '../services/dashboard'
import * as statsService from '../services/stats'
import { formatCurrency } from '../utils/currency'
import MonthlyComparisonChart from '../components/MonthlyComparisonChart'

function StatCard({ title, value: rawValue, icon, trend }) {
  const value = typeof rawValue === 'string' ? rawValue : formatCurrency(Number(rawValue) || 0)
  
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-between hover:shadow-xl transition-all duration-300 hover:scale-105 group">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500 mb-2">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {trend && (
          <p className={`text-xs mt-2 font-semibold flex items-center gap-1 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
            <span>{trend.positive ? '📈' : '📉'}</span>
            {trend.text}
          </p>
        )}
      </div>
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white grid place-items-center text-3xl shadow-lg group-hover:scale-110 transition-transform">
        {icon}
      </div>
    </div>
  )
}

function PocketItem({ name, amount: rawAmount, color }) {
  const amount = typeof rawAmount === 'string' ? rawAmount : formatCurrency(Number(rawAmount) || 0)
  
  return (
    <div className="flex items-center justify-between bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all duration-200 hover:scale-102">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl grid place-items-center text-white shadow-lg text-xl" style={{ background: color }}>
          💼
        </div>
        <span className="text-sm font-semibold text-gray-700">{name}</span>
      </div>
      <span className="font-bold text-lg text-gray-900">{amount}</span>
    </div>
  )
}

function CategoryBar({ name, rawAmount, percent }) {
  const amount = formatCurrency(rawAmount)
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">{name}</span>
        <span className="text-sm font-bold text-gray-900">{amount}</span>
      </div>
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full transition-all duration-500" 
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function TxRow({ title, subtitle, rawAmount, date, positive, author }) {
  const amount = formatCurrency(Math.abs(rawAmount))
  const sign = positive ? '+' : '-'
  
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-3 rounded-lg transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${positive ? 'bg-green-100' : 'bg-red-100'}`}>
          <span className="text-lg">{positive ? '📈' : '📉'}</span>
        </div>
        <div>
          <p className="font-semibold text-gray-900">{title}</p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{subtitle}</span>
            {author && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <span>👤</span>
                  <span className="font-medium">{author}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold text-lg ${positive ? 'text-green-600' : 'text-red-600'}`}>
          {sign}{amount}
        </p>
        <p className="text-xs text-gray-500">{date}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { activeGroup, getActiveGroupInfo } = useGroup()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [monthly, setMonthly] = useState([])
  const [monthsBack, setMonthsBack] = useState(6)
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [forceUpdate, setForceUpdate] = useState(0)

  // Función para recargar los datos
  const reloadData = () => {
    console.log('Reloading dashboard data...')
    setForceUpdate(prev => prev + 1)
  }

  async function load() {
    console.log('Loading dashboard data...')
    setLoading(true)
    try {
      // Determinar si agrupar por mes o por año
      const groupBy = monthsBack === 12 ? 'year' : 'month'
      
      // Calcular la fecha de referencia según el modo
      let referenceDate = selectedDate
      if (monthsBack === 12) {
        // En modo anual, usar el año seleccionado (diciembre de ese año)
        referenceDate = `${selectedYear}-12`
      }
      
      // Obtener datos de la API
      const overview = await dashboardService.getOverview(activeGroup)
      console.log('Dashboard Overview:', overview)
      const recent = await dashboardService.getRecentTransactions(activeGroup)
      const monthlyData = await statsService.getMonthlyIncomeExpense(activeGroup, monthsBack, groupBy, referenceDate)
      
      // Procesar y actualizar los datos
      const processedData = { 
        stats: overview.stats || [],
        pockets: overview.pockets || [],
        categories: overview.categories || [],
        transactions: recent || []
      }
      console.log('Processed Dashboard Data:', processedData)
      
      setData(processedData)
      setMonthly(monthlyData || [])
    } catch (error) {
      console.error('Error loading dashboard:', error)
      setData({ stats: [], pockets: [], categories: [], transactions: [] })
      setMonthly([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const onStorage = (e) => {
      if (e.key === 'demo_transactions' || e.key === 'demo_pockets') {
        load()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [activeGroup, monthsBack, selectedDate, selectedYear, forceUpdate]) // Recargar cuando cambie el grupo activo, rango, fecha, año o force update

  // Resetear fecha al mes actual cuando no esté en modo Mensual
  useEffect(() => {
    if (monthsBack !== 1) {
      const now = new Date()
      const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      setSelectedDate(currentYearMonth)
    }
  }, [monthsBack])

  const activeGroupInfo = getActiveGroupInfo()
  const contextTitle = activeGroup ? `Dashboard - ${activeGroupInfo?.nombre || 'Grupo'}` : 'Dashboard Financiero'
  const contextSubtitle = activeGroup ? 'Resumen del grupo' : 'Resumen personal de este mes'

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="spinner border-indigo-500 w-12 h-12 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
  <div className="space-y-8 sm:space-y-10 xl:space-y-12 fade-in max-w-[1900px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-8 sm:py-12">
      {/* Mensaje de Bienvenida Personalizado */}
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 rounded-2xl md:rounded-3xl p-6 md:p-8 text-white shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <span className="text-4xl">👋</span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              ¡Bienvenido, {user?.nombre || user?.email?.split('@')[0] || 'Usuario'}!
            </h1>
            <p className="text-emerald-100 text-sm md:text-base mt-1">
              {activeGroup ? `Estás viendo el grupo: ${getActiveGroupInfo()?.nombre || 'Sin nombre'}` : 'Gestiona tus finanzas personales'}
            </p>
          </div>
        </div>
      </div>

      {/* Espaciador */}
      <div className="h-4"></div>
      
      {/* Header */}
  <div className="bg-gradient-to-r from-emerald-500 via-green-600 to-lime-500 rounded-2xl md:rounded-3xl p-8 md:p-10 lg:p-12 text-white shadow-2xl mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">{contextTitle}</h2>
            <p className="text-indigo-100 text-lg">{contextSubtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={reloadData}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-sm font-semibold transition-all"
              title="Recargar datos"
            >
              🔄 Recargar
            </button>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm">
              <span className="text-xl">📅</span>
              <span className="font-semibold">Noviembre 2025</span>
            </div>
          </div>
        </div>
      </div>

      {/* Divisor visual entre estadísticas y secciones detalladas */}
  <div className="relative flex items-center justify-center mt-14 sm:mt-20 pb-10 sm:pb-12">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent"></div>
        <div className="absolute px-4 py-1.5 sm:px-6 sm:py-2 rounded-full bg-white shadow-lg border border-emerald-200 flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-700">
          <span>{activeGroup ? '�' : '🧍'}</span>
          <span>{activeGroup ? 'Detalle del Grupo' : 'Detalle Personal'}</span>
        </div>
      </div>

      {/* Espaciador visual */}
      <div className="w-full h-6"></div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 xl:gap-14 2xl:gap-16">
        {(data.stats && data.stats.length ? data.stats : [
          { title: 'Balance Total', value: 0, icon: '👛' },
          { title: 'Ingresos', value: 0, icon: '📈' },
          { title: 'Gastos', value: 0, icon: '📉' },
          { title: 'Balance Neto', value: 0, icon: '🎯' },
        ]).map((s, i) => (
          <div key={i} className="slide-in" style={{ animationDelay: `${i * 0.1}s` }}>
            <StatCard title={s.title} value={s.value} icon={s.icon} trend={s.trend} />
          </div>
        ))}
      </div>

      {/* Espaciador visual */}
      <div className="w-full h-6"></div>

      {/* Pockets y Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-12 xl:gap-14 2xl:gap-16">
        {/* Bolsillos */}
  <div className="lg:col-span-2 xl:col-span-3 bg-white rounded-3xl border border-gray-100 p-10 xl:p-12 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <span className="text-xl">💼</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Bolsillos</h3>
          </div>
          {data.pockets?.length ? (
            <div className="space-y-5">
              {data.pockets.map((p, i) => (
                <PocketItem key={i} name={p.name} amount={p.amount} color={p.color} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-2 block">💼</span>
              <p>Aún no tienes bolsillos creados</p>
            </div>
          )}
        </div>

        {/* Categorías */}
  <div className="xl:col-span-2 bg-white rounded-3xl border border-gray-100 p-10 xl:p-12 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
              <span className="text-xl">🏷️</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Gastos</h3>
          </div>
          {data.categories?.length ? (
            <div className="space-y-5">
              {data.categories.map((c, i) => (
                <CategoryBar key={i} name={c.name} rawAmount={c.amount} percent={c.percent} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-2 block">🏷️</span>
              <p className="text-sm">Sin gastos categorizados</p>
            </div>
          )}
        </div>
      </div>

      {/* Espaciador visual */}
      <div className="w-full h-6"></div>

      {/* Comparativa Mensual */}
      <div className="bg-white rounded-3xl border border-gray-100 p-12 xl:p-14 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Comparativa Mensual</h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Selector de mes/año - solo visible en modo Mensual */}
            {monthsBack === 1 && (
              <div className="flex items-center gap-2">
                <label htmlFor="selectedDate" className="text-sm font-medium text-gray-600">Periodo:</label>
                <input
                  type="month"
                  id="selectedDate"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  max={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}
                  className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            )}
            {/* Selector de año - solo visible en modo Anual */}
            {monthsBack === 12 && (
              <div className="flex items-center gap-2">
                <label htmlFor="selectedYear" className="text-sm font-medium text-gray-600">Año:</label>
                <select
                  id="selectedYear"
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                  className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}
            {/* Selector de rango */}
            <div className="flex items-center gap-2">
              <label htmlFor="monthsBack" className="text-sm font-medium text-gray-600">Rango:</label>
              <select
                id="monthsBack"
                value={monthsBack}
                onChange={e => setMonthsBack(Number(e.target.value))}
                className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value={1}>Mensual</option>
                <option value={3}>Trimestral</option>
                <option value={6}>Semestral</option>
                <option value={12}>Anual</option>
              </select>
            </div>
          </div>
        </div>
        {monthly.length ? (
          <MonthlyComparisonChart data={monthly} months={monthsBack} />
        ) : (
          <div className="text-center py-12 text-gray-500">
            <span className="text-5xl mb-3 block">📊</span>
            <p>No hay datos suficientes para mostrar la comparativa</p>
          </div>
        )}
      </div>

      {/* Espaciador visual */}
      <div className="w-full h-6"></div>

      {/* Transacciones Recientes */}
      <div className="bg-white rounded-3xl border border-gray-100 p-12 xl:p-14 shadow-xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
            <span className="text-xl">🔁</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Transacciones Recientes</h3>
        </div>
        {data.transactions?.length ? (
          <div className="space-y-2">
            {data.transactions.map((t, i) => (
              <TxRow 
                key={i} 
                title={t.title} 
                subtitle={t.subtitle} 
                rawAmount={t.amount} 
                date={t.date} 
                positive={t.positive}
                author={t.author}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <span className="text-5xl mb-3 block">🔁</span>
            <p>Aún no hay transacciones recientes</p>
          </div>
        )}
      </div>
    </div>
  )
}
