# Guía de Usuario

Bienvenido a **FinanzApp**, tu gestor de finanzas personal y grupal.

## 📋 Tabla de Contenidos

1. [Primeros Pasos](#primeros-pasos)
2. [Panel Principal](#panel-principal)
3. [Gestión Personal](#gestión-personal)
4. [Gestión Grupal](#gestión-grupal)
5. [Funcionalidades Avanzadas](#funcionalidades-avanzadas)
6. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## 🚀 Primeros Pasos

### Registro de Usuario

1. Abre la aplicación en tu navegador: `http://localhost:3000`
2. Haz clic en **"Registrarse"**
3. Completa el formulario:
   - **Nombre**: Tu nombre completo
   - **Email**: Dirección de correo única
   - **Contraseña**: Mínimo 8 caracteres
   - **Divisa**: Selecciona tu moneda preferida (COP, USD, EUR, etc.)
4. Haz clic en **"Crear Cuenta"**

### Inicio de Sesión

1. Ingresa tu **email** y **contraseña**
2. Haz clic en **"Iniciar Sesión"**
3. Serás redirigido al **Dashboard**

---

## 🏠 Panel Principal

El **Dashboard** es tu centro de control financiero.

### Vista Personal

Cuando no hay un grupo seleccionado, verás:

```
┌────────────────────────────────────────┐
│ Bienvenido, Ivan                       │
│ Gestionando finanzas personales        │
└────────────────────────────────────────┘

┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Ingresos  │  │   Egresos   │  │   Balance   │
│  $1,500,000 │  │   $750,000  │  │   $750,000  │
└─────────────┘  └─────────────┘  └─────────────┘

Últimas Transacciones:
• Salario - $1,000,000 (Ingresos)
• Supermercado - $150,000 (Alimentación)
• Arriendo - $500,000 (Vivienda)
```

**Componentes:**
- **Banner de Bienvenida**: Muestra tu nombre
- **Tarjetas de Resumen**: Ingresos, Egresos, Balance
- **Últimas Transacciones**: 5 movimientos recientes
- **Gráficos**: Distribución de gastos por categoría

### Vista Grupal

Cuando seleccionas un grupo:

```
┌────────────────────────────────────────┐
│ Bienvenido, Ivan                       │
│ Gestionando: Familia Pérez             │
└────────────────────────────────────────┘

Miembros: Juan, María, Ivan (3 personas)

[Datos del grupo...]
```

---

## 💼 Gestión Personal

### 1. Bolsillos (Cuentas)

Los **bolsillos** representan tus cuentas bancarias, billeteras o categorías de ahorro.

#### Crear un Bolsillo

1. Ve a la sección **"Bolsillos"**
2. Haz clic en **"Nuevo Bolsillo"**
3. Completa:
   - **Nombre**: Ej. "Ahorros", "Cuenta Bancaria"
   - **Saldo Inicial**: Monto actual
   - **Color**: Para identificación visual
4. Haz clic en **"Guardar"**

**Nota**: Se creará automáticamente un bolsillo **"General"** al registrarte.

#### Editar un Bolsillo

1. Haz clic en el bolsillo a editar
2. Modifica el nombre o color
3. Haz clic en **"Actualizar"**

**⚠️ Importante**: No puedes editar el saldo directamente. Usa transacciones.

#### Eliminar un Bolsillo

1. Haz clic en el ícono de **eliminar** (🗑️)
2. Confirma la acción

**⚠️ Advertencia**: Eliminar un bolsillo eliminará todas sus transacciones asociadas.

---

### 2. Categorías

Las **categorías** clasifican tus ingresos y gastos.

#### Categorías Predeterminadas

- **Ingresos**: Salario, Inversiones, Regalos
- **Gastos**: Alimentación, Transporte, Vivienda, Entretenimiento, Salud, Educación

#### Crear Categoría Personalizada

1. Ve a **"Categorías"**
2. Haz clic en **"Nueva Categoría"**
3. Completa:
   - **Nombre**: Ej. "Freelance"
   - **Tipo**: Ingreso o Egreso
   - **Color**: Para gráficos
4. Haz clic en **"Guardar"**

---

### 3. Transacciones

Las **transacciones** registran tus movimientos financieros.

#### Registrar un Ingreso

1. Ve a **"Transacciones"**
2. Haz clic en **"Nuevo Ingreso"**
3. Completa:
   - **Monto**: Cantidad recibida
   - **Descripción**: Ej. "Pago de salario Noviembre"
   - **Categoría**: Selecciona una categoría de ingresos
   - **Bolsillo**: Cuenta donde se deposita
   - **Fecha**: Fecha del movimiento
4. Haz clic en **"Guardar"**

**Efecto**: El saldo del bolsillo aumentará automáticamente.

#### Registrar un Gasto

1. Haz clic en **"Nuevo Egreso"**
2. Completa los datos similares al ingreso
3. Haz clic en **"Guardar"**

**Efecto**: El saldo del bolsillo disminuirá.

**⚠️ Validación**: No puedes gastar más de lo que tienes en el bolsillo.

#### Editar una Transacción

1. Haz clic en la transacción
2. Modifica los campos necesarios
3. Haz clic en **"Actualizar"**

**Nota**: El saldo se ajustará automáticamente.

#### Eliminar una Transacción

1. Haz clic en el ícono de eliminar
2. Confirma la acción

**Efecto**: El saldo del bolsillo se revertirá.

---

## 👥 Gestión Grupal

### 1. Crear un Grupo

1. Ve a **"Grupos"**
2. Haz clic en **"Nuevo Grupo"**
3. Completa:
   - **Nombre**: Ej. "Familia Pérez"
   - **Descripción**: Propósito del grupo
4. Haz clic en **"Crear"**

**Resultado**: Serás el **creador** del grupo con permisos completos.

---

### 2. Invitar Miembros

1. Dentro del grupo, haz clic en **"Agregar Miembro"**
2. Ingresa el **email** del usuario
3. Haz clic en **"Invitar"**

**Requisito**: El usuario debe estar registrado en FinanzApp.

---

### 3. Gestión de Miembros

#### Ver Miembros

En la sección del grupo verás:

```
Miembros (3):
👤 Ivan Pérez (Creador)
👤 María López
👤 Juan García
```

#### Eliminar Miembro

1. Haz clic en el ícono de eliminar junto al miembro
2. Confirma la acción

**⚠️ Restricción**: Solo el creador puede eliminar miembros.

---

### 4. Finanzas Grupales

#### Crear Bolsillo Grupal

1. **Selecciona el grupo** desde el header
2. Ve a **"Bolsillos"**
3. Crea un nuevo bolsillo (automáticamente será del grupo)

**Nota**: Verás `(Grupo)` junto al nombre del bolsillo.

#### Transacciones Grupales

Cuando un grupo está seleccionado:

1. Todas las transacciones nuevas pertenecen al grupo
2. Se muestra **quién creó la transacción**:

```
Transacciones del Grupo:
• Compras del mes - $200,000
  Creado por: María López
  
• Pago de servicios - $150,000
  Creado por: Juan García
```

#### Editar/Eliminar en Grupos

- **Cualquier miembro** puede crear transacciones
- **Solo el creador de la transacción** puede editarla o eliminarla

---

## 🔧 Funcionalidades Avanzadas

### 1. Transferencias entre Bolsillos

1. Ve a **"Bolsillos"**
2. Selecciona el bolsillo de origen
3. Haz clic en **"Transferir"**
4. Completa:
   - **Bolsillo destino**
   - **Monto**
   - **Descripción** (opcional)
5. Haz clic en **"Transferir"**

**Efecto**: Se descuenta del origen y se suma al destino.

---

### 2. Filtros de Transacciones

En la vista de **Transacciones**, puedes filtrar por:

- **Tipo**: Ingresos o Egresos
- **Categoría**: Alimentación, Transporte, etc.
- **Bolsillo**: Específico o todos
- **Fecha**: Rango personalizado

**Uso**:
1. Selecciona los filtros deseados
2. Los resultados se actualizan automáticamente

---

### 3. Reportes y Estadísticas

El **Dashboard** incluye:

#### Gráfico de Pastel
Muestra la distribución de gastos por categoría:

```
Gastos por Categoría (Este mes):
🟢 Alimentación: 40%
🔵 Transporte: 25%
🟡 Vivienda: 20%
🔴 Entretenimiento: 15%
```

#### Línea de Tendencias
Muestra la evolución de ingresos y egresos mes a mes.

---

### 4. Cambio de Divisa

Para cambiar tu moneda preferida:

1. Ve a **"Perfil"**
2. Selecciona la nueva divisa
3. Haz clic en **"Guardar"**

**Nota**: Esto solo cambia el símbolo mostrado, no convierte montos existentes.

---

## ❓ Preguntas Frecuentes

### ¿Puedo tener múltiples grupos?

Sí, puedes crear y pertenecer a varios grupos simultáneamente.

---

### ¿Qué pasa si elimino un grupo?

Si eres el **creador**:
- Se elimina el grupo
- Se eliminan todos los bolsillos y transacciones del grupo
- Los miembros pierden acceso

Si eres **miembro**:
- Solo te eliminas del grupo (no se borra el grupo)

---

### ¿Puedo mover una transacción personal a un grupo?

No directamente. Deberías:
1. Eliminar la transacción personal
2. Crear una nueva en el grupo

---

### ¿Cómo sé si estoy en modo personal o grupal?

Mira el **header**:
- Personal: *"Gestionando finanzas personales"*
- Grupal: *"Gestionando: [Nombre del Grupo]"*

También puedes ver el selector de grupos en el menú superior.

---

### No puedo editar una transacción del grupo

Solo puedes editar transacciones que **tú creaste**. Si ves:

```
Creado por: María López
```

Y no eres María, no podrás editarla.

---

### ¿Qué hago si el backend no responde?

Verás un mensaje:

```
⚠️ Backend no disponible
El servidor no responde. Por favor, verifica que el backend esté activo.
[Reintentar]
```

**Solución**:
1. Verifica que el servidor Django esté corriendo
2. Revisa la consola del backend para errores
3. Verifica la conexión en `http://localhost:8000/admin/`

---

### ¿Cómo protejo mi cuenta?

**Recomendaciones**:
- Usa una contraseña fuerte (mínimo 8 caracteres)
- No compartas tu token de sesión
- Cierra sesión en dispositivos compartidos

---

### ¿Puedo exportar mis datos?

Actualmente no hay función de exportación integrada, pero puedes:
- Ver todas tus transacciones en la vista de Transacciones
- Tomar capturas de pantalla de los reportes
- *Próximamente*: Exportación a CSV/PDF

---

### ¿Hay límite de transacciones?

No, puedes registrar tantas transacciones como necesites.

---

### ¿Cómo elimino mi cuenta?

Actualmente debes contactar al administrador del sistema. *Próximamente*: Opción de auto-eliminación en el perfil.

---

## 📞 Soporte

Si encuentras problemas o tienes sugerencias:

- **GitHub Issues**: [Reporte de bugs](https://github.com/Cayalam/Gestor_de_finanzas_React/issues)
- **Contribuciones**: Lee [CONTRIBUTING.md](../CONTRIBUTING.md)
- **Email**: ivan.perez@example.com

---

## 🎓 Tips y Mejores Prácticas

### Para Finanzas Personales

1. **Crea bolsillos separados**: Cuenta corriente, Ahorros, Efectivo
2. **Registra transacciones inmediatamente**: No esperes al final del mes
3. **Revisa tu Dashboard semanalmente**: Identifica patrones de gasto
4. **Usa categorías consistentes**: Facilita los reportes

### Para Grupos

1. **Define reglas claras**: ¿Quién registra qué gastos?
2. **Usa descripciones detalladas**: Facilita la rendición de cuentas
3. **Revisa transacciones periódicamente**: Evita sorpresas
4. **Mantén comunicación**: Comenta gastos importantes

---

¡Gracias por usar **FinanzApp**! 💰✨
