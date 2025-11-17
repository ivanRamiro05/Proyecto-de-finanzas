# Instrucciones para completar la funcionalidad de Transferencias entre Bolsillos

## ✅ Ya implementado (Backend y servicios):

1. ✅ Backend: Endpoint `/api/movimientos/transferir/` creado en `finances/views.py`
2. ✅ Frontend: Servicio `src/services/transfers.js` creado
3. ✅ Frontend: Estado `openTransfer` y `transferForm` agregados en Transactions.jsx
4. ✅ Frontend: Import de `transfersService` agregado

## 📝 Falta agregar manualmente en `Transactions.jsx`:

### 1. Agregar la función `submitTransfer` (ANTES del `return`, línea ~255)

```javascript
const submitTransfer = async (e) => {
  e.preventDefault()
  setError('')
  
  if (!transferForm.bolsillo_origen || !transferForm.bolsillo_destino || !transferForm.monto) {
    setError('Completa todos los campos obligatorios')
    return
  }

  if (Number(transferForm.monto) <= 0) {
    setError('El monto debe ser mayor a 0')
    return
  }

  if (transferForm.bolsillo_origen === transferForm.bolsillo_destino) {
    setError('No puedes transferir al mismo bolsillo')
    return
  }

  try {
    await transfersService.transfer(
      Number(transferForm.bolsillo_origen),
      Number(transferForm.bolsillo_destino),
      Number(transferForm.monto),
      transferForm.descripcion
    )
    
    setOpenTransfer(false)
    setTransferForm({ bolsillo_origen: '', bolsillo_destino: '', monto: '', descripcion: '' })
    setError('')
    
    // Recargar transacciones y bolsillos
    const data = await txService.list(activeGroup)
    setItems(data)
    const updatedPockets = await pocketsService.list(activeGroup)
    setPockets(updatedPockets)
    
    alert('✅ Transferencia realizada exitosamente')
  } catch (err) {
    const detail = err?.response?.data?.detail
    if (detail) {
      setError(detail)
    } else if (err?.response?.data && typeof err.response.data === 'object') {
      const errors = Object.values(err.response.data).flat().join(', ')
      setError(errors || 'Error al realizar la transferencia')
    } else {
      setError(err?.message || 'Error al realizar la transferencia')
    }
  }
}
```

### 2. Agregar el botón "Transferir" (DESPUÉS del botón "Aportar al Grupo", línea ~273)

Busca este código:
```jsx
{!activeGroup && groups.length > 0 && (
  <button 
    onClick={() => setOpenContribution(true)} 
    className="btn bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
  >
    <span>💰</span>
    <span className="hidden md:inline">Aportar al Grupo</span>
  </button>
)}
```

Y agrega DESPUÉS (pero ANTES del botón "Nueva Transacción"):
```jsx
{pockets.length > 1 && (
  <button 
    onClick={() => setOpenTransfer(true)} 
    className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
  >
    <span>🔄</span>
    <span className="hidden md:inline">Transferir</span>
  </button>
)}
```

### 3. Agregar el modal de transferencia (AL FINAL, después del modal de aportación, antes del cierre del div principal)

Busca el cierre del modal de aportación (después de `{/* Modal de aportación a grupo */}`) y agrega:

```jsx
{/* Modal de transferencia entre bolsillos */}
{openTransfer && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="card p-6 max-w-md mx-4 w-full">
      <h3 className="text-xl font-bold mb-4">🔄 Transferir entre Bolsillos</h3>
      <p className="text-sm text-gray-600 mb-4">
        Mueve dinero de un bolsillo a otro {activeGroup ? 'del grupo' : 'personal'}.
      </p>
      
      <form onSubmit={submitTransfer} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Bolsillo de Origen</label>
          <select
            value={transferForm.bolsillo_origen}
            onChange={(e) => setTransferForm({ ...transferForm, bolsillo_origen: e.target.value })}
            className="input"
            required
          >
            <option value="">Selecciona el bolsillo origen</option>
            {pockets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} - Saldo: €{Number(p.balance || 0).toFixed(2)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Bolsillo de Destino</label>
          <select
            value={transferForm.bolsillo_destino}
            onChange={(e) => setTransferForm({ ...transferForm, bolsillo_destino: e.target.value })}
            className="input"
            required
          >
            <option value="">Selecciona el bolsillo destino</option>
            {pockets
              .filter(p => p.id !== Number(transferForm.bolsillo_origen))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - Saldo: €{Number(p.balance || 0).toFixed(2)}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Monto</label>
          <div className="flex items-center">
            <span className="px-3 py-2 border border-r-0 rounded-l-lg bg-white">€</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={transferForm.monto}
              onChange={(e) => setTransferForm({ ...transferForm, monto: e.target.value })}
              placeholder="0.00"
              className="input rounded-r-lg"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Descripción (Opcional)</label>
          <input
            type="text"
            value={transferForm.descripcion}
            onChange={(e) => setTransferForm({ ...transferForm, descripcion: e.target.value })}
            placeholder="Ej: Reorganización de presupuesto"
            className="input"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button 
            type="button" 
            onClick={() => {
              setOpenTransfer(false)
              setTransferForm({ bolsillo_origen: '', bolsillo_destino: '', monto: '', descripcion: '' })
              setError('')
            }} 
            className="btn"
          >
            Cancelar
          </button>
          <button type="submit" className="btn bg-blue-600 hover:bg-blue-700 text-white">
            Transferir
          </button>
        </div>
      </form>
    </div>
  </div>
)}
```

## 🎯 Cómo usar la funcionalidad:

### Para contexto Personal:
1. Ve a Transacciones (en contexto Personal)
2. Haz clic en "🔄 Transferir"
3. Selecciona bolsillo origen (ej: "General")
4. Selecciona bolsillo destino (ej: "Ahorro")
5. Ingresa el monto
6. Opcionalmente agrega una descripción
7. Haz clic en "Transferir"

### Para contexto de Grupo:
1. Cambia al contexto del grupo
2. Ve a Transacciones
3. Haz clic en "🔄 Transferir"
4. Selecciona bolsillo origen (ej: "General")
5. Selecciona bolsillo destino (ej: "Comida")
6. Ingresa el monto
7. Haz clic en "Transferir"

Esto permite distribuir el dinero del bolsillo "General" a otros bolsillos específicos del grupo.

## 📊 Flujo completo de Aportaciones + Transferencias:

```
1. Usuario aporta €100 desde su bolsillo personal → Bolsillo "General" del grupo
2. Cambiar al contexto del grupo
3. Transferir €50 de "General" → nuevo bolsillo "Comida"
4. Transferir €30 de "General" → nuevo bolsillo "Transporte"
5. Queda €20 en "General" para futuras necesidades

Resultado:
- General: €20
- Comida: €50
- Transporte: €30
TOTAL: €100 ✅ (cuadra con el ingreso)
```

## ⚠️ Validaciones implementadas:

- ✅ No se puede transferir al mismo bolsillo
- ✅ Solo se puede transferir entre bolsillos del mismo contexto (personal ↔ personal, grupo ↔ grupo)
- ✅ Se valida saldo suficiente en el bolsillo origen
- ✅ Se crean movimientos de trazabilidad (egreso e ingreso)
- ✅ Actualización atómica de saldos (todo o nada)
