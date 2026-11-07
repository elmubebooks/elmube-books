"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Pantalla de splash de ELMUBE BOOKS.
 *
 * Animaciones:
 *  - Logo: entrada con pop (scale 0→1) + rotación suave (-25°→0°)
 *  - Logo: flotación continua (y: 0 → -10 → 0) en bucle
 *  - Nombre de la app: fade-up (opacity 0→1, y 20→0)
 *  - Subtítulo: fade-up con pequeño retardo
 *  - Barra de carga: brillo deslizándose en bucle
 *  - Auto-ocultamiento tras ~1.5 s con fade out
 */
export function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center elmube-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          role="status"
          aria-live="polite"
          aria-label="Cargando ELMUBE BOOKS"
        >
          {/* Logo: pop + rotación suave + flotación continua */}
          <motion.div
            initial={{ scale: 0, rotate: -25, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 220,
              damping: 14,
              delay: 0.1,
            }}
            className="elmube-splash-logo"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.6,
              }}
            >
              <ElmubeLogo />
            </motion.div>
          </motion.div>

          {/* Nombre de la app con fade-up */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.55, ease: "easeOut" }}
            className="elmube-splash-title"
          >
            ELMUBE BOOKS
          </motion.h1>

          {/* Subtítulo descriptivo */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.55, ease: "easeOut" }}
            className="elmube-splash-subtitle"
          >
            Libros libres de dominio público
          </motion.p>

          {/* Barra de carga animada */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85, duration: 0.3 }}
            className="elmube-splash-progress"
            aria-hidden="true"
          >
            <motion.div
              initial={{ x: "-110%" }}
              animate={{ x: "110%" }}
              transition={{
                duration: 1.1,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.85,
              }}
              className="elmube-splash-progress-fill"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ----- Logo inline (SVG) — Libro cerrado de canto con lomo dorado ----- */
