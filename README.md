# 💰 FinanzApp - Gestor de Finanzas Inteligente

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.2.7-green.svg)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> Sistema completo de gestión financiera personal y grupal desarrollado con Django REST Framework y React

**FinanzApp** es una aplicación web moderna que te permite gestionar tus finanzas personales y compartir gastos con grupos (familia, amigos, compañeros). Con una interfaz intuitiva, categorización automática y visualización de estadísticas en tiempo real.

## 📸 Vista Previa

```
┌─────────────────────────────────────────────┐
│  Dashboard Personalizado                   │
│  ✓ Ingresos y Egresos                      │
│  ✓ Bolsillos Virtuales                     │
│  ✓ Gráficos Interactivos                   │
│  ✓ Gestión de Grupos                       │
└─────────────────────────────────────────────┘
```

## ✨ Características Principales

### 💼 Gestión Personal
- 📊 Dashboard con estadísticas en tiempo real
- 💸 Registro de ingresos y gastos
- 🏦 Múltiples bolsillos/cuentas virtuales
- 🎨 Categorías personalizables con colores
- 📈 Gráficos de gastos por categoría

### 👥 Gestión Grupal
- 👨‍👩‍👧‍👦 Crear y administrar grupos familiares o de amigos
- 💰 Compartir gastos y llevar cuentas conjuntas
- 🔍 Trazabilidad: ver quién realizó cada transacción
- 🔐 Roles y permisos por grupo
- 📤 Transferencias entre usuarios

### 🎯 Experiencia de Usuario
- 📱 Diseño responsive (móvil, tablet, desktop)
- 🌓 Interfaz moderna con Tailwind CSS
- ⚡ Carga rápida con React + Vite
- 🔔 Notificaciones de estado del backend
- 🌍 Soporte para múltiples divisas

## 📋 Tabla de Contenidos

- [Inicio Rápido](#-inicio-rápido)
- [Tecnologías](#️-tecnologías)
- [Documentación Completa](#-documentación-completa)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

## 🚀 Inicio Rápido

### Requisitos Previos

- Python 3.12+
- Node.js 18+
- npm 9+

### Instalación en 3 Pasos

**1. Clonar el repositorio**
```bash
git clone https://github.com/Cayalam/Gestor_de_finanzas_React.git
cd Gestor_de_finanzas_React
```

**2. Configurar Backend**
```bash
cd src_1/Backend_Django
python -m venv env
env\Scripts\activate  # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**3. Configurar Frontend**
```bash
cd src_1/Frontend_React
npm install
echo "VITE_API_URL=http://localhost:8000/api" > .env
npm run dev
```

🎉 **¡Listo!** Abre http://localhost:3000 en tu navegador

> 💡 Para instrucciones detalladas, consulta la [Guía de Instalación](docs/installation.md)

## 🛠️ Tecnologías

### Backend
- **Django 5.2.7** - Framework web
- **Django REST Framework 3.15.2** - API REST
- **SQLite** - Base de datos (desarrollo)
- **Token Authentication** - Seguridad

### Frontend
- **React 18** - Biblioteca de UI
- **Vite** - Build tool moderno
- **Tailwind CSS** - Framework de estilos
- **Axios** - Cliente HTTP
- **React Router** - Navegación SPA

## 📚 Documentación Completa

Toda la documentación detallada está disponible en la carpeta [`docs/`](docs/) y en la [Wiki del proyecto](https://github.com/Cayalam/Gestor_de_finanzas_React/wiki):

| Documento | Descripción |
|-----------|-------------|
| [📖 Guía de Instalación](docs/installation.md) | Instalación paso a paso con solución de problemas |
| [🏗️ Arquitectura](docs/architecture.md) | Diseño del sistema y modelo de datos |
| [👤 Guía de Usuario](docs/user-guide.md) | Manual completo para usuarios finales |
| [🔌 Referencia de API](docs/api-reference.md) | Documentación completa de endpoints |
| [💻 Guía de Desarrollo](docs/development.md) | Configuración del entorno de desarrollo |

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor lee nuestra [Guía de Contribución](CONTRIBUTING.md) para conocer:

- 📝 Convenciones de código
- 🔀 Proceso de Pull Requests
- 🐛 Cómo reportar bugs
- ✨ Cómo proponer nuevas características

### Pasos Rápidos para Contribuir

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'feat: agregar característica increíble'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Autor

**Carlos Eduardo Ayala Moreno** - *Desarrollo Principal* - [Cayalam](https://github.com/Cayalam)

## 🙏 Agradecimientos

- Universidad Industrial de Santander
- Comunidad de Django y React
- Todos los contribuidores

---

⭐️ **Si este proyecto te fue útil, considera darle una estrella en GitHub!**

📧 **¿Preguntas o sugerencias?** [Crear un issue](https://github.com/Cayalam/Gestor_de_finanzas_React/issues)

📖 **Más información:** [Visita nuestra Wiki](https://github.com/Cayalam/Gestor_de_finanzas_React/wiki)
