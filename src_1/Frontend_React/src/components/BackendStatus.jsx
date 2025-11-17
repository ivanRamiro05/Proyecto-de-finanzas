import { useEffect, useState } from 'react'
import { checkBackendHealth } from '../services/api'

export default function BackendStatus() {
  const [isBackendDown, setIsBackendDown] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  // Verificar estado del backend al montar
  useEffect(() => {
    const checkBackend = async () => {
      setIsChecking(true)
      const isHealthy = await checkBackendHealth()
      setIsBackendDown(!isHealthy)
      setIsChecking(false)
    }

    checkBackend()

    // Escuchar eventos de backend no disponible
    const handleBackendUnavailable = () => {
      setIsBackendDown(true)
    }

    window.addEventListener('backend-unavailable', handleBackendUnavailable)

    // Verificar periódicamente cada 10 segundos
    const interval = setInterval(async () => {
      const isHealthy = await checkBackendHealth()
      setIsBackendDown(!isHealthy)
    }, 10000)

    return () => {
      window.removeEventListener('backend-unavailable', handleBackendUnavailable)
      clearInterval(interval)
    }
  }, [])

  // Mostrar loader mientras verifica
  if (isChecking) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-95 z-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-12 max-w-md mx-4 text-center shadow-2xl">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 border-4 border-emerald-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-emerald-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Verificando conexión...
          </h2>
          <p className="text-gray-600">
            Conectando con el servidor
          </p>
        </div>
      </div>
    )
  }

  // Mostrar mensaje de error si el backend está caído
  if (isBackendDown) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-95 z-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-12 max-w-md mx-4 text-center shadow-2xl">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-5xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Servidor no disponible
          </h2>
          <p className="text-gray-600 mb-6">
            No se puede conectar al servidor backend. Por favor, verifica que el servidor esté en ejecución.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              💡 Pasos para solucionar:
            </p>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Verifica que el backend Django esté corriendo</li>
              <li>Asegúrate de ejecutar <code className="bg-gray-200 px-2 py-0.5 rounded text-xs">python manage.py runserver</code></li>
              <li>Verifica que esté escuchando en <code className="bg-gray-200 px-2 py-0.5 rounded text-xs">http://localhost:8000</code></li>
            </ol>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg hover:shadow-xl"
          >
            🔄 Reintentar conexión
          </button>
        </div>
      </div>
    )
  }

  // Si todo está bien, no mostrar nada
  return null
}
