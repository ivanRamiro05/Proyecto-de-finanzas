# Checklist Railway Deploy - Backend Django

## Pre-Deploy
- [ ] `requirements.txt` actualizado con todas las dependencias
- [ ] `runtime.txt` especifica versión Python (python-3.12.2)
- [ ] `Procfile` o `nixpacks.toml` configurado
- [ ] `.env.example` como referencia de variables

## En Railway Dashboard

### 1. Configuración Básica
- [ ] Root Directory configurado: `src_1/Backend_Django`
- [ ] Plugin Postgres añadido al proyecto
- [ ] Servicio conectado a repositorio GitHub

### 2. Variables de Entorno OBLIGATORIAS
```bash
DJANGO_SECRET_KEY=<genera-uno-seguro>
DJANGO_DEBUG=0
DJANGO_ALLOWED_HOSTS=*.railway.app
DJANGO_CORS_ALLOWED_ORIGINS=https://tu-frontend.vercel.app
DJANGO_CSRF_TRUSTED_ORIGINS=https://tu-frontend.vercel.app
# DATABASE_URL se genera automáticamente con el plugin Postgres
```

### 3. Verificaciones Post-Deploy
- [ ] Build completó sin errores (revisar Logs)
- [ ] Migraciones ejecutadas correctamente
- [ ] Colección de estáticos exitosa
- [ ] Servicio muestra estado "Active"

### 4. Pruebas de Endpoints
- [ ] `https://<tu-dominio>.railway.app/admin/` - Login Django visible
- [ ] `https://<tu-dominio>.railway.app/api/` - Lista de endpoints API
- [ ] `https://<tu-dominio>.railway.app/api-token-auth/` - Endpoint autenticación

### 5. Crear Superusuario (Opcional)
```bash
# En Railway Shell
python manage.py createsuperuser
```

### 6. Configurar Frontend
- [ ] Actualizar `VITE_API_URL` en Vercel con dominio Railway
- [ ] Verificar que no haya errores CORS en consola del navegador

## Problemas Comunes

| Error | Solución Rápida |
|-------|-----------------|
| "Not Found" | Verifica Root Directory en Settings |
| Build falla | Revisa `requirements.txt` y logs |
| CORS blocked | Añade dominio frontend a variables CORS |
| 500 Server Error | Revisa `DJANGO_ALLOWED_HOSTS` y `DEBUG` |
| DB error | Confirma que plugin Postgres esté conectado |
| 404 en /admin/i1 (CSS) | Asegura `collectstatic` corrió, verifica Whitenoise |
| ALLOWED_HOSTS error | Añade dominio Railway: `*.railway.app` o dominio exacto |

## Comandos Útiles (Railway Shell)

```bash
# Ver logs en tiempo real
railway logs

# Ejecutar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Colectar estáticos manualmente
python manage.py collectstatic --noinput

# Ver configuración actual
python manage.py check --deploy
```

## Regenerar SECRET_KEY
```python
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

O usa: https://djecrety.ir/
