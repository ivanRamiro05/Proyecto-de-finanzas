# ❓ Preguntas Frecuentes (FAQ)

Respuestas a las preguntas más comunes sobre FinanzApp.

## 📋 Tabla de Contenidos

- [General](#general)
- [Instalación y Configuración](#instalación-y-configuración)
- [Uso de la Aplicación](#uso-de-la-aplicación)
- [Gestión Personal](#gestión-personal)
- [Gestión Grupal](#gestión-grupal)
- [Seguridad y Privacidad](#seguridad-y-privacidad)
- [Desarrollo y Contribución](#desarrollo-y-contribución)

---

## General

### ¿Qué es FinanzApp?

FinanzApp es una aplicación web de código abierto para gestionar finanzas personales y grupales. Permite registrar ingresos, gastos, crear bolsillos virtuales, categorizar transacciones y compartir cuentas con grupos familiares o de amigos.

### ¿Es gratis?

Sí, FinanzApp es completamente gratuito y de código abierto bajo licencia MIT. Puedes usar, modificar y distribuir el software libremente.

### ¿Necesito internet para usarla?

Actualmente sí, ya que funciona como una aplicación web cliente-servidor. Requieres que tanto el backend como el frontend estén corriendo. En el futuro podría implementarse una versión PWA con funcionalidad offline.

### ¿En qué dispositivos funciona?

FinanzApp tiene diseño responsive y funciona en:
- 💻 Computadoras (Windows, macOS, Linux)
- 📱 Smartphones (iOS, Android vía navegador)
- 📱 Tablets

### ¿Puedo usar FinanzApp en producción?

Sí, pero deberás realizar ajustes de seguridad:
- Cambiar `SECRET_KEY` de Django
- Configurar `DEBUG = False`
- Usar PostgreSQL en lugar de SQLite
- Configurar HTTPS
- Implementar backups automáticos

---

## Instalación y Configuración

### ¿Qué necesito para instalar FinanzApp?

Necesitas:
- Python 3.12 o superior
- Node.js 18 o superior
- npm 9 o superior
- Git

Ver [[Guía de Instalación|Guia-de-Instalacion]] para detalles.

### ¿Puedo usar Python 3.11 o inferior?

No es recomendable. El proyecto fue desarrollado con Python 3.12 y podría haber incompatibilidades con versiones anteriores.

### ¿Funciona en Windows?

Sí, FinanzApp funciona perfectamente en Windows 10/11. Los comandos pueden variar ligeramente (usa `\` en lugar de `/` en rutas).

### ¿Cómo cambio el puerto del backend?

```bash
python manage.py runserver 8001
```

Luego actualiza `VITE_API_URL` en el `.env` del frontend:
```env
VITE_API_URL=http://localhost:8001/api
```

### ¿Cómo cambio el puerto del frontend?

En `vite.config.js`:
```javascript
export default defineConfig({
  server: {
    port: 3001,
  }
})
```

---

## Uso de la Aplicación

### ¿Cómo me registro?

1. Abre http://localhost:3000
2. Haz clic en "Registrarse"
3. Completa:
   - Nombre completo
   - Email (debe ser único)
   - Contraseña (mínimo 8 caracteres)
   - Divisa preferida (COP, USD, EUR, etc.)
4. Haz clic en "Crear Cuenta"

### ¿Puedo cambiar mi email?

Actualmente no desde la interfaz. Puedes hacerlo desde Django Admin o desde el shell de Django.

### ¿Cómo cambio mi contraseña?

Actualmente no hay opción en la UI. Debes usar Django Admin o el shell:

```bash
python manage.py shell
>>> from finances.models import Usuario
>>> user = Usuario.objects.get(email='tu@email.com')
>>> user.set_password('nueva_password')
>>> user.save()
```

### ¿Puedo cambiar mi divisa preferida?

Sí, pero actualmente no desde la UI. Esta funcionalidad está pendiente de implementar.

---

## Gestión Personal

### ¿Qué es un "Bolsillo"?

Un bolsillo es como una cuenta virtual donde guardas dinero. Puedes tener múltiples bolsillos para organizar tus finanzas:
- Cuenta bancaria
- Efectivo
- Ahorros
- Fondo de emergencia

### ¿Puedo eliminar el bolsillo "General"?

No, el bolsillo "General" se crea automáticamente y no puede eliminarse. Es el bolsillo principal de tu cuenta.

### ¿Cómo transfiero dinero entre bolsillos?

1. Ve a la sección Bolsillos
2. Selecciona el bolsillo de origen
3. Haz clic en "Transferir"
4. Selecciona el bolsillo destino y el monto
5. Confirma la transferencia

### ¿Qué pasa si intento gastar más de lo que tengo?

El sistema te mostrará un error: "Saldo insuficiente en el bolsillo". No puedes registrar un egreso mayor al saldo disponible.

### ¿Puedo editar una transacción después de crearla?

Sí, haz clic en la transacción y modifica los campos. El saldo del bolsillo se ajustará automáticamente.

### ¿Qué pasa si elimino una transacción?

El saldo del bolsillo se revierte automáticamente. Si era un ingreso, se resta; si era un egreso, se suma.

### ¿Puedo ver estadísticas por fecha?

Sí, en el Dashboard puedes filtrar por mes o por rango de fechas personalizado (funcionalidad depende de la versión).

---

## Gestión Grupal

### ¿Cómo creo un grupo?

1. Ve a la sección "Grupos"
2. Haz clic en "Nuevo Grupo"
3. Ingresa nombre y descripción
4. Haz clic en "Crear"

Automáticamente serás el creador y tendrás permisos administrativos.

### ¿Cómo invito a alguien a mi grupo?

1. Abre el grupo
2. Haz clic en "Agregar Miembro"
3. Ingresa el **email** del usuario (debe estar registrado)
4. Haz clic en "Invitar"

### ¿Los usuarios nuevos deben registrarse primero?

Sí, los usuarios deben crear una cuenta en FinanzApp antes de poder ser agregados a un grupo.

### ¿Puedo pertenecer a múltiples grupos?

Sí, puedes crear y pertenecer a tantos grupos como necesites.

### ¿Qué diferencia hay entre "creador" y "miembro"?

**Creador**:
- Puede agregar/eliminar miembros
- Puede editar información del grupo
- Puede eliminar el grupo

**Miembro**:
- Puede crear transacciones del grupo
- Solo puede editar/eliminar sus propias transacciones
- Puede ver todas las transacciones del grupo

### ¿Cómo sé quién hizo una transacción en el grupo?

Cada transacción muestra "Creado por: [Nombre del usuario]" debajo de la descripción.

### ¿Puedo eliminar a alguien del grupo?

Sí, si eres el **creador** del grupo. Los miembros no pueden eliminar a otros.

### ¿Qué pasa si elimino un grupo?

Si eres el creador:
- Se elimina el grupo
- Se eliminan todos los bolsillos del grupo
- Se eliminan todas las transacciones del grupo
- Los miembros pierden acceso

Si eres miembro:
- Solo te eliminas tú del grupo
- El grupo y sus datos permanecen

### ¿Puedo mover una transacción personal a un grupo?

No directamente. Deberías eliminar la transacción personal y crear una nueva en el grupo.

---

## Seguridad y Privacidad

### ¿Es segura mi información?

En desarrollo local, tus datos están en tu máquina. Si despliegas en producción, asegúrate de:
- Usar HTTPS
- Configurar firewalls
- Usar contraseñas fuertes
- Hacer backups regulares

### ¿Mis datos se suben a algún servidor?

No, si usas la instalación local. Todos los datos quedan en tu computadora (base de datos SQLite).

### ¿Puedo usar FinanzApp sin conexión a internet?

No actualmente, ya que el frontend necesita comunicarse con el backend. En el futuro podría implementarse un modo offline con PWA.

### ¿Cómo protejo mi cuenta?

- Usa una contraseña fuerte (mínimo 8 caracteres, mezcla de letras, números y símbolos)
- No compartas tu token de sesión
- Cierra sesión en dispositivos compartidos
- Mantén actualizado el software

### ¿Dónde se guarda mi contraseña?

Las contraseñas se almacenan hasheadas (encriptadas) usando el sistema de hashing de Django (PBKDF2 SHA256). Nunca se guardan en texto plano.

---

## Desarrollo y Contribución

### ¿Puedo contribuir al proyecto?

¡Sí! Lee la [[Guía de Contribución|CONTRIBUTING]] para conocer el proceso.

### ¿Qué puedo contribuir?

- Código (nuevas características, bugfixes)
- Documentación
- Traducciones
- Reportes de bugs
- Sugerencias de características

### ¿Cómo reporto un bug?

1. Ve a [GitHub Issues](https://github.com/Cayalam/Gestor_de_finanzas_React/issues)
2. Haz clic en "New Issue"
3. Selecciona "Bug Report"
4. Completa la información:
   - Descripción del bug
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Screenshots (si aplica)
   - Sistema operativo y versiones

### ¿Puedo solicitar una nueva característica?

Sí, crea un [Feature Request](https://github.com/Cayalam/Gestor_de_finanzas_React/issues/new) en GitHub.

### ¿Cómo ejecuto los tests?

**Backend**:
```bash
python manage.py test
```

**Frontend**:
```bash
npm test
```

(Nota: Los tests de frontend pueden no estar implementados aún)

### ¿Qué base de datos puedo usar en producción?

Recomendamos PostgreSQL para producción. SQLite es solo para desarrollo.

### ¿Puedo usar MySQL/MariaDB?

Sí, Django soporta múltiples bases de datos. Deberás instalar los drivers correspondientes y ajustar `DATABASES` en `settings.py`.

### ¿Hay una versión Docker?

Actualmente no, pero es una buena idea para contribuir.

---

## Funcionalidades Futuras

### ¿Habrá modo oscuro?

Está en la lista de funcionalidades futuras.

### ¿Se podrá exportar datos a Excel/PDF?

Sí, está planificado para futuras versiones.

### ¿Habrá notificaciones por email?

Es una funcionalidad considerada para el futuro.

### ¿Habrá presupuestos y metas de ahorro?

Sí, está en el roadmap del proyecto.

### ¿Se podrá conectar con cuentas bancarias reales?

Es una funcionalidad compleja que requiere integración con APIs bancarias. Está en consideración para versiones muy futuras.

---

## Más Ayuda

### No encuentro respuesta a mi pregunta

Consulta:
- [[Guía de Usuario|Guia-de-Usuario]] - Manual completo
- [[Solución de Problemas|Solucion-de-Problemas]] - Errores comunes
- [[Guía de Desarrollo|Guia-de-Desarrollo]] - Para desarrolladores
- [GitHub Issues](https://github.com/Cayalam/Gestor_de_finanzas_React/issues) - Busca o crea un issue

### ¿Cómo contacto al desarrollador?

- **GitHub**: [@Cayalam](https://github.com/Cayalam)
- **Email**: cayalam@uis.edu.co
- **Issues**: [Crear Issue](https://github.com/Cayalam/Gestor_de_finanzas_React/issues/new)

---

⭐️ **¿Te gusta FinanzApp?** Dale una estrella en [GitHub](https://github.com/Cayalam/Gestor_de_finanzas_React)!
