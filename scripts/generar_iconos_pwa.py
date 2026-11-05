"""
Genera iconos PWA de ELMUBE BOOKS.
Diseño: libro abierto estilizado + texto "ELMUBE BOOKS" debajo.
Combina la limpieza del libro abierto con el branding del nombre.
"""
from PIL import Image, ImageDraw, ImageFont
import os

OUT = "/home/z/my-project/public/icons"
os.makedirs(OUT, exist_ok=True)

# Colores de marca
BG_TOP = (122, 78, 41)        # marrón medio (degradado arriba)
BG_BOTTOM = (60, 38, 20)      # marrón oscuro (degradado abajo)
ACCENT_GOLD = (212, 165, 95)  # dorado
WHITE_CREAM = (252, 245, 230) # crema (libro + texto ELMUBE)
SHADOW = (30, 18, 8)          # sombra

def draw_gradient(draw, size, top_color, bottom_color):
    """Dibuja un degradado vertical suave."""
    for y in range(size):
        ratio = y / max(1, size - 1)
        r = int(top_color[0] * (1 - ratio) + bottom_color[0] * ratio)
        g = int(top_color[1] * (1 - ratio) + bottom_color[1] * ratio)
        b = int(top_color[2] * (1 - ratio) + bottom_color[2] * ratio)
        draw.line([(0, y), (size, y)], fill=(r, g, b))

