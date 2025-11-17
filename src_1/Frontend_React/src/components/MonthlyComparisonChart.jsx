import { useMemo } from 'react'
import { Bar, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js'
import { formatCurrency } from '../utils/currency'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend)

export default function MonthlyComparisonChart({ data = [], months = 6 }) {
  const labels = data.map(d => d.month)
  const maxVal = useMemo(() => data.length ? Math.max(...data.map(d => Math.max(d.income, d.expense))) : 0, [data])

  const chartData = {
    labels,
    datasets: [
      {
        type: 'bar',
        label: 'Ingresos',
        data: data.map(d => d.income),
        backgroundColor: 'rgba(34,197,94,0.6)',
        borderColor: 'rgba(34,197,94,1)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        type: 'bar',
        label: 'Gastos',
        data: data.map(d => d.expense),
        backgroundColor: 'rgba(239,68,68,0.6)',
        borderColor: 'rgba(239,68,68,1)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        type: 'line',
        label: 'Neto',
        data: data.map(d => d.net),
        borderColor: 'rgba(59,130,246,1)',
        backgroundColor: 'rgba(59,130,246,0.3)',
        tension: 0,
        spanGaps: false,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed.y
            return `${ctx.dataset.label}: ${formatCurrency(Number(v))}`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        title: { display: true, text: 'Monto ($)' },
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: {
          callback: function(value) {
            return formatCurrency(value)
          }
        }
      },
      x: {
        ticks: { maxRotation: 0 },
      }
    }
  }

  if (!data.length) {
    return <div className="text-sm text-gray-500">No hay datos suficientes para la comparación.</div>
  }

  return (
    <div className="h-72">
      <Bar data={chartData} options={options} />
    </div>
  )
}