import api from './api'

export async function add({ usuarioId, grupoId, rol }) {
   const { data } = await api.post('/usuario-grupo/', { usuarioId, grupoId, rol })
  return data
}

export async function addByEmail({ email, grupoId, rol = 'miembro' }) {
  const { data } = await api.post('/usuario-grupo/add-by-email/', { 
    email, 
    grupo_id: grupoId,
    rol 
  })
  return data
}

export async function listMembers(grupoId) {
  const { data } = await api.get(`/usuario-grupo/members/${grupoId}/`)
  return data
}

export async function changeRole({ usuarioId, grupoId, nuevoRol }) {
  const { data } = await api.post('/usuario-grupo/change-role/', { 
    usuario_id: usuarioId,
    grupo_id: grupoId,
    nuevo_rol: nuevoRol
  })
  return data
}

export async function listByUsuario(usuarioId) {
  const { data } = await api.get(`/usuario-grupo/usuario/${usuarioId}`)
  return data
}

export async function listByGrupo(grupoId) {
  const { data } = await api.get(`/usuario-grupo/grupo/${grupoId}`)
  return data
}

export async function get(usuarioId, grupoId) {
  const { data } = await api.get(`/usuario-grupo/${usuarioId}/${grupoId}`)
  return data
}

export async function remove(usuarioId, grupoId) {
  const { data } = await api.delete(`/usuario-grupo/${usuarioId}/${grupoId}/`)
  return data
}

export default { add, addByEmail, listMembers, changeRole, listByUsuario, listByGrupo, get, remove }
