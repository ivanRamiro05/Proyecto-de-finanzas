import api from './api'

/**
 * Aportar dinero a un grupo
 * Crea un egreso en la cuenta personal del usuario y un ingreso en el grupo
 * @param {number} grupoId - ID del grupo al que se aporta
 * @param {number} monto - Monto a aportar
 * @param {number} bolsilloUsuarioId - ID del bolsillo personal desde donde se toma el dinero
 * @param {number} bolsilloGrupoId - ID del bolsillo del grupo donde se deposita el dinero
 * @returns {Promise} - Información de la aportación creada
 */
export async function contribute(grupoId, monto, bolsilloUsuarioId, bolsilloGrupoId) {
  const { data } = await api.post('/aportaciones/aportar/', {
    grupo_id: grupoId,
    monto: monto,
    bolsillo_usuario_id: bolsilloUsuarioId,
    bolsillo_grupo_id: bolsilloGrupoId,
    fecha: new Date().toISOString().slice(0, 10),
    descripcion: 'Aportación al grupo'
  })
  return data
}

export default { contribute }