function ElmubeLogo() {
  return (
    <svg
      viewBox="0 0 512 512"
      width="132"
      height="132"
      role="img"
      aria-label="Logo ELMUBE BOOKS"
      className="elmube-splash-logo-svg"
    >
      <defs>
        <linearGradient id="splash-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a5832" />
          <stop offset="55%" stopColor="#5a3618" />
          <stop offset="100%" stopColor="#321e0e" />
        </linearGradient>
        <radialGradient id="splash-vignette" cx="0.5" cy="0.45" r="0.7">
          <stop offset="0%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
        <linearGradient id="splash-leather" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7a4a26" />
          <stop offset="50%" stopColor="#5e3517" />
          <stop offset="100%" stopColor="#42260e" />
        </linearGradient>
        <linearGradient id="splash-spine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#a07635" />
          <stop offset="50%" stopColor="#f0c878" />
          <stop offset="100%" stopColor="#a07635" />
        </linearGradient>
        <linearGradient id="splash-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0c878" />
          <stop offset="50%" stopColor="#d4a55f" />
          <stop offset="100%" stopColor="#a07635" />
        </linearGradient>
        <radialGradient id="splash-medallion" cx="0.5" cy="0.4" r="0.6">
          <stop offset="0%" stopColor="#f4d088" />
          <stop offset="60%" stopColor="#d4a55f" />
          <stop offset="100%" stopColor="#8a5e2a" />
        </radialGradient>
        <linearGradient id="splash-leatherHL" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="40%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <pattern
          id="splash-stitching"
          x="0"
          y="0"
          width="10"
          height="14"
          patternUnits="userSpaceOnUse"
        >
          <rect x="3" y="0" width="4" height="6" fill="#3a2008" opacity="0.7" />
        </pattern>
        <filter id="splash-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="8" />
          <feOffset dx="0" dy="10" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width="512" height="512" rx="20" fill="url(#splash-bg)" />
      <rect width="512" height="512" rx="20" fill="url(#splash-vignette)" />

      <rect
        x="14"
        y="14"
        width="484"
        height="484"
        rx="14"
        fill="none"
        stroke="url(#splash-gold)"
        strokeWidth="6"
      />
      <rect
        x="24"
        y="24"
        width="464"
        height="464"
        rx="10"
        fill="none"
        stroke="#d4a55f"
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      <g fill="#d4a55f" opacity="0.85">
        <polygon points="34,34 40,28 46,34 40,40" />
        <polygon points="466,34 472,28 478,34 472,40" />
        <polygon points="34,478 40,472 46,478 40,484" />
        <polygon points="466,478 472,472 478,478 472,484" />
      </g>

      {/* ====== Libro cerrado ====== */}
      <g filter="url(#splash-shadow)">
        <ellipse cx="256" cy="430" rx="170" ry="14" fill="#000" opacity="0.4" />

        {/* Cuerpo del libro (portada de cuero) */}
        <rect
          x="96"
          y="100"
          width="320"
          height="312"
          rx="6"
          ry="6"
          fill="url(#splash-leather)"
          stroke="#2a1606"
          strokeWidth="2"
        />
        <rect
          x="96"
          y="100"
          width="320"
          height="312"
          rx="6"
          ry="6"
          fill="url(#splash-leatherHL)"
        />

        {/* Lomo dorado vertical (banda izquierda) */}
        <rect
          x="96"
          y="100"
          width="56"
          height="312"
          fill="url(#splash-spine)"
          stroke="#7a4e29"
          strokeWidth="1"
        />
        <rect x="100" y="112" width="4" height="288" fill="url(#splash-stitching)" />
        <rect x="142" y="112" width="4" height="288" fill="url(#splash-stitching)" />

        {/* Marco interior decorativo de la portada */}
        <rect
          x="170"
          y="120"
          width="226"
          height="272"
          rx="3"
          ry="3"
          fill="none"
          stroke="#d4a55f"
          strokeWidth="2"
          opacity="0.85"
        />
        <rect
          x="178"
          y="128"
          width="210"
          height="256"
          rx="2"
          ry="2"
          fill="none"
          stroke="#d4a55f"
          strokeWidth="1"
          opacity="0.55"
        />

        {/* Medallón central con monograma EB */}
        <circle
          cx="283"
          cy="220"
          r="52"
          fill="url(#splash-medallion)"
          stroke="#7a4e29"
          strokeWidth="2.5"
        />
        <circle
          cx="283"
          cy="220"
          r="44"
          fill="none"
          stroke="#3a2008"
          strokeWidth="1"
          opacity="0.4"
        />
        <text
          x="283"
          y="234"
          textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="46"
          fontWeight="bold"
          fill="#3a2008"
          letterSpacing="-2"
        >
          EB
        </text>

        {/* Título grabado en la portada */}
        <text
          x="283"
          y="305"
          textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="22"
          fontWeight="bold"
          fill="#d4a55f"
          letterSpacing="4"
        >
          ELMUBE
        </text>
        <text
          x="283"
          y="335"
          textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="18"
          fill="#d4a55f"
          letterSpacing="8"
          opacity="0.85"
        >
          BOOKS
        </text>

        {/* Línea decorativa bajo el título */}
        <line
          x1="220"
          y1="355"
          x2="346"
          y2="355"
          stroke="#d4a55f"
          strokeWidth="1"
          opacity="0.6"
        />
        <circle cx="283" cy="355" r="2.5" fill="#d4a55f" opacity="0.8" />

        {/* Filete de páginas en el borde inferior */}
        <rect x="100" y="408" width="312" height="4" fill="#f0c878" />
        <rect x="100" y="404" width="312" height="2" fill="#a07635" opacity="0.6" />
        <rect x="100" y="412" width="312" height="2" fill="#3a2008" opacity="0.5" />

        {/* Sellos ornamentales en el lomo */}
        <g transform="translate(124 130)" opacity="0.9">
          <circle r="10" fill="none" stroke="#3a2008" strokeWidth="1.5" />
          <circle r="6" fill="#3a2008" opacity="0.6" />
          <circle r="3" fill="#d4a55f" />
        </g>
        <g transform="translate(124 382)" opacity="0.9">
          <circle r="10" fill="none" stroke="#3a2008" strokeWidth="1.5" />
          <circle r="6" fill="#3a2008" opacity="0.6" />
          <circle r="3" fill="#d4a55f" />
        </g>
      </g>

      <ellipse cx="256" cy="120" rx="180" ry="35" fill="#fff" opacity="0.05" />
    </svg>
  );
}
