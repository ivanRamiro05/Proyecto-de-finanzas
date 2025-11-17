# Referencia de API

Documentación completa de los endpoints disponibles en FinanzApp.

## 🌐 Base URL

```
http://localhost:8000/api
```

---

## 🔐 Autenticación

### Obtener Token

**Endpoint**: `POST /api-token-auth/`

**Descripción**: Autentica al usuario y retorna un token de acceso.

**Request Body**:
```json
{
  "username": "ivan@example.com",
  "password": "mypassword123"
}
```

**Response** (200 OK):
```json
{
  "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b"
}
```

**Errores**:
- `400 Bad Request`: Credenciales inválidas

**Uso del Token**:
```http
Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b
```

---

## 👤 Usuarios

### Registrar Usuario

**Endpoint**: `POST /api/usuarios/`

**Descripción**: Crea una nueva cuenta de usuario.

**Request Body**:
```json
{
  "email": "ivan@example.com",
  "nombre": "Ivan Perez",
  "password": "mypassword123",
  "divisa_pref": "COP"
}
```

**Response** (201 Created):
```json
{
  "usuario_id": 1,
  "email": "ivan@example.com",
  "nombre": "Ivan Perez",
  "divisa_pref": "COP"
}
```

**Errores**:
- `400 Bad Request`: Email duplicado o datos inválidos

---

### Obtener Usuario Autenticado

**Endpoint**: `GET /api/usuarios/me/`

**Headers**: `Authorization: Token <token>`

**Descripción**: Obtiene la información del usuario actual.

**Response** (200 OK):
```json
{
  "usuario_id": 1,
  "email": "ivan@example.com",
  "nombre": "Ivan Perez",
  "divisa_pref": "COP"
}
```

---

### Actualizar Usuario

**Endpoint**: `PUT /api/usuarios/{id}/`

**Headers**: `Authorization: Token <token>`

**Request Body**:
```json
{
  "nombre": "Ivan David Perez",
  "divisa_pref": "USD"
}
```

**Response** (200 OK):
```json
{
  "usuario_id": 1,
  "email": "ivan@example.com",
  "nombre": "Ivan David Perez",
  "divisa_pref": "USD"
}
```

---

## 💰 Bolsillos

### Listar Bolsillos

**Endpoint**: `GET /api/bolsillos/`

**Headers**: `Authorization: Token <token>`

**Query Parameters**:
- `grupo_id` (opcional): ID del grupo para filtrar bolsillos grupales

**Ejemplos**:
```
GET /api/bolsillos/              # Bolsillos personales
GET /api/bolsillos/?grupo_id=5   # Bolsillos del grupo 5
```

**Response** (200 OK):
```json
[
  {
    "bolsillo_id": 1,
    "nombre": "General",
    "saldo": 1500000,
    "color": "#3b82f6",
    "usuario": 1,
    "grupo": null
  },
  {
    "bolsillo_id": 2,
    "nombre": "Ahorros",
    "saldo": 500000,
    "color": "#10b981",
    "usuario": 1,
    "grupo": null
  }
]
```

---

### Crear Bolsillo

**Endpoint**: `POST /api/bolsillos/`

**Headers**: `Authorization: Token <token>`

**Request Body** (Personal):
```json
{
  "nombre": "Cuenta Bancaria",
  "saldo": 1000000,
  "color": "#8b5cf6"
}
```

**Request Body** (Grupal):
```json
{
  "nombre": "Fondo Común",
  "saldo": 2000000,
  "color": "#f59e0b",
  "grupo": 5
}
```

**Response** (201 Created):
```json
{
  "bolsillo_id": 3,
  "nombre": "Cuenta Bancaria",
  "saldo": 1000000,
  "color": "#8b5cf6",
  "usuario": 1,
  "grupo": null
}
```

**Errores**:
- `400 Bad Request`: Saldo negativo o datos inválidos
- `403 Forbidden`: No perteneces al grupo especificado

---

### Actualizar Bolsillo

**Endpoint**: `PUT /api/bolsillos/{id}/`

**Headers**: `Authorization: Token <token>`

**Request Body**:
```json
{
  "nombre": "Cuenta de Ahorros",
  "color": "#ec4899"
}
```

**Nota**: El `saldo` no se puede modificar directamente. Usa transacciones.

**Response** (200 OK):
```json
{
  "bolsillo_id": 3,
  "nombre": "Cuenta de Ahorros",
  "saldo": 1000000,
  "color": "#ec4899",
  "usuario": 1,
  "grupo": null
}
```

---

### Eliminar Bolsillo

**Endpoint**: `DELETE /api/bolsillos/{id}/`

**Headers**: `Authorization: Token <token>`

