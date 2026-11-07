# Actualización ELMUBE BOOKS — Logo + Splash Screen

## Archivos modificados en esta versión

### Logo (nuevo diseño: libro cerrado de canto)
- `public/logo.svg` — nuevo logo vectorial
- `public/favicon.ico` — favicon regenerado
- `public/icons/icon.svg` y todos los PNG (192, 512, maskable, apple-touch, favicon) — regenerados

### Splash screen animada (NUEVO)
- `src/components/SplashScreen.tsx` — componente nuevo
- `src/app/globals.css` — añade estilos del splash (`.elmube-splash-*`)
- `src/app/page.tsx` — importa y monta `<SplashScreen />` al inicio del render + usa el nuevo `logo.svg` en el header

## Cómo aplicar esta actualización

### Opción A: arrastrar todo a tu repo (más simple)
1. Descomprime este zip.
2. Copia **toda la carpeta descomprimida** sobre tu repo local existente (sobrescribe todo).
3. **NO sobrescribas tu `.env`** — el zip ya no lo incluye, así que mantendrás el tuyo.
4. Abre GitHub Desktop → verás los cambios → commit + push.
5. Netlify despliega automáticamente.

### Opción B: solo los archivos cambiados (más quirúrgico)
Si prefieres no tocar todo el repo, solo copia estos archivos:
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
- `src/components/SplashScreen.tsx`
- `src/app/globals.css`
- `src/app/page.tsx`

## Cómo verificar antes de subir (opcional)
```bash
bun install   # o npm install
bun run dev   # http://localhost:3000
```

Verás:
- Al cargar la app: splash con logo animado (pop + rotación + flotación), nombre "ELMUBE BOOKS" con fade-up, subtítulo "Libros libres de dominio público", barra de carga dorada, y auto-ocultamiento a los 1.5s.
- En el header: nuevo logo (libro cerrado de canto con lomo dorado).

## Ajustes opcionales
- **Duración del splash**: edita `1500` en `src/components/SplashScreen.tsx` (línea con `setTimeout`).
- **Subtítulo del splash**: edita `Libros libres de dominio público` en `src/components/SplashScreen.tsx`.
- **Mostrar splash solo en móvil**: importa `useMobile` (ya existe en `src/hooks/use-mobile.ts`) y condiciona el render.
- **Color del fondo del splash**: edita `.elmube-splash` en `src/app/globals.css`.
