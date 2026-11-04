"""
Genera los iconos PWA de ELMUBE BOOKS.
- 192x192 (requerido)
- 512x512 (requerido)
- 180x180 (Apple touch icon)
- 32x32 (favicon)
- svg con marca
"""
from PIL import Image, ImageDraw, ImageFont
import os

OUT = "/home/z/my-project/public/icons"
os.makedirs(OUT, exist_ok=True)

# Colores de marca (mismo marrón de la app)
BG_COLOR = (107, 68, 35)      # marrón oscuro (primary)
ACCENT = (196, 154, 91)       # dorado (accent)
WHITE = (255, 248, 235)

def find_font(size):
    """Busca una fuente serif disponible en el sistema."""
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ]
    for p in candidates:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

def make_icon(size, filename, with_book=True):
    """Genera un icono cuadrado con fondo marrón y 'EB' o un libro."""
    img = Image.new("RGB", (size, size), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # Borde dorado
    margin = max(2, size // 24)
    draw.rectangle(
        [margin, margin, size - margin, size - margin],
        outline=ACCENT,
        width=max(2, size // 32),
    )

    if with_book:
        # Dibujar un libro simple (rectángulo con líneas)
        book_w = int(size * 0.5)
        book_h = int(size * 0.55)
        cx = size // 2
        cy = size // 2
        # Cuerpo del libro
        bx1 = cx - book_w // 2
        by1 = cy - book_h // 2
        bx2 = cx + book_w // 2
        by2 = cy + book_h // 2
        draw.rectangle([bx1, by1, bx2, by2], fill=ACCENT, outline=WHITE, width=max(1, size // 64))
        # Línea central (lomo)
        draw.line([(cx, by1 + 4), (cx, by2 - 4)], fill=BG_COLOR, width=max(2, size // 48))
        # Líneas de páginas
        for i in range(3):
            y = by1 + (i + 1) * (book_h // 4)
            draw.line([(bx1 + 8, y), (cx - 6, y)], fill=BG_COLOR, width=max(1, size // 80))
            draw.line([(cx + 6, y), (bx2 - 8, y)], fill=BG_COLOR, width=max(1, size // 80))

    # Texto "EB" abajo
    font_size = max(10, size // 6)
    font = find_font(font_size)
    text = "ELMUBE"
    try:
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
    except Exception:
        tw, th = font_size * 3, font_size
    tx = (size - tw) // 2
    ty = size - margin - th - max(4, size // 32)
    draw.text((tx, ty), text, fill=WHITE, font=font)

    img.save(os.path.join(OUT, filename), "PNG", optimize=True)
    print(f"  ✓ {filename} ({size}x{size})")

print("Generando iconos PWA de ELMUBE BOOKS:")
make_icon(192, "icon-192.png")
make_icon(512, "icon-512.png")
make_icon(180, "apple-touch-icon.png")
make_icon(32, "favicon-32.png")

# SVG simple para favicon moderno
svg = """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#6b4423"/>
  <rect x="20" y="20" width="472" height="472" fill="none" stroke="#c49a5b" stroke-width="16"/>
  <g transform="translate(256 220)">
    <rect x="-128" y="-140" width="256" height="280" fill="#c49a5b" stroke="#fff8eb" stroke-width="6"/>
    <line x1="0" y1="-130" x2="0" y2="130" stroke="#6b4423" stroke-width="10"/>
    <line x1="-110" y1="-80" x2="-20" y2="-80" stroke="#6b4423" stroke-width="5"/>
    <line x1="-110" y1="-40" x2="-20" y2="-40" stroke="#6b4423" stroke-width="5"/>
    <line x1="-110" y1="0" x2="-20" y2="0" stroke="#6b4423" stroke-width="5"/>
    <line x1="-110" y1="40" x2="-20" y2="40" stroke="#6b4423" stroke-width="5"/>
    <line x1="-110" y1="80" x2="-20" y2="80" stroke="#6b4423" stroke-width="5"/>
    <line x1="20" y1="-80" x2="110" y2="-80" stroke="#6b4423" stroke-width="5"/>
    <line x1="20" y1="-40" x2="110" y2="-40" stroke="#6b4423" stroke-width="5"/>
    <line x1="20" y1="0" x2="110" y2="0" stroke="#6b4423" stroke-width="5"/>
    <line x1="20" y1="40" x2="110" y2="40" stroke="#6b4423" stroke-width="5"/>
    <line x1="20" y1="80" x2="110" y2="80" stroke="#6b4423" stroke-width="5"/>
  </g>
  <text x="256" y="470" font-family="Georgia, serif" font-size="64" font-weight="bold" fill="#fff8eb" text-anchor="middle">ELMUBE</text>
</svg>
"""
with open(os.path.join(OUT, "icon.svg"), "w") as f:
    f.write(svg)
print("  ✓ icon.svg")

print(f"\nIconos guardados en: {OUT}")
