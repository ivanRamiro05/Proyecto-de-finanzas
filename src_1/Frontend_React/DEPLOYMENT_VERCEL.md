# Despliegue Frontend (Vite + React) en Vercel

## 1. Preparación
- El proyecto usa Vite y ya incluye script `build`.
- Variable de entorno principal: `VITE_API_URL` apuntando al backend en Railway.
- Archivo `vercel.json` agregado para definir `buildCommand`, `routes` SPA y `outputDirectory`.
- Revisar `.env.example` para variables locales.

## 2. Pasos en Vercel
1. Inicia sesión en https://vercel.com/.
2. Importa el repositorio desde GitHub.
3. En la configuración del proyecto selecciona la carpeta del frontend: `src_1/Frontend_React`.
4. Configura Build & Output si Vercel no lo detecta automáticamente:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
5. Añade Variables de Entorno:
   - `VITE_API_URL=https://<tu-backend>.up.railway.app/api`
   - Opcional: `VITE_DEMO_MODE=false`, `VITE_DEMO_EMPTY=false`
6. Deploy.

## 3. Reescrituras / Rutas
El archivo `vercel.json` fuerza todas las rutas a `index.html` para soportar React Router.

## 4. Verificación post-deploy
- Abre la URL de Vercel y revisa en DevTools `Network` las peticiones hacia `VITE_API_URL`.
- Si recibes errores CORS, añade el dominio de Vercel en `DJANGO_CORS_ALLOWED_ORIGINS` en Railway y redeploy backend.

## 5. Entornos (Environment)
- Para previews (Pull Requests) puedes usar otra variable `VITE_API_URL` apuntando a un backend staging.
- Usa "Environment Variables" en Vercel para Production / Preview / Development.

## 6. Cache y optimización
- Vercel sirve estáticos con cache agresivo; para invalidar un deploy, simplemente realiza otro push.
- Tailwind ya se purga automáticamente al construir con Vite.

## 7. Migración a dominio propio
- Agrega dominio en Vercel y luego ajusta `DJANGO_CORS_ALLOWED_ORIGINS` incluyendo `https://tu-dominio.com`.

## 8. Troubleshooting
| Problema | Causa | Solución |
|----------|-------|----------|
| 404 al refrescar ruta interna | Falta rewrite SPA | Confirmar `vercel.json` con rutas a `index.html` |
| CORS bloqueado | Backend no autoriza origen | Añadir dominio Vercel en variable `DJANGO_CORS_ALLOWED_ORIGINS` |
| API apunta a localhost en producción | Variable `VITE_API_URL` no definida | Definir en Vercel y redeploy |
| Build falla por versión Node | Node muy antigua | Configurar versión con archivo `engines` en `package.json` o `VERCEL` settings |

## 9. Opcional: Fijar versión Node
Puedes añadir en `package.json`:
```json
"engines": { "node": "^20" }
```

## 10. Limpieza de variables demo
Si no usarás modo demo elimina `VITE_DEMO_MODE` y `VITE_DEMO_EMPTY` de `.env.example`.

---
Si deseas pipeline CI/CD o testing antes del deploy, puedo ayudarte a configurarlo.
