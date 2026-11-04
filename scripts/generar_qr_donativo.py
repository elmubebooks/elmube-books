"""
Genera el QR para la CLABE interbancaria de ELMUBE BOOKS.
Donativos a: Miguel Balderas Medina
CLABE: 72 8969 0000 7116 7065
Banco: Spin by Oxxo

El QR se genera en formato SVG (escalable, nítido en cualquier tamaño) y PNG.
"""
import qrcode
from qrcode.constants import ERROR_CORRECT_M
import os
import qrcode.image.svg

# Datos de la cuenta
CLABE = "728969000071167065"
BENEFICIARIO = "MIGUEL BALDERAS MEDINA"
BANCO = "SPIN BY OXXO"

CLABE_LIMPIA = CLABE.replace(" ", "")

# Formato SPEI que reconocen muchas apps bancarias mexicanas
contenido_qr = (
    f"SPEI://{CLABE_LIMPIA}/?"
    f"beneficiario={BENEFICIARIO.replace(' ', '%20')}&"
    f"banco={BANCO.replace(' ', '%20')}"
)

contenido_clabe_simple = CLABE_LIMPIA

out_dir = "/home/z/my-project/public/donativo"
os.makedirs(out_dir, exist_ok=True)

def make_qr(data, filename):
    # PNG
    qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_M,
        box_size=10,
        border=2,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1a1a1a", back_color="white")
    png_path = os.path.join(out_dir, f"{filename}.png")
    img.save(png_path)
    print(f"PNG: {png_path}")

    # SVG
    factory = qrcode.image.svg.SvgImage
    svg_qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_M,
        box_size=10,
        border=2,
        image_factory=factory,
    )
    svg_qr.add_data(data)
    svg_qr.make(fit=True)
    svg_img = svg_qr.make_image(fill_color="#1a1a1a", back_color="white")
    svg_path = os.path.join(out_dir, f"{filename}.svg")
    with open(svg_path, "wb") as f:
        svg_img.save(f)
    print(f"SVG: {svg_path}")

print("=== QR SPEI (formato banca movil) ===")
make_qr(contenido_qr, "qr-spei")

print("\n=== QR CLABE simple ===")
make_qr(contenido_clabe_simple, "qr-clabe")

print("\n=== Datos ===")
print(f"Beneficiario: {BENEFICIARIO}")
print(f"CLABE: {CLABE}")
print(f"Banco: {BANCO}")
print(f"Contenido QR SPEI: {contenido_qr}")
