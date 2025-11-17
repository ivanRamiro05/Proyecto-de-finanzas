import api from './api'

/**
 * Transferir dinero entre bolsillos del mismo contexto (usuario o grupo)
 */
export async function transfer(bolsilloOrigenId, bolsilloDestinoId, monto, descripcion = '') {
  const res = await api.post('/movimientos/transferir/', {
    bolsillo_origen_id: bolsilloOrigenId,
    bolsillo_destino_id: bolsilloDestinoId,
    monto: monto,
    descripcion: descripcion
  })
  return res.data
}
