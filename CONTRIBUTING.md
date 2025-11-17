# Guía de Contribución

¡Gracias por tu interés en contribuir a FinanzApp! 🎉

## 📋 Código de Conducta

Este proyecto se adhiere a un código de conducta de colaboración. Al participar, se espera que mantengas este código. Por favor, reporta comportamientos inaceptables a través de issues.

## 🤔 ¿Cómo Puedo Contribuir?

### Reportar Bugs

Si encuentras un bug, por favor crea un issue con:

- **Título descriptivo**: Resume el problema en pocas palabras
- **Pasos para reproducir**: Lista detallada de cómo reproducir el bug
- **Comportamiento esperado**: Qué debería pasar
- **Comportamiento actual**: Qué está pasando
- **Screenshots**: Si es posible, adjunta capturas de pantalla
- **Entorno**: SO, versión de Python, Node.js, navegador, etc.

### Sugerir Mejoras

Para sugerir nuevas características:

1. Verifica que no exista una sugerencia similar en los issues
2. Crea un nuevo issue con el tag `enhancement`
3. Describe detalladamente la mejora propuesta
4. Explica por qué sería útil para los usuarios

### Pull Requests

1. **Fork el repositorio** y crea tu rama desde `main`
   ```bash
   git checkout -b feature/mi-nueva-caracteristica
   ```

2. **Haz tus cambios** siguiendo las convenciones de código

3. **Escribe tests** si es necesario

4. **Actualiza la documentación** si agregas nuevas características

5. **Commit con mensajes descriptivos**
   ```bash
   git commit -m "feat: Agregar funcionalidad X"
   ```

6. **Push a tu fork**
   ```bash
   git push origin feature/mi-nueva-caracteristica
   ```

7. **Abre un Pull Request** describiendo tus cambios

## 📝 Convenciones de Código

### Python (Backend)

- Sigue [PEP 8](https://www.python.org/dev/peps/pep-0008/)
- Usa nombres descriptivos en inglés para variables y funciones
- Documenta funciones complejas con docstrings
- Máximo 100 caracteres por línea

```python
def calcular_balance_total(usuario_id: int) -> Decimal:
    """
    Calcula el balance total sumando todos los bolsillos del usuario.
    
    Args:
        usuario_id: ID del usuario
        
    Returns:
        Decimal con el balance total
    """
    bolsillos = Bolsillo.objects.filter(usuario_id=usuario_id)
    return sum(b.saldo for b in bolsillos)
```

### JavaScript/React (Frontend)

- Usa ES6+ features
- Componentes funcionales con hooks
- Nombres de componentes en PascalCase
- Nombres de funciones y variables en camelCase
- Usa const/let, no var

```javascript
// ✅ Correcto
function TransactionCard({ transaction, onDelete }) {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleDelete = async () => {
    setIsLoading(true)
    await onDelete(transaction.id)
  }
  
  return (
    <div className="card">
      {/* contenido */}
    </div>
  )
}

// ❌ Incorrecto
function transaction_card(props) {
  var loading = false
  // ...
}
```

## 🔀 Proceso de Git

### Nombres de Ramas

- `feature/nombre-feature` - Nuevas características
- `fix/nombre-bug` - Corrección de bugs
- `docs/descripcion` - Cambios en documentación
- `refactor/descripcion` - Refactorización de código
- `test/descripcion` - Agregar o modificar tests

### Mensajes de Commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - Nueva característica
- `fix:` - Corrección de bug
- `docs:` - Cambios en documentación
- `style:` - Cambios de formato (no afectan la lógica)
- `refactor:` - Refactorización de código
- `test:` - Agregar o modificar tests
- `chore:` - Cambios en el proceso de build o herramientas

Ejemplos:
```
feat: Agregar gráfico de gastos mensuales
fix: Corregir cálculo de balance en grupos
docs: Actualizar README con instrucciones de instalación
refactor: Simplificar lógica de autenticación
```

## 🧪 Testing

### Backend (Django)

```bash
# Ejecutar todos los tests
python manage.py test

# Ejecutar tests de una app específica
python manage.py test finances
```

### Frontend (React)

```bash
# Ejecutar tests
npm test

# Ejecutar con cobertura
npm run test:coverage
```

## 📚 Documentación

Si agregas nuevas características:

1. Actualiza el README.md
2. Agrega docstrings/comentarios en el código
3. Actualiza la documentación de la API si es necesario
4. Considera agregar ejemplos de uso

## ❓ Preguntas

Si tienes preguntas, puedes:

1. Revisar la documentación existente
2. Buscar en issues cerrados
3. Crear un nuevo issue con la etiqueta `question`

## 📜 Licencia

Al contribuir, aceptas que tus contribuciones se licenciarán bajo la misma licencia MIT del proyecto.

---

¡Gracias por hacer que FinanzApp sea mejor! 🚀
