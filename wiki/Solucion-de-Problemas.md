# 🐛 Solución de Problemas

Guía completa para resolver problemas comunes en FinanzApp.

## 📋 Tabla de Contenidos

- [Problemas de Instalación](#problemas-de-instalación)
- [Problemas del Backend](#problemas-del-backend)
- [Problemas del Frontend](#problemas-del-frontend)
- [Problemas de Conexión](#problemas-de-conexión)
- [Problemas de Base de Datos](#problemas-de-base-de-datos)
- [Problemas de Autenticación](#problemas-de-autenticación)

---

## 🔧 Problemas de Instalación

### Error: `python: command not found`

**Síntoma**: Al ejecutar `python` en la terminal, aparece error de comando no encontrado.

**Solución**:
```bash
# Verificar si Python está instalado
python --version
# o
python3 --version

# Si no está instalado, descarga Python 3.12+ desde python.org
```

**Windows**: Asegúrate de marcar "Add Python to PATH" durante la instalación.

---

### Error: `npm: command not found`

**Síntoma**: npm no es reconocido como comando.

**Solución**:
1. Instala Node.js desde [nodejs.org](https://nodejs.org/)
2. Verifica la instalación:
```bash
node --version
npm --version
```

---

### Error: `pip install` falla con errores de permisos

**Síntoma**: 
```
ERROR: Could not install packages due to an EnvironmentError: [Errno 13] Permission denied
```

**Solución**:
```bash
# Usa un entorno virtual (RECOMENDADO)
python -m venv env
env\Scripts\activate  # Windows
source env/bin/activate  # macOS/Linux

pip install -r requirements.txt
```

---

## 🖥️ Problemas del Backend

### Error: `ModuleNotFoundError: No module named 'django'`

**Síntoma**: Django no se encuentra al ejecutar comandos.

**Causa**: El entorno virtual no está activado o Django no está instalado.

**Solución**:
```bash
# 1. Activar entorno virtual
cd Backend_Django
env\Scripts\activate  # Windows
source env/bin/activate  # Linux/Mac

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Verificar instalación
python -m django --version
```

---

### Error: `Port 8000 is already in use`

**Síntoma**: 
```
Error: That port is already in use.
```

**Causa**: Otro proceso está usando el puerto 8000.

**Solución**:

**Opción 1**: Usar otro puerto
```bash
python manage.py runserver 8001
```

**Opción 2**: Matar el proceso (Windows)
```powershell
# Encontrar el proceso
netstat -ano | findstr :8000

# Matar el proceso (reemplaza PID con el número que aparece)
taskkill /PID <PID> /F
```

**Opción 3**: Matar el proceso (Linux/Mac)
```bash
# Encontrar y matar
lsof -ti:8000 | xargs kill -9
```

---

### Error: Migraciones pendientes

**Síntoma**:
```
You have 18 unapplied migration(s).
```

**Solución**:
```bash
python manage.py migrate
```

---

### Error: `CSRF verification failed`

**Síntoma**: Error 403 en peticiones POST/PUT/DELETE.

**Causa**: Problemas de configuración CORS o CSRF.

**Solución**:

En `backend/settings.py`, verifica:
```python
# CORS
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# CSRF (para desarrollo)
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
]
```

---

## ⚛️ Problemas del Frontend

### Error: `npm install` falla

**Síntoma**: Errores al instalar dependencias.

**Solución 1**: Limpiar caché
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Solución 2**: Usar versión compatible de Node.js
```bash
# Verificar versión (debe ser 18+)
node --version

# Si es menor, actualiza Node.js
```

---

### Error: `Port 3000 is already in use`

**Síntoma**: Vite no puede iniciar en el puerto 3000.

**Solución**:

**Opción 1**: Matar el proceso
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

**Opción 2**: Configurar otro puerto

En `vite.config.js`:
```javascript
export default defineConfig({
  server: {
    port: 3001,
  }
})
```

---

### Error: `VITE_API_URL is not defined`

**Síntoma**: La aplicación no puede conectarse al backend.

**Causa**: Archivo `.env` no existe o está mal configurado.

**Solución**:

1. Crear archivo `.env` en `Frontend_React/`:
```env
VITE_API_URL=http://localhost:8000/api
```

2. Reiniciar el servidor de Vite:
```bash
npm run dev
```

---

### Componentes no se actualizan

**Síntoma**: Los cambios en el código no se reflejan en el navegador.

**Solución**:
1. Limpiar caché del navegador (Ctrl + Shift + R)
2. Reiniciar servidor de Vite
3. Verificar HMR (Hot Module Replacement) en consola

---

## 🌐 Problemas de Conexión

### Error: `Network Error` en Axios

**Síntoma**: 
```javascript
Error: Network Error
    at createError (createError.js:16)
```

**Causas Posibles**:
1. Backend no está corriendo
2. URL incorrecta en `.env`
3. Problemas de CORS

**Solución**:

1. **Verificar que el backend esté corriendo**:
```bash
# En otra terminal
cd Backend_Django
python manage.py runserver
```

2. **Verificar URL en `.env`**:
```env
VITE_API_URL=http://localhost:8000/api
```

3. **Verificar CORS en backend** (`settings.py`):
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
```

---

### Error 401: Unauthorized

**Síntoma**: Todas las peticiones devuelven 401.

**Causa**: Token inválido o expirado.

**Solución**:
1. Cerrar sesión y volver a iniciar
2. Verificar que el token se esté enviando correctamente
3. Limpiar localStorage:
```javascript
localStorage.clear()
```

---

### Error 500: Internal Server Error

**Síntoma**: El servidor devuelve error 500.

**Solución**:

1. **Revisar logs del backend**:
```bash
# La terminal donde corre manage.py runserver mostrará el error
```

2. **Activar modo DEBUG** (solo desarrollo):

En `settings.py`:
```python
DEBUG = True
```

3. **Verificar la base de datos**:
```bash
python manage.py check
python manage.py migrate
```

---

## 💾 Problemas de Base de Datos

### Error: `no such table: finances_usuario`

**Síntoma**: Error al hacer queries.

**Causa**: Migraciones no aplicadas.

**Solución**:
```bash
python manage.py migrate
```

---

### Error: Base de datos bloqueada (SQLite)

**Síntoma**:
```
OperationalError: database is locked
```

**Causa**: Otro proceso tiene la BD abierta.

**Solución**:
1. Cierra DB Browser o cualquier cliente de BD
2. Reinicia el servidor de Django
3. Si persiste, elimina archivos `.lock`:
```bash
rm db.sqlite3-journal
```

---

### Resetear la base de datos

**Advertencia**: Esto eliminará TODOS los datos.

```bash
# 1. Eliminar BD
rm db.sqlite3

# 2. Eliminar migraciones (excepto __init__.py)
rm finances/migrations/0*.py

# 3. Crear nuevas migraciones
python manage.py makemigrations

# 4. Aplicar migraciones
python manage.py migrate

# 5. (Opcional) Crear superusuario
python manage.py createsuperuser
```

---

## 🔐 Problemas de Autenticación

### No puedo iniciar sesión

**Síntomas**:
- Credenciales correctas pero no inicia sesión
- Error "Invalid credentials"

**Solución**:

1. **Verificar que el usuario existe**:
```bash
python manage.py shell
>>> from finances.models import Usuario
>>> Usuario.objects.filter(email='tu@email.com').exists()
True
```

2. **Verificar contraseña**:
```python
>>> user = Usuario.objects.get(email='tu@email.com')
>>> user.check_password('tu_password')
True  # Si es False, la contraseña es incorrecta
```

3. **Resetear contraseña**:
```bash
python manage.py shell
>>> from finances.models import Usuario
>>> user = Usuario.objects.get(email='tu@email.com')
>>> user.set_password('nueva_password')
>>> user.save()
```

---

### Token no funciona

**Síntoma**: Aunque tengo token, las peticiones devuelven 401.

**Solución**:

1. **Verificar formato del header**:
```javascript
// Correcto
Authorization: Token abc123...

// Incorrecto
Authorization: Bearer abc123...
```

2. **Generar nuevo token**:
```bash
python manage.py drf_create_token tu@email.com
```

---

## 🆘 Obtener Más Ayuda

Si tu problema no está listado aquí:

1. **Revisa los logs**:
   - Backend: Terminal donde corre `manage.py runserver`
   - Frontend: Consola del navegador (F12)

2. **Busca en Issues de GitHub**:
   - [Issues Abiertos](https://github.com/Cayalam/Gestor_de_finanzas_React/issues)

3. **Crea un Issue**:
   - [Reportar Bug](https://github.com/Cayalam/Gestor_de_finanzas_React/issues/new)
   - Incluye:
     - Descripción del problema
     - Pasos para reproducir
     - Logs de error
     - Sistema operativo y versiones

4. **Consulta la documentación**:
   - [[FAQ|FAQ]]
   - [[Guía de Desarrollo|Guia-de-Desarrollo]]

---

💡 **Tip**: Mantén actualizado el proyecto ejecutando `git pull` regularmente.
