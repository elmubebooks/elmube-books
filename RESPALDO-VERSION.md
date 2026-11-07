# ELMUBE BOOKS — Versión completa (respaldo)

Esta es la **versión actualizada completa** de ELMUBE BOOKS con todas las mejoras aplicadas. Sirve como respaldo de la versión actual.

## ✨ Qué incluye esta versión

### 1. Nuevo logo profesional (libro cerrado de canto)
- `public/logo.svg` — nuevo logo: libro cerrado visto de frente, con lomo dorado vertical, marco ornamental, monograma "EB", título grabado en la portada, filete dorado en el borde inferior
- `public/favicon.ico` — favicon regenerado
- `public/icons/*` — todos los íconos PWA regenerados (192, 512, maskable, apple-touch, favicon en distintos tamaños)

### 2. Pantalla de splash animada
- `src/components/SplashScreen.tsx` — nuevo componente con:
  - Logo con **entrada pop + rotación suave** (scale 0→1, rotate -25°→0°)
  - **Flotación continua** del logo (y: 0 → -10 → 0 en bucle)
  - **Nombre "ELMUBE BOOKS"** con fade-up
  - **Subtítulo descriptivo**: "Libros libres de dominio público"
  - **Barra de carga animada** (brillo dorado deslizándose)
  - **Auto-ocultamiento tras ~1.5 segundos** con fade out
  - Accesibilidad: respeta `prefers-reduced-motion`
- `src/app/globals.css` — añade clases `.elmube-splash-*` con el fondo marrón con degradado, halo dorado, sombras y tipografía serif
- `src/app/page.tsx` — integra `<SplashScreen />` al inicio del render + usa el nuevo `logo.svg` en el header (reemplaza el `BookOpen` genérico de lucide)

### 3. Nuevo carrusel destacado en la home
- `src/app/page.tsx` — incluye:
  - Array `MUST_READ_BOOKS` con 15 obras maestras universales de dominio público
  - `<CategoryCarousel>` destacado al inicio de la home, con icono ⭐ y label **"Debes leer al menos una vez en la vida"**
  - Botón "Ver más" del carrusel que dispara búsqueda de "clásicos de la literatura"

**Libros incluidos en el carrusel destacado:**

| # | Título | Autor | Año |
|---|--------|-------|-----|
| 1 | Don Quijote de la Mancha 🇪🇸 | Cervantes | 1605 |
| 2 | La Odisea | Homero | s.VIII a.C. |
| 3 | La Ilíada | Homero | s.VIII a.C. |
| 4 | La Divina Comedia | Dante | 1320 |
| 5 | Hamlet | Shakespeare | 1603 |
| 6 | Crimen y castigo | Dostoyevski | 1866 |
| 7 | Guerra y paz | Tolstói | 1869 |
| 8 | Orgullo y prejuicio | Austen | 1813 |
| 9 | Frankenstein | M. Shelley | 1818 |
| 10 | Los miserables | V. Hugo | 1862 |
| 11 | Drácula | Stoker | 1897 |
| 12 | Alicia en el País de las Maravillas | Carroll | 1865 |
| 13 | Moby Dick | Melville | 1851 |
| 14 | Las aventuras de Sherlock Holmes | Conan Doyle | 1892 |
| 15 | La metamorfosis | Kafka | 1915 |

Cada libro tiene portada, descripción en español y enlaces directos de descarga (HTML, EPUB, TXT) desde Project Gutenberg.

### 4. Build arreglado (compatible con cualquier host)
- `package.json` — script `build` simplificado a `next build` (sin el `cp -r` que rompía en Vercel y otros serverless)

### 5. Proyecto original completo
Todo el resto del proyecto original:
- API routes: `src/app/api/check-links/`, `src/app/api/preview/`, `src/app/api/search/`
- 40+ componentes shadcn/ui en `src/components/ui/`
- Hooks: `src/hooks/use-toast.ts`, `src/hooks/use-mobile.ts`
- Prisma schema y DB SQLite: `prisma/schema.prisma`, `db/custom.db`
- PWA manifest: `public/manifest.webmanifest`
- QR de donativos: `public/donativo/`
- Scripts: `scripts/generar_qr_donativo.py`, `scripts/generar_iconos_pwa.py`
- Config: `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `components.json`, `netlify.toml`, `bun.lock`

## 📁 Cómo usar este respaldo

### Opción A: Restaurar todo el proyecto
1. Descomprime este zip donde quieras tener el proyecto
2. Crea un archivo `.env` con:
   ```
   DATABASE_URL=file:./db/custom.db
   ```
3. Instala dependencias: `bun install` (o `npm install`)
4. Corre en local: `bun run dev` → http://localhost:3000

### Opción B: Restaurar solo los archivos modificados
Si solo quieres sobrescribir los archivos modificados sobre un repo existente, copia estas rutas:
- `public/logo.svg`
- `public/favicon.ico`
- `public/icons/icon.svg`
- `public/icons/icon-192.png`
- `public/icons/icon-192-maskable.png`
- `public/icons/icon-512.png`
- `public/icons/icon-512-maskable.png`
- `public/icons/apple-touch-icon.png`
- `public/icons/favicon-16.png`
- `public/icons/favicon-32.png`
- `src/components/SplashScreen.tsx` (nuevo)
- `src/app/globals.css`
- `src/app/page.tsx`
- `package.json`

## 🚀 Despliegue

### Vercel (recomendado para Next.js, plan gratis generoso)
1. Importa el repo en vercel.com
2. Build command: `next build`
3. Variable de entorno: `DATABASE_URL=file:./db/custom.db`
4. Deploy automático en cada push a GitHub

### Netlify
- Build command: `next build`
- Publish directory: `.next`
- Variable de entorno: `DATABASE_URL=file:./db/custom.db`
- Limitado a 300 min de build al mes en plan gratis

## ⚙️ Ajustes opcionales

- **Duración del splash**: edita `1500` en `src/components/SplashScreen.tsx`
- **Subtítulo del splash**: edita "Libros libres de dominio público" en `src/components/SplashScreen.tsx`
- **Título del carrusel de clásicos**: edita `label="Debes leer al menos una vez en la vida"` en `src/app/page.tsx`
- **Agregar/quitar libros del carrusel**: edita el array `MUST_READ_BOOKS` en `src/app/page.tsx`
- **Color del fondo del splash**: edita `.elmube-splash` en `src/app/globals.css`

## 📝 Notas

- El archivo `.env` NO está incluido en este zip (contiene una ruta local del sandbox). Créalo manualmente con `DATABASE_URL=file:./db/custom.db`
- La carpeta `skills/` NO está incluida (es del entorno de desarrollo, no pertenece a la app)
- El build fue probado y compila sin errores en Vercel
- TypeScript válido (verificado con `tsc --noEmit`)