**Response** (204 No Content)

**Errores**:
- `403 Forbidden`: No tienes permiso para eliminar este bolsillo
- `400 Bad Request`: No puedes eliminar el bolsillo "General"

---

## 📊 Categorías

### Listar Categorías

**Endpoint**: `GET /api/categorias/`

**Headers**: `Authorization: Token <token>`

**Response** (200 OK):
```json
[
  {
    "categoria_id": 1,
    "nombre": "Salario",
    "tipo": "ingreso",
    "color": "#10b981"
  },
  {
    "categoria_id": 2,
    "nombre": "Alimentación",
    "tipo": "egreso",
    "color": "#ef4444"
  }
]
```

---

### Crear Categoría

**Endpoint**: `POST /api/categorias/`

**Headers**: `Authorization: Token <token>`

**Request Body**:
```json
{
  "nombre": "Freelance",
  "tipo": "ingreso",
  "color": "#f59e0b"
}
```

**Response** (201 Created):
```json
{
  "categoria_id": 10,
  "nombre": "Freelance",
  "tipo": "ingreso",
  "color": "#f59e0b"
}
```

**Valores Permitidos**:
- `tipo`: `"ingreso"` o `"egreso"`

---

## 💸 Ingresos

### Listar Ingresos

**Endpoint**: `GET /api/ingresos/`

**Headers**: `Authorization: Token <token>`

**Query Parameters**:
- `grupo_id` (opcional): ID del grupo

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "monto": 1500000,
    "descripcion": "Salario Noviembre",
    "fecha": "2025-11-01",
    "categoria": {
      "categoria_id": 1,
      "nombre": "Salario",
      "tipo": "ingreso",
      "color": "#10b981"
    },
    "bolsillo": {
      "bolsillo_id": 1,
      "nombre": "General",
      "saldo": 1500000
    },
    "usuario": 1,
    "grupo": null,
    "creado_por_info": {
      "usuario_id": 1,
      "nombre": "Ivan Perez",
      "email": "ivan@example.com"
    }
  }
]
```

---

### Crear Ingreso

**Endpoint**: `POST /api/ingresos/`

**Headers**: `Authorization: Token <token>`

**Request Body** (Personal):
```json
{
  "monto": 500000,
  "descripcion": "Pago de proyecto freelance",
  "fecha": "2025-11-14",
  "categoria": 10,
  "bolsillo": 1
}
```

**Request Body** (Grupal):
```json
{
  "monto": 300000,
  "descripcion": "Aporte mensual",
  "fecha": "2025-11-14",
  "categoria": 1,
  "bolsillo": 3,
  "grupo": 5
}
```

**Response** (201 Created):
```json
{
  "id": 2,
  "monto": 500000,
  "descripcion": "Pago de proyecto freelance",
  "fecha": "2025-11-14",
  "categoria": {...},
  "bolsillo": {...},
  "usuario": 1,
  "grupo": null,
  "creado_por_info": {
    "usuario_id": 1,
    "nombre": "Ivan Perez",
    "email": "ivan@example.com"
  }
}
```

**Efecto**: El saldo del bolsillo aumenta en `monto`.

**Errores**:
- `400 Bad Request`: Monto negativo o bolsillo no existe
- `403 Forbidden`: No perteneces al grupo especificado

---

### Actualizar Ingreso

**Endpoint**: `PUT /api/ingresos/{id}/`

**Headers**: `Authorization: Token <token>`

**Request Body**:
```json
{
  "monto": 550000,
  "descripcion": "Pago de proyecto (actualizado)"
}
```

**Response** (200 OK): Mismo formato que crear

**Nota**: Solo puedes editar ingresos que **tú creaste**.

---

### Eliminar Ingreso

**Endpoint**: `DELETE /api/ingresos/{id}/`

**Headers**: `Authorization: Token <token>`

**Response** (204 No Content)

**Efecto**: El saldo del bolsillo disminuye en `monto`.

---

## 💳 Egresos

### Listar Egresos

**Endpoint**: `GET /api/egresos/`

**Headers**: `Authorization: Token <token>`

**Query Parameters**:
- `grupo_id` (opcional): ID del grupo

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "monto": 150000,
    "descripcion": "Supermercado del mes",
    "fecha": "2025-11-10",
    "categoria": {
      "categoria_id": 2,
      "nombre": "Alimentación",
      "tipo": "egreso",
      "color": "#ef4444"
    },
    "bolsillo": {
      "bolsillo_id": 1,
      "nombre": "General",
      "saldo": 1350000
    },
    "usuario": 1,
    "grupo": null,
    "creado_por_info": {
      "usuario_id": 1,
      "nombre": "Ivan Perez",
      "email": "ivan@example.com"
    }
  }
]
```

