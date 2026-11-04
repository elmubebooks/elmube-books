"""
Genera iconos PWA profesionales de ELMUBE BOOKS con el nombre completo legible.
Versión mejorada: mejor diseño, mejor tipografía, marca consistente.
"""
from PIL import Image, ImageDraw, ImageFont
import os

OUT = "/home/z/my-project/public/icons"
os.makedirs(OUT, exist_ok=True)

# Colores de marca
BG_PRIMARY = (60, 38, 20)        # marrón muy oscuro (fondo)
BG_GRADIENT_TOP = (107, 68, 35)  # marrón medio (parte superior del degradado)
ACCENT_GOLD = (212, 165, 95)     # dorado más vivo
WHITE_CREAM = (252, 245, 230)    # crema para texto

def find_font(size, bold=True):
    """Busca una fuente serif bold disponible."""
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    for p in candidates:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

def draw_gradient(draw, size, top_color, bottom_color):
    """Dibuja un degradado vertical."""
    for y in range(size):
        ratio = y / size
        r = int(top_color[0] * (1 - ratio) + bottom_color[0] * ratio)
        g = int(top_color[1] * (1 - ratio) + bottom_color[1] * ratio)
        b = int(top_color[2] * (1 - ratio) + bottom_color[2] * ratio)
        draw.line([(0, y), (size, y)], fill=(r, g, b))

