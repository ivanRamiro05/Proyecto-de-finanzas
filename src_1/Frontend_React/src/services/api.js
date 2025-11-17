import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 10000, // 10 segundos de timeout
})

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Token ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

// Interceptor para manejar errores de conexión
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Error de red o timeout
    if (!error.response) {
      console.error('🔴 Backend no disponible:', error.message)
      // Disparar un evento personalizado para que otros componentes sepan
      window.dispatchEvent(new CustomEvent('backend-unavailable', { 
        detail: { message: 'No se puede conectar al servidor' } 
      }))
    }
    return Promise.reject(error)
  }
)

// Función para verificar si el backend está disponible
export async function checkBackendHealth() {
  try {
    // Intentar hacer una petición al endpoint de admin (público)
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
    const response = await axios.get(`${baseURL.replace('/api', '')}/admin/login/`, { 
      timeout: 5000,
      validateStatus: (status) => status < 500 // Aceptar cualquier respuesta < 500
    })
    return true
  } catch (error) {
    // Solo considerar como "down" si es un error de red (no de HTTP)
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT' || !error.response) {
      console.error('❌ Backend health check failed:', error.message)
      return false
    }
    // Si hay respuesta del servidor (aunque sea error), el backend está up
    return true
  }
}

// Auto-inyectar token desde localStorage si existe
const saved = typeof window !== 'undefined' ? localStorage.getItem('token') : null
if (saved) setAuthToken(saved)

export default api