---

### Crear Egreso

**Endpoint**: `POST /api/egresos/`

**Headers**: `Authorization: Token <token>`

**Request Body**:
```json
{
  "monto": 50000,
  "descripcion": "Gasolina",
  "fecha": "2025-11-14",
  "categoria": 3,
  "bolsillo": 1
}
```

**Response** (201 Created): Mismo formato que listar

**Efecto**: El saldo del bolsillo disminuye en `monto`.

**Errores**:
- `400 Bad Request`: Saldo insuficiente en el bolsillo
```json
{
  "detail": "Saldo insuficiente en el bolsillo",
  "saldo_disponible": 1350000
}
```

---

### Actualizar Egreso

**Endpoint**: `PUT /api/egresos/{id}/`

**Headers**: `Authorization: Token <token>`

**Request Body**:
```json
{
  "monto": 60000
}
```

**Response** (200 OK): Mismo formato que crear

---

### Eliminar Egreso

**Endpoint**: `DELETE /api/egresos/{id}/`

**Headers**: `Authorization: Token <token>`

**Response** (204 No Content)

**Efecto**: El saldo del bolsillo aumenta en `monto` (revertir el gasto).

---

## 👥 Grupos

### Listar Grupos

**Endpoint**: `GET /api/grupos/`

**Headers**: `Authorization: Token <token>`

**Response** (200 OK):
```json
[
  {
    "grupo_id": 1,
    "nombre": "Familia Pérez",
    "descripcion": "Finanzas familiares",
    "fecha_creacion": "2025-10-01",
    "creador": {
      "usuario_id": 1,
      "nombre": "Ivan Perez",
      "email": "ivan@example.com"
    }
  }
]
```

---

### Crear Grupo

**Endpoint**: `POST /api/grupos/`

**Headers**: `Authorization: Token <token>`

**Request Body**:
```json
{
  "nombre": "Roommates Casa 5",
  "descripcion": "Gastos compartidos de la casa"
}
```

**Response** (201 Created):
```json
{
  "grupo_id": 2,
  "nombre": "Roommates Casa 5",
  "descripcion": "Gastos compartidos de la casa",
  "fecha_creacion": "2025-11-14",
  "creador": {
    "usuario_id": 1,
    "nombre": "Ivan Perez",
    "email": "ivan@example.com"
  }
}
```

**Efecto**: Eres agregado automáticamente como miembro del grupo.

---

### Actualizar Grupo

**Endpoint**: `PUT /api/grupos/{id}/`

**Headers**: `Authorization: Token <token>`

**Request Body**:
```json
{
  "nombre": "Casa Verde",
  "descripcion": "Nueva descripción"
}
```

**Response** (200 OK): Mismo formato que crear

**Restricción**: Solo el **creador** puede editar el grupo.

---

### Eliminar Grupo

**Endpoint**: `DELETE /api/grupos/{id}/`

**Headers**: `Authorization: Token <token>`

**Response** (204 No Content)

**Restricción**: Solo el **creador** puede eliminar el grupo.

**Efecto**: Se eliminan todos los bolsillos y transacciones del grupo.

---

## 🤝 Membresía de Grupos

### Listar Miembros de un Grupo

**Endpoint**: `GET /api/grupos/{grupo_id}/miembros/`

