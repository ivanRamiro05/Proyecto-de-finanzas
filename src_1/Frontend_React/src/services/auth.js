import api, { setAuthToken } from './api'

export async function login(email, password) {
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    const fakeToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      btoa(JSON.stringify({ sub: 'demo-user', email, name: 'Usuario Demo', iat: 0, exp: 1893456000 })) +
      '.signature'
    setAuthToken(fakeToken)
    return { token: fakeToken }
  }

  // Llamar al endpoint de token en la raíz del backend para evitar el doble prefijo '/api'
  const BASE = import.meta.env.VITE_API_BASE || ''
  const tokenUrl = `${BASE}/api-token-auth/`
  const res = await api.post(tokenUrl, { username: email, password })
  const data = res.data
  if (data.token) setAuthToken(data.token)
  return data
}

export async function register(payload) {
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    return { message: 'Usuario creado (demo)' }
  }
  // Map frontend field names to backend expected names
  const body = {
    email: payload.email,
    nombre: payload.name || payload.nombre || '',
    password: payload.password,
    divisa_pref: payload.divisa_pref || 'COP',
  }
  try {
    const res = await api.post('/register/', body)
    const data = res.data
    if (data.token) setAuthToken(data.token)
    return data
  } catch (err) {
    // Normalize axios error to throw a useful object for callers
    if (err.response && err.response.data) throw err.response
    throw err
  }
}

export default { login, register }