def draw_open_book(draw, cx, cy, w, h, color, outline_color, line_w=2):
    """Dibuja un libro abierto estilizado (estilo Lucide BookOpen)."""
    half_w = w // 2
    left_x = cx - half_w
    right_x = cx + half_w
    top_y = cy - h // 2
    bottom_y = cy + h // 2
    spine_y = top_y + h // 6

    # Sombra del libro
    shadow_off = max(2, w // 30)
    book_points_shadow = [
        (left_x + shadow_off, top_y + shadow_off),
        (cx + shadow_off, spine_y + shadow_off),
        (right_x + shadow_off, top_y + shadow_off),
        (right_x + shadow_off, bottom_y + shadow_off),
        (cx + shadow_off, bottom_y - h // 6 + shadow_off),
        (left_x + shadow_off, bottom_y + shadow_off),
    ]
    draw.polygon(book_points_shadow, fill=SHADOW)

    # Página izquierda
    left_page = [
        (left_x, top_y),
        (cx, spine_y),
        (cx, bottom_y - h // 6),
        (left_x, bottom_y),
    ]
    draw.polygon(left_page, fill=color, outline=outline_color, width=line_w)

    # Página derecha
    right_page = [
        (cx, spine_y),
        (right_x, top_y),
        (right_x, bottom_y),
        (cx, bottom_y - h // 6),
    ]
    draw.polygon(right_page, fill=color, outline=outline_color, width=line_w)

    # Línea central (lomo)
    draw.line([(cx, spine_y), (cx, bottom_y - h // 6)], fill=outline_color, width=line_w)

    # Líneas de texto (3 líneas por página)
    page_line_w = max(1, w // 80)
    line_spacing = (h - h // 3) // 4
    start_y = spine_y + line_spacing
    for i in range(3):
        y = start_y + i * line_spacing
        # Página izquierda
        x1 = left_x + w // 10
        x2 = cx - w // 12
        draw.line([(x1, y), (x2, y)], fill=outline_color, width=page_line_w)
        # Página derecha
        x1 = cx + w // 12
        x2 = right_x - w // 10
        draw.line([(x1, y), (x2, y)], fill=outline_color, width=page_line_w)

def find_font(size):
    """Busca una fuente serif bold."""
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    for p in candidates:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

def fit_font(draw, text, max_width, start_size):
    """Encuentra el tamaño de fuente más grande que quepa en max_width."""
    size = start_size
    while size > 8:
        font = find_font(size)
        try:
            bbox = draw.textbbox((0, 0), text, font=font)
            w = bbox[2] - bbox[0]
            if w <= max_width:
                return font, w, bbox[3] - bbox[1]
        except Exception:
            pass
        size -= 1
    return find_font(start_size), max_width, start_size

def make_icon(size, filename, with_text=True, maskable=False):
    """
    Icono: libro abierto arriba + texto 'ELMUBE BOOKS' abajo.
    Si with_text=False: solo el libro (para tamaños muy pequeños).
    Si maskable=True: deja más margen (área segura).
    """
    img = Image.new("RGB", (size, size), BG_BOTTOM)
    draw = ImageDraw.Draw(img)

    # Fondo con degradado
    draw_gradient(draw, size, BG_TOP, BG_BOTTOM)

    if not maskable:
        # Borde dorado
        border_w = max(2, size // 50)
        margin = max(3, size // 40)
        draw.rectangle(
            [margin, margin, size - margin, size - margin],
            outline=ACCENT_GOLD,
            width=border_w,
        )

    if with_text and size >= 96:
        # Con texto: libro arriba + texto ELMUBE BOOKS abajo
        book_w = int(size * (0.55 if maskable else 0.62))
        book_h = int(size * (0.32 if maskable else 0.36))
        book_cy = int(size * 0.35)

        # Texto ELMUBE BOOKS en dos líneas - fuente más pequeña para que no se corte
        text_max_width = size - (4 * max(4, size // 30) if not maskable else size // 4)
        font_size_start = max(10, size // 8)

        font1, w1, h1 = fit_font(draw, "ELMUBE", text_max_width, font_size_start)
        font2, w2, h2 = fit_font(draw, "BOOKS", text_max_width, font_size_start)
        line_h = max(h1, h2)
        line_gap = max(2, size // 100)
        text_total_h = line_h * 2 + line_gap

        # Posición del texto: parte inferior, con margen generoso
        bottom_margin = max(8, size // 18)
        text_y = size - bottom_margin - text_total_h

        # ELMUBE (crema) - con sombra sutil para legibilidad
        shadow_off = max(1, size // 100)
        tx1 = (size - w1) // 2
        draw.text((tx1 + shadow_off, text_y + shadow_off), "ELMUBE", fill=SHADOW, font=font1)
        draw.text((tx1, text_y), "ELMUBE", fill=WHITE_CREAM, font=font1)
        # BOOKS (dorado vivo) - con sombra sutil
        tx2 = (size - w2) // 2
        book_y = text_y + line_h + line_gap
        draw.text((tx2 + shadow_off, book_y + shadow_off), "BOOKS", fill=SHADOW, font=font2)
        draw.text((tx2, book_y), "BOOKS", fill=ACCENT_GOLD, font=font2)

        book_cy = int(size * 0.36)
    else:
        # Solo libro, centrado
        book_w = int(size * (0.55 if maskable else 0.65))
        book_h = int(size * (0.45 if maskable else 0.50))
        book_cy = size // 2

    # Dibujar libro
    draw_open_book(
        draw,
        cx=size // 2,
        cy=book_cy,
        w=book_w,
        h=book_h,
        color=WHITE_CREAM,
        outline_color=ACCENT_GOLD,
        line_w=max(2, size // 64),
    )

    img.save(os.path.join(OUT, filename), "PNG", optimize=True)
    label = " + texto" if with_text and size >= 96 else " solo libro"
    label += " + maskable" if maskable else ""
    print(f"  ✓ {filename} ({size}x{size}){label}")

print("Generando iconos ELMUBE BOOKS (solo libro, sin texto):")
make_icon(512, "icon-512.png", with_text=False)
make_icon(512, "icon-512-maskable.png", with_text=False, maskable=True)
make_icon(192, "icon-192.png", with_text=False)
make_icon(192, "icon-192-maskable.png", with_text=False, maskable=True)
make_icon(180, "apple-touch-icon.png", with_text=False)
# Para tamaños pequeños, solo libro (mejor legibilidad)
make_icon(32, "favicon-32.png", with_text=False)
make_icon(16, "favicon-16.png", with_text=False)

# SVG: solo libro abierto, sin texto (más limpio, sin problemas de corte)
svg = """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7a4e29"/>
      <stop offset="100%" stop-color="#3c2614"/>
    </linearGradient>
    <linearGradient id="page" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fcf5e6"/>
      <stop offset="100%" stop-color="#f0e3c8"/>
    </linearGradient>
  </defs>

  <!-- Fondo con degradado -->
  <rect width="512" height="512" fill="url(#bg)"/>

  <!-- Borde dorado -->
  <rect x="12" y="12" width="488" height="488" fill="none" stroke="#d4a55f" stroke-width="10"/>

  <!-- Sombra del libro -->
  <g transform="translate(10 10)" opacity="0.5">
    <path d="M 76 110 L 256 160 L 436 110 L 436 340 L 256 300 L 76 340 Z" fill="#1e1206"/>
  </g>

  <!-- Libro abierto (más grande, centrado) -->
  <path d="M 76 110 L 256 160 L 256 300 L 76 340 Z" fill="url(#page)" stroke="#d4a55f" stroke-width="8"/>
  <path d="M 256 160 L 436 110 L 436 340 L 256 300 Z" fill="url(#page)" stroke="#d4a55f" stroke-width="8"/>
  <line x1="256" y1="160" x2="256" y2="300" stroke="#d4a55f" stroke-width="8"/>

  <!-- Líneas de texto (página izquierda) -->
  <line x1="110" y1="190" x2="240" y2="225" stroke="#7a4e29" stroke-width="5" stroke-linecap="round"/>
  <line x1="110" y1="230" x2="240" y2="250" stroke="#7a4e29" stroke-width="5" stroke-linecap="round"/>
  <line x1="110" y1="270" x2="240" y2="275" stroke="#7a4e29" stroke-width="5" stroke-linecap="round"/>
  <line x1="110" y1="310" x2="240" y2="300" stroke="#7a4e29" stroke-width="5" stroke-linecap="round"/>

  <!-- Líneas de texto (página derecha) -->
  <line x1="272" y1="225" x2="402" y2="190" stroke="#7a4e29" stroke-width="5" stroke-linecap="round"/>
  <line x1="272" y1="250" x2="402" y2="230" stroke="#7a4e29" stroke-width="5" stroke-linecap="round"/>
  <line x1="272" y1="275" x2="402" y2="270" stroke="#7a4e29" stroke-width="5" stroke-linecap="round"/>
  <line x1="272" y1="300" x2="402" y2="310" stroke="#7a4e29" stroke-width="5" stroke-linecap="round"/>
</svg>
"""
with open(os.path.join(OUT, "icon.svg"), "w") as f:
    f.write(svg)
print("  ✓ icon.svg")

# ICO favicon (solo libro, más legible en pequeño)
icon_16 = Image.open(os.path.join(OUT, "favicon-16.png"))
icon_32 = Image.open(os.path.join(OUT, "favicon-32.png"))
icon_48 = Image.new("RGB", (48, 48), BG_BOTTOM)
d48 = ImageDraw.Draw(icon_48)
draw_gradient(d48, 48, BG_TOP, BG_BOTTOM)
d48.rectangle([3, 3, 45, 45], outline=ACCENT_GOLD, width=2)
draw_open_book(d48, 24, 24, 30, 24, WHITE_CREAM, ACCENT_GOLD, line_w=2)
ico_path = "/home/z/my-project/public/favicon.ico"
icon_48.save(ico_path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
print("  ✓ favicon.ico")

print(f"\nIconos guardados en: {OUT}")
