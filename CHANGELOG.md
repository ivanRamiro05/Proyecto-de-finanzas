# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [2.0.0] - 2025-11-14

### 🎉 Versión Estable

### Añadido
- **Sistema de Grupos**: Gestión compartida de finanzas
  - Creación y administración de grupos
  - Roles de admin y miembro
  - Aportaciones entre miembros
  - Transferencias entre personal y grupos
  
- **Trazabilidad de Transacciones**: 
  - Campo `creado_por` en ingresos y egresos
  - Visualización de quién creó cada transacción
  - Información del autor en Dashboard y Transacciones

- **Mensaje de Bienvenida Personalizado**:
  - Saludo con nombre del usuario en Header
  - Banner de bienvenida en Dashboard
  - Contexto visual entre Personal y Grupo

- **Verificación de Backend**:
  - Detección automática de servidor caído
  - Pantalla de error con instrucciones
  - Reintentos automáticos cada 10 segundos

- **Mejoras de UI/UX**:
  - Colores coherentes con paleta verde/esmeralda
  - Separación visual mejorada entre secciones
  - Animaciones y transiciones suaves
  - Diseño responsive optimizado

### Cambiado
- **Filtrado de Datos**: 
  - Separación correcta entre transacciones personales y de grupo
  - Sin `grupo_id`: solo datos personales (`grupo__isnull=True`)
  - Con `grupo_id`: solo datos del grupo específico

- **Actualización Automática de Contexto**:
  - Los grupos se recargan automáticamente al crear/editar/eliminar
  - No requiere recarga manual de página

- **Gestión de Bolsillos**:
  - Creación con monto inicial transfiere desde General
  - Edición con transferencias bidireccionales
  - Validaciones mejoradas de saldo

### Corregido
- Problema de autenticación mostrando "Usuario" en lugar del nombre
- Dashboard mostrando transacciones de grupo en modo personal
- Error al crear bolsillos con monto inicial
- Error al editar bolsillos (validación de saldo)
- Permisos para editar/eliminar transacciones de grupo
- Health check del backend fallando con 401

### Eliminado
- Archivos de prueba y debugging innecesarios
- Scripts de migración ya aplicados
- Carpeta `env/` duplicada
- `package-lock.json` del backend
- Archivos temporales de testing

## [1.0.0] - 2025-11-01

### Añadido
- **Gestión Personal de Finanzas**:
  - Dashboard con estadísticas
  - Registro de ingresos y egresos
  - Sistema de bolsillos virtuales
  - Categorías personalizadas con colores
  - Gráficos de comparación mensual/anual

- **Autenticación**:
  - Registro de usuarios
  - Login con token
  - Gestión de sesiones

- **Backend API REST**:
  - Django REST Framework
  - Endpoints CRUD completos
  - Autenticación por token
  - Validaciones de datos

- **Frontend React**:
  - SPA con React Router
  - Context API para estado global
  - Componentes reutilizables
  - Diseño con Tailwind CSS

### Tecnologías Base
- Django 5.2.7
- Django REST Framework 3.15.2
- React 18
- Vite
- SQLite
- Tailwind CSS

---

## Tipos de Cambios

- `Añadido` - Nuevas características
- `Cambiado` - Cambios en funcionalidad existente
- `Obsoleto` - Características que se eliminarán pronto
- `Eliminado` - Características eliminadas
- `Corregido` - Corrección de bugs
- `Seguridad` - Cambios de seguridad
