# Guía de Desarrollo

Esta guía está dirigida a desarrolladores que desean contribuir o extender FinanzApp.

## 📋 Tabla de Contenidos

1. [Entorno de Desarrollo](#entorno-de-desarrollo)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Flujo de Trabajo](#flujo-de-trabajo)
4. [Testing](#testing)
5. [Debugging](#debugging)
6. [Mejores Prácticas](#mejores-prácticas)
7. [Extensiones y Plugins](#extensiones-y-plugins)

---

## 🛠️ Entorno de Desarrollo

### Requisitos

| Software | Versión Mínima |
|----------|----------------|
| Python | 3.12+ |
| Node.js | 18.0+ |
| npm | 9.0+ |
| Git | 2.30+ |

### Configuración Inicial

#### 1. Clonar el Repositorio

```bash
git clone https://github.com/Cayalam/Gestor_de_finanzas_React.git
cd Gestor_de_finanzas_React/src_1
```

#### 2. Backend Setup

```bash
cd Backend_Django

# Crear entorno virtual
python -m venv env

# Activar entorno virtual
# Windows:
env\Scripts\activate
# macOS/Linux:
source env/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Aplicar migraciones
python manage.py migrate

# Crear superusuario (opcional)
python manage.py createsuperuser

# Iniciar servidor
python manage.py runserver
```

#### 3. Frontend Setup

```bash
cd Frontend_React

# Instalar dependencias
npm install

# Crear archivo .env
echo "VITE_API_URL=http://localhost:8000/api" > .env

# Iniciar servidor de desarrollo
npm run dev
```

---

## 🗂️ Estructura del Proyecto

### Backend (Django)

```
Backend_Django/
├── backend/                 # Configuración del proyecto
│   ├── settings.py         # Configuración principal
│   ├── urls.py             # Rutas principales
│   └── wsgi.py             # WSGI application
├── finances/               # App principal
│   ├── models.py           # Modelos de datos
│   ├── serializers.py      # Serializadores DRF
│   ├── views.py            # ViewSets y lógica
│   ├── urls.py             # Rutas de la app
│   ├── admin.py            # Configuración de admin
│   └── migrations/         # Migraciones de BD
├── manage.py               # CLI de Django
├── requirements.txt        # Dependencias Python
└── db.sqlite3              # Base de datos (no commitear)
```

### Frontend (React)

```
Frontend_React/
├── src/
│   ├── components/         # Componentes reutilizables
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   ├── BackendStatus.jsx
│   │   └── ...
│   ├── pages/              # Vistas principales
│   │   ├── Dashboard.jsx
│   │   ├── Transactions.jsx
│   │   ├── Groups.jsx
│   │   └── ...
│   ├── context/            # Estado global
│   │   ├── AuthContext.jsx
│   │   └── GroupContext.jsx
│   ├── services/           # Comunicación API
│   │   ├── api.js
│   │   ├── auth.js
│   │   └── ...
│   ├── utils/              # Utilidades
│   ├── App.jsx             # Componente raíz
│   └── main.jsx            # Entrada de la app
├── public/                 # Assets estáticos
├── package.json            # Dependencias npm
├── vite.config.js          # Configuración Vite
└── .env                    # Variables de entorno (no commitear)
```

---

## 🔄 Flujo de Trabajo

### 1. Crear Nueva Feature

```bash
# Crear rama desde main
git checkout main
git pull origin main
git checkout -b feature/nombre-descriptivo
```

### 2. Desarrollo

#### Backend

**Crear un Nuevo Modelo**:

1. Define el modelo en `finances/models.py`:
```python
class NuevoModelo(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    
    class Meta:
        verbose_name = "Nuevo Modelo"
        verbose_name_plural = "Nuevos Modelos"
    
    def __str__(self):
        return self.nombre
```

2. Crear migración:
```bash
python manage.py makemigrations
python manage.py migrate
```

3. Crear serializer en `finances/serializers.py`:
```python
class NuevoModeloSerializer(serializers.ModelSerializer):
    class Meta:
        model = NuevoModelo
        fields = ['id', 'nombre', 'descripcion', 'usuario']
        read_only_fields = ['id', 'usuario']
```

4. Crear ViewSet en `finances/views.py`:
```python
class NuevoModeloViewSet(viewsets.ModelViewSet):
    serializer_class = NuevoModeloSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return NuevoModelo.objects.filter(usuario=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)
```

5. Registrar ruta en `finances/urls.py`:
```python
router.register(r'nuevo-modelo', NuevoModeloViewSet, basename='nuevo-modelo')
```

#### Frontend

**Crear un Nuevo Componente**:

1. Crear archivo `src/components/NuevoComponente.jsx`:
```javascript
import React, { useState, useEffect } from 'react';

const NuevoComponente = ({ prop1, prop2 }) => {
  const [state, setState] = useState(null);

  useEffect(() => {
    // Lógica de inicialización
  }, []);

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold">{prop1}</h2>
      <p>{prop2}</p>
    </div>
  );
};

export default NuevoComponente;
```

2. Crear servicio API en `src/services/nuevoServicio.js`:
```javascript
import api from './api';

export const nuevoServicioAPI = {
  getAll: () => api.get('/nuevo-modelo/'),
  create: (data) => api.post('/nuevo-modelo/', data),
  update: (id, data) => api.put(`/nuevo-modelo/${id}/`, data),
  delete: (id) => api.delete(`/nuevo-modelo/${id}/`)
};
```

3. Usar en página:
```javascript
import NuevoComponente from '../components/NuevoComponente';
import { nuevoServicioAPI } from '../services/nuevoServicio';

const MiPagina = () => {
  const [datos, setDatos] = useState([]);

  useEffect(() => {
    nuevoServicioAPI.getAll()
      .then(res => setDatos(res.data))
      .catch(err => console.error(err));
  }, []);

  return <NuevoComponente prop1="Valor" prop2={datos} />;
};
```

### 3. Testing

**Backend**:
```bash
# Ejecutar todos los tests
python manage.py test

# Ejecutar tests de una app
python manage.py test finances

# Ejecutar test específico
python manage.py test finances.tests.TestBolsillo
```

**Frontend**:
```bash
# Ejecutar tests (si están configurados)
npm test

# Verificar linting
npm run lint
```

### 4. Commit

```bash
git add .
git commit -m "feat: agregar funcionalidad X"
```

**Formato de Commits** (Conventional Commits):
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bugs
- `docs:` Cambios en documentación
- `style:` Formateo de código
- `refactor:` Refactorización
- `test:` Agregar o modificar tests
- `chore:` Tareas de mantenimiento

### 5. Push y Pull Request

```bash
git push origin feature/nombre-descriptivo
```

Luego crea un Pull Request en GitHub siguiendo la plantilla en `CONTRIBUTING.md`.

---

## 🧪 Testing

### Backend Testing

**Crear Tests**:

Archivo: `finances/tests.py`

```python
from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import Bolsillo, Categoria, Ingreso

Usuario = get_user_model()

class BolsilloTestCase(TestCase):
    def setUp(self):
        self.usuario = Usuario.objects.create_user(
            email='test@example.com',
            nombre='Test User',
            password='testpass123'
        )
        self.bolsillo = Bolsillo.objects.create(
            nombre='Test Bolsillo',
            saldo=1000,
            usuario=self.usuario
        )

    def test_crear_bolsillo(self):
        """Test de creación de bolsillo"""
        self.assertEqual(self.bolsillo.nombre, 'Test Bolsillo')
        self.assertEqual(self.bolsillo.saldo, 1000)

    def test_agregar_ingreso(self):
        """Test de agregar ingreso y actualización de saldo"""
        categoria = Categoria.objects.create(
            nombre='Salario',
            tipo='ingreso'
        )
        ingreso = Ingreso.objects.create(
            monto=500,
            descripcion='Test Ingreso',
            categoria=categoria,
            bolsillo=self.bolsillo,
            usuario=self.usuario
        )
        self.bolsillo.refresh_from_db()
        self.assertEqual(self.bolsillo.saldo, 1500)
```

**Ejecutar con Coverage**:

```bash
# Instalar coverage
pip install coverage

# Ejecutar tests con coverage
coverage run --source='.' manage.py test finances

# Ver reporte
coverage report

# Generar HTML
coverage html
# Abre htmlcov/index.html en el navegador
```

### Frontend Testing

**Configuración de Vitest** (recomendado para Vite):

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**Ejemplo de Test**:

Archivo: `src/components/__tests__/Header.test.jsx`

```javascript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Header from '../Header';

describe('Header Component', () => {
  it('renders user name', () => {
    render(<Header user={{ nombre: 'Ivan' }} />);
    expect(screen.getByText(/Bienvenido, Ivan/i)).toBeInTheDocument();
  });
});
```

---

## 🐛 Debugging

### Backend Debugging

**Django Debug Toolbar**:

```bash
pip install django-debug-toolbar
```

En `settings.py`:
```python
INSTALLED_APPS += ['debug_toolbar']
MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
INTERNAL_IPS = ['127.0.0.1']
```

En `urls.py`:
```python
if settings.DEBUG:
    import debug_toolbar
    urlpatterns += [path('__debug__/', include(debug_toolbar.urls))]
```

**Logging**:

```python
import logging
logger = logging.getLogger(__name__)

def my_view(request):
    logger.debug('Debug message')
    logger.info('Info message')
    logger.error('Error message')
```

**Python Debugger (pdb)**:

```python
import pdb; pdb.set_trace()  # Breakpoint
```

### Frontend Debugging

**React DevTools**:
- Instala la extensión de React DevTools en tu navegador
- Inspecciona componentes, props y estado

**Console Logging**:
```javascript
console.log('Variable:', variable);
console.table(arrayData);
console.error('Error:', error);
```

**VS Code Debugger**:

Archivo: `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/Frontend_React/src"
    }
  ]
}
```

---

## ✨ Mejores Prácticas

### Backend

1. **Usa Serializers para Validación**:
```python
class MiSerializer(serializers.ModelSerializer):
    def validate_monto(self, value):
        if value < 0:
            raise serializers.ValidationError("El monto no puede ser negativo")
        return value
```

2. **Usa Signals con Moderación**:
```python
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Ingreso)
def actualizar_saldo(sender, instance, created, **kwargs):
    if created:
        instance.bolsillo.saldo += instance.monto
        instance.bolsillo.save()
```

3. **Optimiza Queries**:
```python
# ❌ Malo: N+1 queries
for ingreso in Ingreso.objects.all():
    print(ingreso.categoria.nombre)

# ✅ Bueno: 2 queries
for ingreso in Ingreso.objects.select_related('categoria'):
    print(ingreso.categoria.nombre)
```

4. **Usa Transacciones**:
```python
from django.db import transaction

@transaction.atomic
def transferir_fondos(bolsillo_origen, bolsillo_destino, monto):
    bolsillo_origen.saldo -= monto
    bolsillo_origen.save()
    bolsillo_destino.saldo += monto
    bolsillo_destino.save()
```

### Frontend

1. **Evita Props Drilling** - Usa Context:
```javascript
const MiContexto = createContext();

const Provider = ({ children }) => {
  const [value, setValue] = useState(null);
  return (
    <MiContexto.Provider value={{ value, setValue }}>
      {children}
    </MiContexto.Provider>
  );
};
```

2. **Maneja Estados de Carga**:
```javascript
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  setLoading(true);
  api.getData()
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false));
}, []);

if (loading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
```

3. **Limpia Side Effects**:
```javascript
useEffect(() => {
  const interval = setInterval(() => {
    // Polling
  }, 10000);

  return () => clearInterval(interval); // Cleanup
}, []);
```

4. **Usa Memoization**:
```javascript
const resultado = useMemo(() => {
  return calcularComplejo(datos);
}, [datos]);

const handleClick = useCallback(() => {
  // Handler
}, [dependencias]);
```

---

## 🔌 Extensiones y Plugins

### VS Code Extensions (Recomendadas)

#### Python Development
- **Python** (Microsoft)
- **Pylance** (Microsoft)
- **Python Debugger** (Microsoft)

#### JavaScript/React
- **ES7+ React/Redux/React-Native snippets**
- **Tailwind CSS IntelliSense**
- **ESLint**
- **Prettier**

#### General
- **GitLens**
- **Thunder Client** (REST API testing)
- **Django Template** (syntax highlighting)

### Django Extensions

```bash
pip install django-extensions
```

Comandos útiles:
```bash
# Shell con auto-import de modelos
python manage.py shell_plus

# Diagrama de modelos
python manage.py graph_models -a -o models.png

# Limpiar sesiones expiradas
python manage.py clearsessions
```

---

## 📊 Herramientas de Desarrollo

### Database Management

**DBeaver** (Recomendado):
- Cliente SQL universal
- Soporta SQLite
- Visualización de relaciones

**DB Browser for SQLite**:
- Específico para SQLite
- Liviano y simple

### API Testing

**Thunder Client** (VS Code):
- Integrado en VS Code
- Importa colecciones

**Postman**:
- Funcionalidades avanzadas
- Colaboración en equipo

### Performance Monitoring

**Django Silk**:
```bash
pip install django-silk
```

Monitorea:
- Queries SQL
- Tiempo de respuesta
- Profiling de código

---

## 🚀 Mejoras Futuras

### Backend
- [ ] Implementar PostgreSQL para producción
- [ ] Agregar Redis para cache
- [ ] WebSockets para actualizaciones en tiempo real
- [ ] Autenticación OAuth (Google, Facebook)
- [ ] Rate Limiting
- [ ] API Versioning

### Frontend
- [ ] Progressive Web App (PWA)
- [ ] Modo Offline
- [ ] Internacionalización (i18n)
- [ ] Temas oscuros/claros
- [ ] Gráficos interactivos (D3.js, Chart.js)
- [ ] Exportación a PDF/Excel

---

## 📚 Recursos Adicionales

### Documentación Oficial
- [Django Docs](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [React Docs](https://react.dev/)
- [Vite Docs](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

### Tutoriales
- [Django for Beginners](https://djangoforbeginners.com/)
- [React Tutorial](https://react-tutorial.app/)
- [Real Python](https://realpython.com/)

---

¿Tienes dudas? Abre un issue en GitHub o consulta la documentación adicional en `docs/`.
