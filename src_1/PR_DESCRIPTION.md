Integrate custom Usuario as AUTH_USER_MODEL; add auth, CORS, view scoping and validations
=============================================================================================

Resumen
-------
- Convierte `finances.Usuario` en un CustomUser (`AbstractBaseUser` + `PermissionsMixin`) y configura `AUTH_USER_MODEL = 'finances.Usuario'`.
- Añade CORS (`django-cors-headers`) y configuración mínima en `backend/settings.py`.
- Integra DRF Token auth y añade endpoint `api-token-auth/`.
- Implementa scoping en ViewSets para que usuarios solo vean recursos propios o de sus grupos.
- Añade validaciones en serializers (XOR usuario/grupo, montos > 0, coherencia `categoria.tipo` vs `movimiento.tipo`).
- Agrega migraciones (0003 manual para introducir password por defecto y 0004 autogenerada) y adaptaciones en la DB local para `authtoken_token`.

Archivos clave
-------------
- `backend/settings.py` — CORS y `AUTH_USER_MODEL`.
- `finances/models.py` — custom user y FK actualizados.
- `finances/serializers.py` — manejo seguro de password + validaciones.
- `finances/views.py` — permisos y scopes.
- `finances/migrations/0003*` y `0004*` — migraciones para nuevos campos.
- `scripts/*` — scripts de inspección y corrección de DB (temporal).

Notas importantes / riesgos
--------------------------
- Se creó y commitó una copia local de `db.sqlite3` durante el desarrollo; añadirlo a `.gitignore` y no incluir la BD en producción.
- Cambios en el modelo usuario implican migraciones que requieren precauciones en producción: hacer backup, probar en staging y coordinar despliegue para evitar downtime o incoherencias.
- En la DB local se realizó una corrección manual en `authtoken_token` para apuntar a `usuario(usuario_id)`; en entornos compartidos debe considerarse una migración formal o un script de migración de datos.

Pruebas rápidas
---------------
1. Instalar dependencias:
```
pip install -r src_1/Backend_Django/requirements.txt
```
2. Aplicar migraciones:
```
python src_1/Backend_Django/manage.py migrate
```
3. Crear superuser de prueba:
```
python src_1/Backend_Django/manage.py createsuperuser
```
4. Ejecutar servidor:
```
python src_1/Backend_Django/manage.py runserver
```
5. Probar token endpoint: POST a `http://127.0.0.1:8000/api-token-auth/` con `username`/`password`.

Checklist para revisión
-----------------------
- [ ] Revisar migraciones y plan de despliegue en staging
- [ ] Asegurar que `db.sqlite3` no esté en el repo final (añadir a .gitignore)
- [ ] Revisar que la integración con tokens sea correcta en entornos con `auth_user` vs `usuario`
- [ ] Añadir tests automáticos para scoping y validaciones

Comentario final
----------------
Esta PR cambia la forma en que se maneja el usuario en la aplicación — recomendamos revisar detenidamente la estrategia de despliegue y coordinar con el equipo antes de mergear.
