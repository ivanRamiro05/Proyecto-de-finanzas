# 📖 Configuración de la Wiki de GitHub

Este archivo contiene las instrucciones para configurar la Wiki de GitHub para el proyecto FinanzApp.

## 🎯 Estructura de la Wiki

La Wiki debe tener las siguientes páginas:

### 🏠 Home (Página Principal)
**Archivo fuente**: `wiki/Home.md`  
**Contenido**: Índice general de toda la documentación

### 📖 Páginas de Documentación

1. **Guía de Instalación** (`wiki/Guia-de-Instalacion.md`)
   - Fuente: `docs/installation.md`
   - Instalación detallada paso a paso

2. **Arquitectura del Sistema** (`wiki/Arquitectura.md`)
   - Fuente: `docs/architecture.md`
   - Diseño técnico y modelo de datos

3. **Guía de Usuario** (`wiki/Guia-de-Usuario.md`)
   - Fuente: `docs/user-guide.md`
   - Manual completo para usuarios finales

4. **Referencia de API** (`wiki/API-Reference.md`)
   - Fuente: `docs/api-reference.md`
   - Documentación completa de endpoints

5. **Guía de Desarrollo** (`wiki/Guia-de-Desarrollo.md`)
   - Fuente: `docs/development.md`
   - Configuración para desarrolladores

6. **Solución de Problemas** (`wiki/Solucion-de-Problemas.md`)
   - Errores comunes y sus soluciones

7. **Preguntas Frecuentes** (`wiki/FAQ.md`)
   - Preguntas y respuestas comunes

## 🚀 Cómo Configurar la Wiki

### Opción 1: Manualmente (Recomendado para GitHub)

1. **Activar la Wiki**:
   - Ve a tu repositorio en GitHub
   - Settings → Features → ✅ Wikis

2. **Crear la primera página**:
   - Ve a la pestaña "Wiki"
   - Haz clic en "Create the first page"

3. **Agregar páginas**:
   - Copia el contenido de `wiki/Home.md` en la página principal
   - Usa "New Page" para crear cada página adicional
   - Usa los nombres exactos (sin `.md`)

### Opción 2: Clonar Wiki como Git Repo

```bash
# Clonar la wiki (después de crearla en GitHub)
git clone https://github.com/Cayalam/Gestor_de_finanzas_React.wiki.git

# Copiar archivos
cp wiki/*.md Gestor_de_finanzas_React.wiki/

# Commitear y pushear
cd Gestor_de_finanzas_React.wiki
git add .
git commit -m "docs: agregar documentación completa a la wiki"
git push origin master
```

### Opción 3: Usar GitHub CLI

```bash
# Requiere GitHub CLI instalado
gh repo clone Cayalam/Gestor_de_finanzas_React.wiki
cd Gestor_de_finanzas_React.wiki

# Copiar archivos
cp ../wiki/*.md .

# Commitear y pushear
git add .
git commit -m "docs: configurar wiki completa"
git push
```

## 📋 Checklist de Configuración

- [ ] Activar Wikis en Settings del repositorio
- [ ] Crear página Home con el índice
- [ ] Agregar Guía de Instalación
- [ ] Agregar Arquitectura del Sistema
- [ ] Agregar Guía de Usuario
- [ ] Agregar Referencia de API
- [ ] Agregar Guía de Desarrollo
- [ ] Agregar Solución de Problemas
- [ ] Agregar FAQ
- [ ] Verificar que todos los links funcionen
- [ ] Agregar links en el README principal

## 🔗 Links Útiles

- [GitHub Wiki Docs](https://docs.github.com/en/communities/documenting-your-project-with-wikis)
- [Markdown Guide](https://guides.github.com/features/mastering-markdown/)

## 📝 Notas

- Los nombres de las páginas en la URL se generan automáticamente desde el título
- GitHub Wiki usa Markdown estándar
- Las imágenes se pueden subir directamente en la interfaz de GitHub
- Los links internos se crean con: `[[Nombre-de-Pagina]]`
