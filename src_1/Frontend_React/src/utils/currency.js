/**
 * Utilidad para formatear cantidades monetarias en pesos colombianos (COP)
 */

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
})

/**
 * Formatea una cantidad en pesos colombianos
 * @param {number} amount - Cantidad a formatear
 * @returns {string} Cantidad formateada como $X,XXX
 */
export function formatCurrency(amount) {
  const numAmount = Number(amount) || 0
  return copFormatter.format(numAmount)
}

export default formatCurrency