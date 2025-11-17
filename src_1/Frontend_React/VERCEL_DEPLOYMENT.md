# Guía de Despliegue Frontend en Vercel

## Configuración Previa en Railway (Backend)

Antes de desplegar el frontend, obtén la URL de tu backend en Railway:

1. Ve a tu proyecto en Railway
2. Busca la sección **"Settings"** → **"Domains"**
3. Copia la URL pública (ej: `https://tu-proyecto.railway.app`)

## Pasos para Desplegar en Vercel

### 1. Prepara el Proyecto

El proyecto ya está configurado con:
- ✅ `vercel.json` con configuración de build
- ✅ Scripts de build en `package.json`
- ✅ Routing SPA configurado

### 2. Deploy en Vercel

#### Opción A: Desde GitHub (Recomendado)

1. Ve a https://vercel.com/ e inicia sesión
2. Click en **"Add New Project"**
3. **Import** tu repositorio `Proyecto-de-finanzas`
4. Configura el proyecto:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `src_1/Frontend_React`
   - **Build Command**: `npm run build` (auto-detectado)
   - **Output Directory**: `dist` (auto-detectado)

5. **Environment Variables** (IMPORTANTE):
   ```
   VITE_API_URL=https://tu-proyecto.railway.app/api
   ```
   Reemplaza `tu-proyecto.railway.app` con tu URL real de Railway

6. Click en **"Deploy"**

#### Opción B: Desde CLI

```bash
# Instala Vercel CLI
npm i -g vercel

# Navega al directorio del frontend
cd src_1/Frontend_React

# Deploy
vercel

# Configura las variables de entorno cuando te lo pida
# VITE_API_URL=https://tu-proyecto.railway.app/api
```

### 3. Configura CORS en Django (Backend)

Una vez que tengas la URL de Vercel (ej: `https://tu-app.vercel.app`), actualiza las variables de entorno en Railway:

```bash
DJANGO_CORS_ALLOWED_ORIGINS=https://tu-app.vercel.app
DJANGO_CSRF_TRUSTED_ORIGINS=https://tu-app.vercel.app
DJANGO_ALLOWED_HOSTS=.railway.app,tu-app.vercel.app
```

### 4. Verifica el Despliegue

1. Abre tu URL de Vercel
2. Abre las DevTools del navegador (F12) → Console
3. Verifica que no haya errores CORS
4. Prueba el login/registro

## Redeployments Automáticos

Vercel redesplegará automáticamente cuando:
- Hagas push a la rama `main`
- Los cambios estén en `src_1/Frontend_React/`

## Variables de Entorno en Vercel

Para actualizar variables:
1. Ve a tu proyecto en Vercel
2. **Settings** → **Environment Variables**
3. Edita `VITE_API_URL` si cambias la URL del backend
4. Redeploy desde **Deployments** → **"..."** → **"Redeploy"**

## Troubleshooting

### Error: 404 en rutas del frontend
✅ Ya solucionado con `vercel.json` (rewrites a `/index.html`)

### Error: CORS en peticiones API
- Verifica que `DJANGO_CORS_ALLOWED_ORIGINS` incluya tu URL de Vercel
- Verifica que `DJANGO_CSRF_TRUSTED_ORIGINS` incluya tu URL de Vercel

### Error: Backend no disponible
- Verifica que `VITE_API_URL` apunte a tu backend de Railway
- Verifica que el backend esté corriendo en Railway
- Prueba la URL del backend directamente en el navegador

## Dominios Personalizados (Opcional)

Para usar un dominio personalizado:
1. Ve a **Settings** → **Domains** en Vercel
2. Agrega tu dominio
3. Configura los DNS según las instrucciones
4. Actualiza las variables CORS en Railway con tu nuevo dominio
