# ELMUBE BOOKS

Buscador y descargador de libros libres de dominio público. Una sola búsqueda en
Project Gutenberg, Open Library y Standard Ebooks con descarga directa en EPUB,
PDF, TXT, HTML y Kindle.

## Funciones

- Búsqueda unificada en 3 fuentes públicas (Gutenberg, Open Library, Standard Ebooks)
- Filtro por fuente, idioma y categoría (12 géneros)
- Vista previa del texto antes de descargar
- Descarga directa en múltiples formatos
- Favoritos e historial de descargas (guardados en el navegador)
- Modo claro/oscuro
- Interfaz 100% responsive

## Cómo desplegar en Netlify

### Opción A — Vía web (la más sencilla)

1. **Sube el código a GitHub**
   - Crea un repositorio nuevo en github.com
   - Sube todos los archivos del proyecto al repo:
     ```bash
     git init
     git add .
     git commit -m "ELMUBE BOOKS"
     git branch -M main
     git remote add origin https://github.com/TU_USUARIO/elmube-books.git
     git push -u origin main
     ```
   - Importante: asegúrate de que el archivo `.gitignore` excluya `node_modules/` y `.next/`.

2. **Conecta con Netlify**
   - Ve a https://app.netlify.com/start
   - Haz clic en "Import from Git"
   - Selecciona GitHub y autoriza
   - Elige el repositorio `elmube-books`

3. **Configura el deploy (Netlify lo detecta automáticamente)**
   - Build command: `next build` (ya viene en `netlify.toml`)
   - Publish directory: `.next`
   - El plugin `@netlify/plugin-nextjs` se instala automáticamente

4. **¡Listo!**
   - Netlify te da una URL tipo `https://elmube-books.netlify.app`
   - Cada `git push` re-deploya automáticamente

### Opción B — Vía CLI (drag & drop)

1. **Instala la CLI de Netlify**
   ```bash
   npm install -g netlify-cli
   netlify login
   ```

2. **Desde la carpeta del proyecto**
   ```bash
   netlify deploy
   ```
   - Sigue las instrucciones interactivas
   - Cuando te pida "deploy path", confirma `.next`

3. **Para producción**
   ```bash
   netlify deploy --prod
   ```

### Opción C — Drag & drop manual

1. Build local:
   ```bash
   npm install
   npx next build
   ```
2. Ve a https://app.netlify.com/drop
3. Arrastra la carpeta `.next` a la página

> ⚠️ Esta opción no soporta API routes serverless. Las opciones A y B sí.

## Requisitos

- Node.js 20+ (Netlify lo instala automáticamente)
- No requiere base de datos: todo se guarda en el navegador del usuario
- No requiere variables de entorno

## Estructura

- `src/app/page.tsx` — Interfaz completa (home, resultados, categorías, favoritos, historial, modal detalle, vista previa)
- `src/app/api/search/route.ts` — Búsqueda unificada en las 3 fuentes
- `src/app/api/preview/route.ts` — Vista previa del texto (6000 caracteres)
- `netlify.toml` — Configuración de Netlify

## Notas legales

Todos los libros indexados son de dominio público o con permiso de descarga
gratuita, provenientes de Project Gutenberg, Open Library/Internet Archive
y Standard Ebooks.
