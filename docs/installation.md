# Instalación y Configuración

Esta guía te ayudará a configurar el proyecto FinanzApp en tu entorno local.

## 📋 Requisitos del Sistema

### Software Requerido

| Software | Versión Mínima | Versión Recomendada |
|----------|----------------|---------------------|
| Python   | 3.10           | 3.12                |
| Node.js  | 16.x           | 18.x                |
| npm      | 8.x            | 9.x                 |
| Git      | 2.x            | Latest              |

### Verificar Instalaciones

```bash
# Verificar Python
python --version

# Verificar Node.js
node --version

# Verificar npm
npm --version

# Verificar Git
git --version
```

## 🔧 Instalación Paso a Paso

### 1. Clonar el Repositorio

```bash
# HTTPS
git clone https://github.com/Cayalam/Gestor_de_finanzas_React.git

# SSH (si tienes configurada tu llave SSH)
git clone git@github.com:Cayalam/Gestor_de_finanzas_React.git

# Navegar al directorio
cd Gestor_de_finanzas_React/src_1
```

### 2. Configurar el Backend (Django)

#### 2.1 Crear Entorno Virtual

```bash
# Navegar a la carpeta del backend
cd Backend_Django

# Crear entorno virtual
python -m venv .venv
```

#### 2.2 Activar Entorno Virtual

**Windows (PowerShell):**
```powershell
.venv\Scripts\Activate.ps1
```

**Windows (CMD):**
```cmd
.venv\Scripts\activate.bat
```

**macOS/Linux:**
```bash
source .venv/bin/activate
```

#### 2.3 Instalar Dependencias

```bash
# Actualizar pip
python -m pip install --upgrade pip

# Instalar dependencias del proyecto
pip install -r requirements.txt
```

#### 2.4 Configurar Base de Datos

```bash
# Aplicar migraciones
python manage.py migrate

# Crear categorías por defecto (opcional)
python manage.py loaddata initial_categories.json
```

#### 2.5 Crear Superusuario (Opcional)

```bash
python manage.py createsuperuser
```

Ingresa:
- Email
- Nombre
- Contraseña (2 veces)

#### 2.6 Iniciar Servidor

```bash
python manage.py runserver
```

✅ El backend estará disponible en: `http://localhost:8000`
✅ Admin panel: `http://localhost:8000/admin`

### 3. Configurar el Frontend (React)

#### 3.1 Instalar Dependencias

Abre una **nueva terminal** (mantén el backend corriendo):

```bash
# Navegar al frontend
cd Frontend_React

# Instalar dependencias
npm install
```

#### 3.2 Configurar Variables de Entorno

Crea un archivo `.env` en `Frontend_React/`:

```env
# URL del backend
VITE_API_URL=http://localhost:8000/api

# Modo demo (opcional)
VITE_DEMO_MODE=false
VITE_DEMO_EMPTY=false
```

#### 3.3 Iniciar Servidor de Desarrollo

```bash
npm run dev
```

✅ El frontend estará disponible en: `http://localhost:3000`

## 🎯 Verificación de Instalación

### Backend

1. Abre `http://localhost:8000/api/` en tu navegador
2. Deberías ver la lista de endpoints disponibles
3. Abre `http://localhost:8000/admin/` para el panel de administración

### Frontend

1. Abre `http://localhost:3000` en tu navegador
2. Deberías ver la pantalla de login
3. Registra un nuevo usuario o inicia sesión

## 🔍 Solución de Problemas

### Error: "No module named 'django'"

**Causa:** El entorno virtual no está activado o las dependencias no están instaladas.

**Solución:**
```bash
# Activar entorno virtual
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # macOS/Linux

# Instalar dependencias
pip install -r requirements.txt
```

### Error: "Port 8000 is already in use"

**Causa:** El puerto 8000 ya está siendo usado por otro proceso.

**Solución:**
```bash
# Opción 1: Usar otro puerto
python manage.py runserver 8001

# Opción 2: Encontrar y matar el proceso (Windows)
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Opción 2: macOS/Linux
lsof -ti:8000 | xargs kill -9
```

### Error: "CORS policy" en el navegador

**Causa:** El frontend está haciendo peticiones desde un origen diferente.

**Solución:**
Verifica en `backend/settings.py` que:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

### Error: "Servidor no disponible" en el frontend

**Causa:** El backend no está corriendo o hay un problema de conectividad.

**Solución:**
1. Verifica que el backend esté corriendo en `http://localhost:8000`
2. Verifica la variable `VITE_API_URL` en `.env`
3. Revisa la consola del navegador para más detalles

## 🚀 Próximos Pasos

Una vez instalado, continúa con:
- [Guía de Usuario](./user-guide.md)
- [Arquitectura del Sistema](./architecture.md)
- [Desarrollo](./development.md)

## 💡 Consejos

- Mantén dos terminales abiertas: una para backend, otra para frontend
- Usa un IDE como VS Code para mejor experiencia de desarrollo
- Instala las extensiones recomendadas para Python y React