def make_icon(size, filename):
    """Icono con libro dorado grande y 'ELMUBE BOOKS' debajo."""
    img = Image.new("RGB", (size, size), BG_PRIMARY)
    draw = ImageDraw.Draw(img)

    # Fondo con degradado
    draw_gradient(draw, size, BG_GRADIENT_TOP, BG_PRIMARY)

    # Borde dorado elegante
    border_w = max(3, size // 50)
    margin = max(4, size // 40)
    draw.rectangle(
        [margin, margin, size - margin, size - margin],
        outline=ACCENT_GOLD,
        width=border_w,
    )

    # Libro estilizado en la parte superior (50% del icono)
    book_size = int(size * 0.55)
    cx = size // 2
    cy = int(size * 0.38)  # centrado en parte superior
    bx1 = cx - book_size // 2
    by1 = cy - book_size // 2
    bx2 = cx + book_size // 2
    by2 = cy + book_size // 2

    # Sombra del libro
    shadow_offset = max(2, size // 100)
    draw.rectangle(
        [bx1 + shadow_offset, by1 + shadow_offset, bx2 + shadow_offset, by2 + shadow_offset],
        fill=(20, 12, 6),
    )

    # Cuerpo del libro (dorado)
    draw.rectangle([bx1, by1, bx2, by2], fill=ACCENT_GOLD, outline=WHITE_CREAM, width=max(1, size // 80))

    # Lomo del libro (línea vertical central)
    spine_w = max(3, size // 40)
    draw.line([(cx, by1), (cx, by2)], fill=BG_PRIMARY, width=spine_w)

    # Líneas de páginas (3 a cada lado)
    page_lines = 3
    line_w = max(1, size // 120)
    for i in range(page_lines):
        y = by1 + (i + 1) * (book_size // (page_lines + 1))
        # Izquierda
        draw.line([(bx1 + book_size // 12, y), (cx - spine_w, y)], fill=BG_PRIMARY, width=line_w)
        # Derecha
        draw.line([(cx + spine_w, y), (bx2 - book_size // 12, y)], fill=BG_PRIMARY, width=line_w)

    # Texto "ELMUBE BOOKS" en la parte inferior
    # Calcular tamaño de fuente que quepa
    target_text = "ELMUBE"
    target_text2 = "BOOKS"

    # Probar tamaños hasta que quepan
    font_size = max(12, size // 5)
    font = find_font(font_size)

    while font_size > 8:
        font = find_font(font_size)
        try:
            bbox1 = draw.textbbox((0, 0), target_text, font=font)
            bbox2 = draw.textbbox((0, 0), target_text2, font=font)
            w1 = bbox1[2] - bbox1[0]
            w2 = bbox2[2] - bbox2[0]
            max_w = max(w1, w2)
            if max_w <= size - 4 * margin:
                break
        except Exception:
            pass
        font_size -= 1

    # Dibujar "ELMUBE" arriba
    try:
        bbox1 = draw.textbbox((0, 0), target_text, font=font)
        w1 = bbox1[2] - bbox1[0]
        h1 = bbox1[3] - bbox1[1]
    except Exception:
        w1, h1 = font_size * 3, font_size

    try:
        bbox2 = draw.textbbox((0, 0), target_text2, font=font)
        w2 = bbox2[2] - bbox2[0]
        h2 = bbox2[3] - bbox2[1]
    except Exception:
        w2, h2 = font_size * 3, font_size

    line_h = max(h1, h2) + max(2, size // 80)
    text_total_h = line_h * 2
    text_start_y = size - margin - text_total_h - max(4, size // 30)

    # ELMUBE
    tx = (size - w1) // 2
    ty = text_start_y
    draw.text((tx, ty), target_text, fill=WHITE_CREAM, font=font)

    # BOOKS
    tx = (size - w2) // 2
    ty = text_start_y + line_h
    draw.text((tx, ty), target_text2, fill=ACCENT_GOLD, font=font)

    # Guardar
    img.save(os.path.join(OUT, filename), "PNG", optimize=True)
    print(f"  ✓ {filename} ({size}x{size})")

print("Generando iconos PWA mejorados de ELMUBE BOOKS:")
make_icon(192, "icon-192.png")
make_icon(512, "icon-512.png")
make_icon(180, "apple-touch-icon.png")
make_icon(32, "favicon-32.png")
make_icon(16, "favicon-16.png")

# SVG moderno y nítido
svg = """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6b4423"/>
      <stop offset="100%" stop-color="#3c2614"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <rect x="10" y="10" width="492" height="492" fill="none" stroke="#d4a55f" stroke-width="10"/>

  <!-- Libro dorado -->
  <g transform="translate(256 200)">
    <!-- Sombra -->
    <rect x="-128" y="-128" width="256" height="256" fill="#1f1208" transform="translate(4 4)"/>
    <!-- Cuerpo -->
    <rect x="-128" y="-128" width="256" height="256" fill="#d4a55f" stroke="#fcf5e6" stroke-width="4"/>
    <!-- Lomo -->
    <line x1="0" y1="-128" x2="0" y2="128" stroke="#3c2614" stroke-width="14"/>
    <!-- Líneas de páginas -->
    <line x1="-100" y1="-80" x2="-15" y2="-80" stroke="#3c2614" stroke-width="4"/>
    <line x1="-100" y1="-40" x2="-15" y2="-40" stroke="#3c2614" stroke-width="4"/>
    <line x1="-100" y1="0" x2="-15" y2="0" stroke="#3c2614" stroke-width="4"/>
    <line x1="-100" y1="40" x2="-15" y2="40" stroke="#3c2614" stroke-width="4"/>
    <line x1="-100" y1="80" x2="-15" y2="80" stroke="#3c2614" stroke-width="4"/>
    <line x1="15" y1="-80" x2="100" y2="-80" stroke="#3c2614" stroke-width="4"/>
    <line x1="15" y1="-40" x2="100" y2="-40" stroke="#3c2614" stroke-width="4"/>
    <line x1="15" y1="0" x2="100" y2="0" stroke="#3c2614" stroke-width="4"/>
    <line x1="15" y1="40" x2="100" y2="40" stroke="#3c2614" stroke-width="4"/>
    <line x1="15" y1="80" x2="100" y2="80" stroke="#3c2614" stroke-width="4"/>
  </g>

  <!-- Texto ELMUBE BOOKS -->
  <text x="256" y="410" font-family="Georgia, 'Times New Roman', serif" font-size="74" font-weight="bold" fill="#fcf5e6" text-anchor="middle" letter-spacing="2">ELMUBE</text>
  <text x="256" y="475" font-family="Georgia, 'Times New Roman', serif" font-size="74" font-weight="bold" fill="#d4a55f" text-anchor="middle" letter-spacing="2">BOOKS</text>
</svg>
"""
with open(os.path.join(OUT, "icon.svg"), "w") as f:
    f.write(svg)
print("  ✓ icon.svg")

# ICO favicon (multiresolución)
ico_sizes = [16, 32, 48]
ico_imgs = []
for s in ico_sizes:
    ico_imgs.append(make_icon(s, f"_tmp_{s}.png"))
# El ICO se crea combinando PNGs con PIL
icon_32 = Image.open(os.path.join(OUT, "favicon-32.png"))
icon_16 = Image.open(os.path.join(OUT, "favicon-16.png"))
icon_48 = make_icon(48, "_tmp_48.png")  # temporal
ico_path = "/home/z/my-project/public/favicon.ico"
icon_48_img = Image.open(os.path.join(OUT, "_tmp_48.png"))
icon_48_img.save(ico_path, format="ICO", sizes=[(16,16),(32,32),(48,48)])
os.remove(os.path.join(OUT, "_tmp_48.png"))
print(f"  ✓ favicon.ico")

print(f"\nIconos guardados en: {OUT}")
