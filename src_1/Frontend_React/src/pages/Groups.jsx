import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useGroup } from '../context/GroupContext'
import { jwtDecode } from 'jwt-decode'
import * as groupsService from '../services/groups'
import * as userGroupService from '../services/userGroup'
import * as usersService from '../services/users'

export default function Groups() {
  const { user } = useAuth()
  const { loadGroups } = useGroup()
  
  // Obtener usuario del token como fallback
  const getUserFromToken = () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        console.log('🎫 Token encontrado:', token.substring(0, 50) + '...')
        const decoded = jwtDecode(token)
        console.log('✅ Token decodificado exitosamente:', decoded)
        return decoded
      }
      console.log('⚠️ No hay token en localStorage')
    } catch (err) {
      console.error('❌ Error decodificando token:', err)
    }
    return null
  }
  
  // DEBUG: Verificar que tenemos el usuario
  useEffect(() => {
    console.log('🔐 Auth user en Groups:', user)
    const tokenUser = getUserFromToken()
    console.log('🎫 Usuario del token directo:', tokenUser)
  }, [user])
  
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ nombre: '', descripcion: '' })
  const [editingGroup, setEditingGroup] = useState(null)
  
  // Estado para roles del usuario en cada grupo
  const [userRoles, setUserRoles] = useState({}) // { grupoId: 'admin' | 'miembro' }
  
  // Estado para miembros al crear grupo
  const [newMembers, setNewMembers] = useState([])
  const [memberEmail, setMemberEmail] = useState('')
  const [memberRole, setMemberRole] = useState('miembro')
  const [createError, setCreateError] = useState('')
  
  // Estado para modal de miembros
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Estado para agregar usuario
  const [emailToAdd, setEmailToAdd] = useState('')
  const [roleToAdd, setRoleToAdd] = useState('miembro')
  const [addingUser, setAddingUser] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    (async () => {
      const data = await groupsService.list()
      setItems(data)
      
      // Cargar roles del usuario en cada grupo
      await loadUserRoles(data)
      
      setLoading(false)
    })()
  }, [])

  const loadUserRoles = async (groups) => {
    const currentUser = user || getUserFromToken()
    if (!currentUser) {
      try {
        const userData = await usersService.me()
        if (userData) {
          await loadUserRolesWithUser(groups, userData)
        }
      } catch (err) {
        console.error('Error obteniendo usuario para roles:', err)
      }
    } else {
      await loadUserRolesWithUser(groups, currentUser)
    }
  }

  const loadUserRolesWithUser = async (groups, currentUser) => {
    const roles = {}
    
    for (const group of groups) {
      try {
        const members = await userGroupService.listMembers(group.id || group.grupo_id)
        const membership = members.find(m => 
          m.usuario_id === currentUser?.usuario_id || 
          m.usuario_id === currentUser?.user_id ||
          m.email === currentUser?.email
        )
        
        if (membership) {
          roles[group.id || group.grupo_id] = membership.rol
        }
      } catch (err) {
        console.error(`Error cargando rol para grupo ${group.nombre}:`, err)
      }
    }
    
    setUserRoles(roles)
  }

  const canSave = useMemo(() => !!form.nombre, [form])

  const addMemberToList = async () => {
    if (!memberEmail.trim()) {
      setCreateError('Ingresa un email válido')
      return
    }
    
    // Verificar si ya está en la lista
    if (newMembers.some(m => m.email === memberEmail.trim())) {
      setCreateError('Este email ya está en la lista')
      return
    }
    
    // Validar que el usuario existe en la base de datos
    setCreateError('Verificando email...')
    try {
      const exists = await usersService.checkEmailExists(memberEmail.trim())
      if (!exists) {
        setCreateError(`El correo "${memberEmail.trim()}" no está registrado en el sistema`)
        return
      }
      
      setNewMembers([...newMembers, { email: memberEmail.trim(), rol: memberRole }])
      setMemberEmail('')
      setMemberRole('miembro')
      setCreateError('')
    } catch (err) {
      setCreateError('Error al verificar el email. Intenta nuevamente.')
    }
  }

  const removeMemberFromList = (email) => {
    setNewMembers(newMembers.filter(m => m.email !== email))
  }

  const save = async (e) => {
    e.preventDefault()
    if (!canSave) return
    
    setCreateError('')
    
    try {
      if (editingGroup) {
        // Actualizar grupo existente
        const updated = await groupsService.update(editingGroup.id || editingGroup.grupo_id, form)
        setItems(prev => prev.map(g => (g.id || g.grupo_id) === (editingGroup.id || editingGroup.grupo_id) ? updated : g))
        
        // Recargar grupos en el contexto
        await loadGroups()
        
        setOpen(false)
        setEditingGroup(null)
        setForm({ nombre: '', descripcion: '' })
      } else {
        // Crear el grupo
        const created = await groupsService.create(form)
        
        // Agregar miembros al grupo
        for (const member of newMembers) {
          try {
            await userGroupService.addByEmail({
              email: member.email,
              grupoId: created.id || created.grupo_id,
              rol: member.rol
            })
          } catch (err) {
            console.error(`Error al agregar ${member.email}:`, err)
            // Continuar con los demás miembros aunque falle uno
          }
        }
        
        setItems(prev => [created, ...prev])
        
        // Recargar grupos en el contexto
        await loadGroups()
        
        setOpen(false)
        setForm({ nombre: '', descripcion: '' })
        setNewMembers([])
        setMemberEmail('')
        setMemberRole('miembro')
      }
    } catch (err) {
      setCreateError(editingGroup ? 'Error al actualizar el grupo' : 'Error al crear el grupo')
    }
  }

  const openEditForm = (group) => {
    setEditingGroup(group)
    setForm({ nombre: group.nombre || group.name, descripcion: group.descripcion || '' })
    setOpen(true)
    setNewMembers([])
    setCreateError('')
  }

  const cancelEdit = () => {
    setOpen(false)
    setEditingGroup(null)
    setForm({ nombre: '', descripcion: '' })
    setNewMembers([])
    setMemberEmail('')
    setCreateError('')
  }

  const remove = async (id) => {
    await groupsService.remove(id)
    setItems(prev => prev.filter(x => x.id !== id))
    
    // Recargar grupos en el contexto
    await loadGroups()
  }

  const openMembersModal = async (group) => {
    setSelectedGroup(group)
    setMembers([])
    setLoadingMembers(true)
    setError('')
    setSuccess('')
    setEmailToAdd('')
    setIsAdmin(false)
    
    try {
      const data = await userGroupService.listMembers(group.id || group.grupo_id)
      setMembers(data)
      
      // Obtener usuario actual (intentar del contexto, token, o del backend)
      let currentUser = user || getUserFromToken()
      
      // Si no se pudo obtener del token, pedirlo al backend
      if (!currentUser) {
        try {
          const userData = await usersService.me()
          currentUser = userData
          console.log('✅ Usuario obtenido del backend:', userData)
        } catch (err) {
          console.error('❌ Error obteniendo usuario del backend:', err)
        }
      }
      
      // DEBUG: Ver qué datos tenemos
      console.log('👤 Usuario actual:', currentUser)
      console.log('👥 Miembros del grupo:', data)
      
      if (!currentUser) {
        console.error('❌ No se pudo obtener información del usuario')
        return
      }
      
      // Verificar si el usuario actual es admin del grupo
      // Comparar por usuario_id, user_id o email para mayor compatibilidad
      const currentUserMembership = data.find(m => 
        m.usuario_id === currentUser?.usuario_id || 
        m.usuario_id === currentUser?.user_id ||
        m.email === currentUser?.email
      )
      
      console.log('🔍 Membership encontrado:', currentUserMembership)
      console.log('🔑 Es admin?', currentUserMembership?.rol === 'admin')
      
      if (currentUserMembership && currentUserMembership.rol === 'admin') {
        setIsAdmin(true)
      }
    } catch (err) {
      setError('Error al cargar los miembros del grupo')
    } finally {
      setLoadingMembers(false)
    }
  }

  const closeMembersModal = () => {
    setSelectedGroup(null)
    setMembers([])
    setEmailToAdd('')
    setError('')
    setSuccess('')
  }

  const addUserByEmail = async (e) => {
    e.preventDefault()
    if (!emailToAdd.trim()) return
    
    setAddingUser(true)
    setError('')
    setSuccess('')
    
    try {
      const result = await userGroupService.addByEmail({
        email: emailToAdd.trim(),
        grupoId: selectedGroup.id || selectedGroup.grupo_id,
        rol: roleToAdd
      })
      
      setSuccess(`Usuario ${result.email} agregado exitosamente como ${roleToAdd}`)
      setEmailToAdd('')
      setRoleToAdd('miembro')
      
      // Recargar miembros
      const data = await userGroupService.listMembers(selectedGroup.id || selectedGroup.grupo_id)
      setMembers(data)
      
      // Recargar grupos en el contexto para actualizar contador de miembros
      await loadGroups()
    } catch (err) {
      const detail = err?.response?.data?.detail
      setError(detail || 'Error al agregar el usuario')
    } finally {
      setAddingUser(false)
    }
  }

  const changeUserRole = async (member, nuevoRol) => {
    setError('')
    setSuccess('')
    
    try {
      await userGroupService.changeRole({
        usuarioId: member.usuario_id,
        grupoId: selectedGroup.id || selectedGroup.grupo_id,
        nuevoRol: nuevoRol
      })
      
      setSuccess(`Rol de ${member.nombre || member.email} cambiado a ${nuevoRol}`)
      
      // Recargar miembros del modal
      const data = await userGroupService.listMembers(selectedGroup.id || selectedGroup.grupo_id)
      setMembers(data)
      
      // Recargar todos los grupos para actualizar userRoles
      const groups = await groupsService.list()
      setItems(groups)
      await loadUserRoles(groups)
      
    } catch (err) {
      const detail = err?.response?.data?.detail
      setError(detail || 'Error al cambiar el rol')
    }
  }

  return (
  <div className="px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 max-w-[1900px] mx-auto space-y-16 sm:space-y-24 xl:space-y-28 fade-in py-8 sm:py-12">
      {/* Header con gradiente */}
  <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-lime-500 text-white rounded-2xl md:rounded-3xl p-8 md:p-10 lg:p-12 shadow-2xl mb-4 sm:mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <span className="text-3xl">👥</span>
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold">Grupos</h2>
                <p className="text-emerald-100 text-sm md:text-base">Comparte finanzas con otros</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="bg-white text-emerald-600 hover:bg-emerald-50 font-bold px-6 py-3 rounded-xl transition-all hover:shadow-xl hover:scale-105 flex items-center gap-2"
          >
            <span className="text-xl">＋</span>
            <span className="hidden md:inline">Nuevo Grupo</span>
          </button>
        </div>
      </div>

      {/* Divisor visual tras header */}
  <div className="relative flex items-center justify-center mt-10 sm:mt-12 pb-8 sm:pb-10">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent"></div>
        <div className="absolute px-4 py-1.5 sm:px-6 sm:py-2 rounded-full bg-white shadow-lg border border-emerald-200 flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-700">
          <span>🧩</span>
          <span>Gestión de Miembros y Roles</span>
        </div>
      </div>

      {/* Espaciador visual */}
      <div className="w-full h-6"></div>

      {/* Formulario de creación/edición */}
      {open && (
  <div className="bg-white rounded-3xl border border-gray-100 p-12 xl:p-14 shadow-xl scale-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {editingGroup ? 'Editar Grupo' : 'Nuevo Grupo'}
              </h3>
              <p className="text-sm text-gray-500">Gestiona tu grupo de finanzas</p>
            </div>
          </div>

          <form onSubmit={save} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nombre del Grupo <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="input"
                  placeholder="Ej: Familia, Amigos, Compañeros..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Descripción</label>
                <input
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className="input"
                  placeholder="Opcional - describe el propósito del grupo"
                />
              </div>

              {/* Sección para agregar miembros - Solo al crear */}
              {!editingGroup && (
                <div className="border-t pt-6">
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Agregar Miembros (opcional)
                  </label>
                  <p className="text-sm p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 mb-4">
                    💡 Serás agregado automáticamente como administrador del grupo
                  </p>
                  <div className="bg-gray-50 p-5 rounded-xl space-y-4">
                    <div className="grid grid-cols-12 gap-3">
                      <input
                        type="email"
                        value={memberEmail}
                        onChange={(e) => setMemberEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        className="input col-span-7"
                      />
                      <select
                        value={memberRole}
                        onChange={(e) => setMemberRole(e.target.value)}
                        className="input col-span-2 text-sm"
                      >
                        <option value="miembro">Miembro</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        type="button"
                        onClick={addMemberToList}
                        className="btn btn-primary col-span-3 whitespace-nowrap"
                      >
                        ➕ Agregar
                      </button>
                    </div>

                    {createError && (
                      <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg">
                        <div className="flex items-center">
                          <span className="text-red-500 mr-2">⚠️</span>
                          <p className="text-sm text-red-700 font-medium">{createError}</p>
                        </div>
                      </div>
                    )}

                    {/* Lista de miembros agregados */}
                    {newMembers.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-bold text-gray-700">Miembros a agregar:</div>
                        {newMembers.map((member) => (
                          <div
                            key={member.email}
                            className="flex items-center justify-between p-3 bg-white border-2 border-gray-200 rounded-xl hover:shadow-md transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                                <span className="text-white text-sm">👤</span>
                              </div>
                              <div>
                                <span className="text-sm font-medium">{member.email}</span>
                                <span
                                  className={`ml-2 text-xs px-2 py-1 rounded-lg ${
                                    member.rol === 'admin'
                                      ? 'bg-blue-100 text-blue-700 font-semibold'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {member.rol}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeMemberFromList(member.email)}
                              className="text-red-600 hover:text-red-800 font-bold px-3 py-1 hover:bg-red-50 rounded-lg transition-all"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-4 pt-6 border-t">
              <button type="button" onClick={cancelEdit} className="btn btn-ghost">
                Cancelar
              </button>
              <button
                disabled={!canSave}
                className={`btn btn-primary ${!canSave ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {editingGroup ? '💾 Actualizar' : '✨ Crear Grupo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Grupos */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            <h3 className="font-bold text-gray-900">Mis Grupos</h3>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-purple-600">
              <div className="spinner w-4 h-4"></div>
              <span>Cargando…</span>
            </div>
          )}
        </div>
        <div className="p-6 space-y-4">
          {items?.length ? (
            items.map((g) => (
              <div
                key={g.id}
                className="relative group border-2 border-gray-100 rounded-2xl p-6 transition-all hover:shadow-xl hover:scale-105 hover:border-purple-200 bg-gradient-to-br from-white to-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <span className="text-2xl">👥</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 text-lg mb-1">
                        {g.nombre || g.name}
                      </div>
                      {g.descripcion && (
                        <div className="text-sm text-gray-500">{g.descripcion}</div>
                      )}
                      {userRoles[g.id || g.grupo_id] === 'admin' && (
                        <div className="mt-2">
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-blue-100 text-blue-700 font-semibold">
                            👑 Administrador
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 flex-wrap">
                  <button
                    onClick={() => openMembersModal(g)}
                    className="flex-1 min-w-[140px] px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold rounded-xl transition-all hover:shadow-md"
                  >
                    👥 Ver Miembros
                  </button>
                  {/* Solo mostrar opciones de gestión si el usuario es admin del grupo */}
                  {userRoles[g.id || g.grupo_id] === 'admin' && (
                    <>
                      <button
                        onClick={() => openEditForm(g)}
                        className="flex-1 min-w-[100px] px-4 py-2 bg-green-50 hover:bg-green-100 text-green-600 font-semibold rounded-xl transition-all hover:shadow-md"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => remove(g.id)}
                        className="flex-1 min-w-[100px] px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl transition-all hover:shadow-md"
                      >
                        🗑️ Eliminar
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">👥</div>
              <p className="text-gray-500 font-medium">No tienes grupos creados</p>
              <p className="text-sm text-gray-400 mt-2">
                Crea tu primer grupo para compartir finanzas
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de miembros */}
      {selectedGroup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 scale-in">
          <div className="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Miembros de "{selectedGroup.nombre || selectedGroup.name}"
                  </h3>
                  <p className="text-sm text-gray-500">Gestiona el equipo</p>
                </div>
              </div>
              <button
                onClick={closeMembersModal}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all"
              >
                <span className="text-xl text-gray-600">✕</span>
              </button>
            </div>

            {/* Formulario para agregar usuario - Solo para admins */}
            {isAdmin && (
              <form
                onSubmit={addUserByEmail}
                className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200"
              >
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Agregar Usuario por Email
                </label>
                <div className="grid grid-cols-12 gap-3">
                  <input
                    type="email"
                    value={emailToAdd}
                    onChange={(e) => setEmailToAdd(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="input col-span-7"
                    disabled={addingUser}
                  />
                  <select
                    value={roleToAdd}
                    onChange={(e) => setRoleToAdd(e.target.value)}
                    className="input col-span-2 text-sm"
                    disabled={addingUser}
                  >
                    <option value="miembro">Miembro</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    type="submit"
                    disabled={!emailToAdd.trim() || addingUser}
                    className={`btn btn-primary col-span-3 whitespace-nowrap ${
                      !emailToAdd.trim() || addingUser ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  >
                    {addingUser ? '⏳ Agregando...' : '➕ Agregar'}
                  </button>
                </div>
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg mt-3">
                    <div className="flex items-center">
                      <span className="text-red-500 mr-2">⚠️</span>
                      <p className="text-sm text-red-700 font-medium">{error}</p>
                    </div>
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded-lg mt-3">
                    <div className="flex items-center">
                      <span className="text-green-500 mr-2">✅</span>
                      <p className="text-sm text-green-700 font-medium">{success}</p>
                    </div>
                  </div>
                )}
              </form>
            )}

            {/* Mensaje para no admins */}
            {!isAdmin && (
              <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-200">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">ℹ️</span>
                  <p className="text-sm text-blue-700 font-medium">
                    Solo los administradores del grupo pueden agregar nuevos miembros
                  </p>
                </div>
              </div>
            )}

            {/* Lista de miembros */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">👤</span>
                <h4 className="text-lg font-bold text-gray-900">Miembros Actuales</h4>
              </div>
              {loadingMembers ? (
                <div className="flex items-center justify-center py-12">
                  <div className="spinner w-8 h-8"></div>
                  <span className="ml-3 text-gray-500">Cargando miembros...</span>
                </div>
              ) : members.length > 0 ? (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.usuario_id}
                      className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-2xl hover:shadow-lg hover:border-purple-200 transition-all bg-gradient-to-br from-white to-gray-50"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                          <span className="text-white text-xl">👤</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-bold text-gray-900">
                              {member.nombre || member.email}
                            </div>
                            {member.es_creador && (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-purple-100 text-purple-700 font-bold">
                                👑 Creador
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                      </div>
                      {/* Si es admin y no es creador, mostrar selector de rol */}
                      {isAdmin && !member.es_creador ? (
                        <select
                          value={member.rol}
                          onChange={(e) => changeUserRole(member, e.target.value)}
                          className="text-sm px-3 py-2 rounded-xl border-2 font-semibold cursor-pointer transition-all hover:shadow-md"
                          style={{
                            backgroundColor: member.rol === 'admin' ? '#DBEAFE' : '#F3F4F6',
                            color: member.rol === 'admin' ? '#1E40AF' : '#374151',
                            borderColor: member.rol === 'admin' ? '#3B82F6' : '#D1D5DB',
                          }}
                        >
                          <option value="miembro">Miembro</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span
                          className={`text-sm px-3 py-2 rounded-xl font-semibold ${
                            member.rol === 'admin'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {member.rol}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">👥</div>
                  <p className="text-gray-500 font-medium">No hay miembros en este grupo aún</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end pt-4 border-t">
              <button
                onClick={closeMembersModal}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
