import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirm: '',
    divisa_pref: 'COP' // Siempre COP por defecto
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.password || !form.confirm) {
      setError('Completa todos los campos')
      return
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    try {
      setLoading(true)
      await register({ 
        name: form.name, 
        email: form.email, 
        password: form.password,
        divisa_pref: form.divisa_pref 
      })
      navigate('/login')
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo registrar')
    } finally {
      setLoading(false)
    }
  }

  return (
  <div className="min-h-screen flex items-center justify-center px-6 sm:px-8 py-14 sm:py-20">
      <div className="w-full max-w-xl space-y-16">
        {/* Logo y título */}
        <div className="text-center fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-8 shadow-lg">
            <span className="text-4xl">🎯</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Crea tu cuenta</h1>
          <p className="text-lg text-emerald-100">Comienza a gestionar tus finanzas hoy</p>
        </div>

        {/* Divisor visual antes del formulario */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent"></div>
          </div>
          <div className="relative px-6 py-2 rounded-full bg-white shadow-lg border border-emerald-200 flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <span>📝</span>
            <span>Formulario de Registro</span>
          </div>
        </div>

        {/* Card del formulario */}
        <div className="glass rounded-2xl md:rounded-3xl shadow-2xl p-8 md:p-10 lg:p-12 scale-in">
          <form onSubmit={onSubmit} className="space-y-8">
            {/* Nombre */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700" htmlFor="name">
                Nombre completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">👤</span>
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={onChange}
                  className="input pl-10"
                  placeholder="Juan Pérez"
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700" htmlFor="email">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">📧</span>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onChange}
                  className="input pl-10"
                  placeholder="tu@ejemplo.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700" htmlFor="password">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">🔒</span>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={onChange}
                  className="input pl-10"
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700" htmlFor="confirm">
                Confirmar contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">🔑</span>
                </div>
                <input
                  id="confirm"
                  name="confirm"
                  type="password"
                  value={form.confirm}
                  onChange={onChange}
                  className="input pl-10"
                  placeholder="Repite tu contraseña"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg fade-in">
                <div className="flex items-center">
                  <span className="text-red-500 mr-2">⚠️</span>
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full text-lg py-4"
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  <span>Creando cuenta...</span>
                </>
              ) : (
                <>
                  <span>Crear cuenta</span>
                  <span>✨</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">o</span>
            </div>
          </div>

          {/* Login link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link
                to="/login"
                className="font-semibold text-emerald-600 hover:text-emerald-500 transition-colors"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-emerald-100 text-sm mt-8">
          Únete a miles de usuarios que gestionan sus finanzas 💪
        </p>
      </div>
    </div>
  )
}