**Headers**: `Authorization: Token <token>`

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "usuario": {
      "usuario_id": 1,
      "nombre": "Ivan Perez",
      "email": "ivan@example.com"
    },
    "fecha_union": "2025-10-01"
  },
  {
    "id": 2,
    "usuario": {
      "usuario_id": 2,
      "nombre": "María López",
      "email": "maria@example.com"
    },
    "fecha_union": "2025-10-05"
  }
]
```

---

### Agregar Miembro a Grupo

**Endpoint**: `POST /api/usuario-grupo/`

**Headers**: `Authorization: Token <token>`

**Request Body**:
```json
{
  "grupo": 1,
  "email": "juan@example.com"
}
```

**Response** (201 Created):
```json
{
  "id": 3,
  "usuario": {
    "usuario_id": 3,
    "nombre": "Juan García",
    "email": "juan@example.com"
  },
  "grupo": 1,
  "fecha_union": "2025-11-14"
}
```

**Errores**:
- `400 Bad Request`: Usuario no existe o ya es miembro
- `403 Forbidden`: No tienes permiso para agregar miembros

---

### Eliminar Miembro de Grupo

**Endpoint**: `DELETE /api/usuario-grupo/{id}/`

**Headers**: `Authorization: Token <token>`

**Response** (204 No Content)

**Restricción**: Solo el **creador** del grupo puede eliminar miembros.

---

## 🔄 Transferencias

### Transferir entre Bolsillos

**Endpoint**: `POST /api/bolsillos/{id}/transferir/`

**Headers**: `Authorization: Token <token>`

**Request Body**:
```json
{
  "bolsillo_destino": 2,
  "monto": 100000,
  "descripcion": "Ahorro mensual"
}
```

**Response** (200 OK):
```json
{
  "mensaje": "Transferencia exitosa",
  "bolsillo_origen": {
    "bolsillo_id": 1,
    "nombre": "General",
    "saldo": 1250000
  },
  "bolsillo_destino": {
    "bolsillo_id": 2,
    "nombre": "Ahorros",
    "saldo": 600000
  }
}
```

**Errores**:
- `400 Bad Request`: Saldo insuficiente
```json
{
  "detail": "Saldo insuficiente",
  "saldo_disponible": 1250000
}
```

---

## 📈 Estadísticas

### Obtener Resumen Financiero

**Endpoint**: `GET /api/resumen/`

**Headers**: `Authorization: Token <token>`

**Query Parameters**:
- `grupo_id` (opcional): ID del grupo
- `mes` (opcional): Filtrar por mes (formato: `2025-11`)

**Response** (200 OK):
```json
{
  "total_ingresos": 2000000,
  "total_egresos": 750000,
  "balance": 1250000,
  "por_categoria": [
    {
      "categoria": "Alimentación",
      "total": 300000,
      "porcentaje": 40
    },
    {
      "categoria": "Transporte",
      "total": 200000,
      "porcentaje": 26.67
    }
  ],
  "periodo": "2025-11"
}
```

---

## 🎨 Códigos de Estado HTTP

| Código | Significado |
|--------|-------------|
| `200 OK` | Solicitud exitosa |
| `201 Created` | Recurso creado exitosamente |
| `204 No Content` | Eliminación exitosa |
| `400 Bad Request` | Datos inválidos o restricción de negocio |
| `401 Unauthorized` | Token inválido o ausente |
| `403 Forbidden` | No tienes permiso |
| `404 Not Found` | Recurso no encontrado |
| `500 Internal Server Error` | Error del servidor |

---

## 🛡️ Manejo de Errores

### Formato de Error Estándar

```json
{
  "detail": "Mensaje descriptivo del error",
  "campo_especifico": ["Error de validación en este campo"]
}
```

### Ejemplos

**Validación de Formulario**:
```json
{
  "email": ["Este campo es requerido"],
  "monto": ["Asegúrese de que este valor sea mayor o igual a 0"]
}
```

**Error de Negocio**:
```json
{
  "detail": "No puedes eliminar el bolsillo General",
  "codigo": "BOLSILLO_GENERAL_NO_ELIMINABLE"
}
```

---

## 📝 Notas Adicionales

### Paginación

Todos los endpoints de listado soportan paginación:

```
GET /api/ingresos/?page=2&page_size=50
```

**Response**:
```json
{
  "count": 150,
  "next": "http://localhost:8000/api/ingresos/?page=3",
  "previous": "http://localhost:8000/api/ingresos/?page=1",
  "results": [...]
}
```

---

### Ordenamiento

Usa el parámetro `ordering`:

```
GET /api/ingresos/?ordering=-fecha        # Más recientes primero
GET /api/egresos/?ordering=monto          # Menor a mayor
```

---

### Búsqueda

Usa el parámetro `search`:

```
GET /api/ingresos/?search=salario
GET /api/egresos/?search=supermercado
```

---

### CORS

El backend está configurado con CORS permitiendo:
- `http://localhost:3000` (Frontend React)

Para otros orígenes, modifica `CORS_ALLOWED_ORIGINS` en `settings.py`.

---

### Rate Limiting

Actualmente **no hay** rate limiting. Se recomienda implementarlo en producción.

---

## 🧪 Ejemplos con cURL

### Registro
```bash
curl -X POST http://localhost:8000/api/usuarios/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "nombre": "Usuario Prueba",
    "password": "testpass123",
    "divisa_pref": "COP"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api-token-auth/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test@example.com",
    "password": "testpass123"
  }'
```

### Crear Ingreso
```bash
curl -X POST http://localhost:8000/api/ingresos/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token YOUR_TOKEN_HERE" \
  -d '{
    "monto": 100000,
    "descripcion": "Prueba de ingreso",
    "fecha": "2025-11-14",
    "categoria": 1,
    "bolsillo": 1
  }'
```

---

¿Tienes dudas sobre algún endpoint? Consulta el código fuente en `finances/views.py` o abre un issue en GitHub.
