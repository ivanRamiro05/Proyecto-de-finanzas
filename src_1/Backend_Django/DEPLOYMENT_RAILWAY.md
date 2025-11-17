# Despliegue Backend Django en Railway

## 1. Preparación del proyecto
Se añadieron los siguientes ajustes para producción:
- Variables de entorno en `settings.py` (SECRET_KEY, DEBUG, DATABASE_URL, ALLOWED_HOSTS, CORS, CSRF)
- Dependencias de producción en `requirements.txt`: `gunicorn`, `whitenoise`, `dj-database-url`, `psycopg2-binary`
- `Procfile` para proceso web y migraciones iniciales
- `STATIC_ROOT` y Whitenoise para servir estáticos

## 2. Crear proyecto en Railway
1. Inicia sesión en Railway (https://railway.app/).
2. Crea un nuevo proyecto y elige "Deploy from GitHub" o "Start Empty".
3. **IMPORTANTE**: Railway necesita detectar el directorio correcto:
   
   **Opción A: Configurar Root Directory (RECOMENDADO)**
   - En Settings del servicio → Build → Root Directory: `src_1/Backend_Django`
   
   **Opción B: Monorepo Detection**
   - Railway detectará automáticamente si existe `railway.json` o `nixpacks.toml`
   
   **Opción C: Repositorio separado**
   - Crea un repo solo para backend o usa Railway CLI para deploy directo

## 3. Configurar el servicio
- **Root Directory**: En Settings → `src_1/Backend_Django` (si usas monorepo)
- **Build**: Railway detectará Python por `requirements.txt`.
- **Variables de entorno OBLIGATORIAS**:
  - `DJANGO_SECRET_KEY` (genera uno seguro: https://djecrety.ir/)
  - `DJANGO_DEBUG=0` (producción)
  - `DJANGO_ALLOWED_HOSTS` - Ejemplo: `*.railway.app` o tu dominio exacto
  - `DJANGO_CORS_ALLOWED_ORIGINS` - Ejemplo: `https://tu-app.vercel.app,http://localhost:5173`
  - `DJANGO_CSRF_TRUSTED_ORIGINS` - Ejemplo: `https://tu-app.vercel.app`
  - `DATABASE_URL` (se genera automáticamente al añadir plugin Postgres)

**IMPORTANTE**: Sin estas variables el deploy fallará o mostrará "Not Found"

## 4. Añadir base de datos Postgres
1. Dentro del proyecto Railway agrega plugin Postgres.
2. Copia la `DATABASE_URL` generada (Railway la expone automáticamente como variable de entorno).
3. No necesitas modificar `settings.py` adicionalmente: si existe `DATABASE_URL`, el sistema cambia de SQLite a Postgres.

## 5. Comando de inicio
El `Procfile` define:
```
web: python manage.py collectstatic --noinput && python manage.py migrate && gunicorn backend.wsgi --bind 0.0.0.0:$PORT
```
Railway usa la variable `$PORT` automáticamente.

## 6. Migraciones y datos iniciales
- Primer despliegue ejecutará migraciones automáticamente.
- Si necesitas un superusuario:
  - Abre el shell de Railway ("Service >> Connect >> Shell") y ejecuta:
    ```bash
    python manage.py createsuperuser
    ```

## 7. Revisar logs
- Usa la pestaña "Logs" para verificar que `collectstatic` y migraciones finalizaron sin errores.

## 8. Endpoints expuestos
La API quedará disponible en:
```
https://<tu-dominio>.up.railway.app/api/
```
Autenticación por token en:
```
https://<tu-dominio>.up.railway.app/api-token-auth/
```
Registro:
```
https://<tu-dominio>.up.railway.app/api/register/
```

## 9. Ajustes opcionales recomendados
- Añadir monitoreo de errores (Sentry) en producción.
- Configurar rotación de logs si se requiere.
- Forzar HTTPS (Railway ya ofrece SSL en su dominio).

## 10. Frontend y CORS
Asegúrate de establecer `DJANGO_CORS_ALLOWED_ORIGINS` con el dominio real donde se desplegará el frontend. Para múltiples orígenes, separa por comas.

## 11. Actualizaciones futuras
Al cambiar dependencias, Railway reconstruirá automáticamente. Revisa que se mantenga la versión de Python (puedes fijarla con `runtime.txt`).

## 12. runtime.txt (opcional)
Crea un archivo `runtime.txt` con el contenido:
```
python-3.12.2
```
Si deseas fijar versión exacta.

## 13. Seguridad
- Nunca publiques el valor real de `DJANGO_SECRET_KEY`.
- Usa tokens rotatorios para integraciones.

---

## 14. Troubleshooting "Not Found" o Deploy Failures

### Error: "The train has not arrived at the station"
**Causa**: Railway no encontró el proyecto o falta configuración.

**Soluciones**:
1. Verifica Root Directory en Settings → `src_1/Backend_Django`
2. Confirma que `requirements.txt` existe en el directorio raíz configurado
3. Revisa logs de build en Railway → Deployments → View Logs

### Error: "Application failed to start"
**Causa**: Variables de entorno faltantes o incorrectas.

**Soluciones**:
1. Verifica que `DJANGO_ALLOWED_HOSTS` incluya el dominio Railway (ej: `*.railway.app`)
2. Confirma que `DJANGO_SECRET_KEY` esté definida
3. Si usas Postgres, verifica que `DATABASE_URL` esté presente

### Error: CORS bloqueado en frontend
**Causa**: Backend no autoriza origen del frontend.

**Solución**:
```
DJANGO_CORS_ALLOWED_ORIGINS=https://tu-app.vercel.app
DJANGO_CSRF_TRUSTED_ORIGINS=https://tu-app.vercel.app
```

### Error: Migraciones fallan
**Causa**: Base de datos no conectada o migraciones previas erróneas.

**Solución**:
1. Verifica que el plugin Postgres esté añadido
2. Borra `staticfiles/` si hay conflictos
3. En Railway Shell: `python manage.py migrate --fake-initial`

### Verificar deployment exitoso
1. Abre `https://<tu-dominio>.railway.app/admin/` (debe mostrar login Django)
2. Prueba `https://<tu-dominio>.railway.app/api/` (debe listar endpoints)
3. Revisa logs en tiempo real: Railway → Service → Logs

---
Si necesitas automatizar la creación de variables o separar el backend en otro repositorio, avísame y preparo los pasos.
