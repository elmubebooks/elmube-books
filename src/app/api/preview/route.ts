import { NextRequest, NextResponse } from "next/server";

/**
 * Vista previa del texto de un libro.
 * Recibe ?url=<URL del TXT o HTML de Gutenberg/Standard Ebooks>
 * Devuelve los primeros ~5000 caracteres en texto plano.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Falta parámetro url" }, { status: 400 });
  }

  // Solo permitir URLs de fuentes conocidas (seguridad)
  const allowed = [
    "https://www.gutenberg.org/",
    "https://gutenberg.org/",
    "https://standardebooks.org/",
    "https://archive.org/",
  ];
  const isAllowed = allowed.some((p) => url.startsWith(p));
  if (!isAllowed) {
    return NextResponse.json({ error: "URL no permitida" }, { status: 403 });
  }

  try {
    const res = await fetch(url, {
      headers: { Accept: "text/plain, text/html, */*" },
      // No cachear mucho para no quedarse con vista previa stale
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `No se pudo obtener el texto (HTTP ${res.status})` },
        { status: 502 }
      );
    }
    const raw = await res.text();
    let text = raw;

    // Si es HTML, quitar tags
    if (url.endsWith(".html") || url.includes(".htm") || raw.trim().startsWith("<")) {
      // Quitar scripts y styles
      text = raw
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<head[\s\S]*?<\/head>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#\d+;/g, "");
    }

    // Normalizar espacios
    text = text.replace(/\s+/g, " ").trim();

    // Tomar los primeros 6000 caracteres, intentar cortar en límite de palabra
    const MAX = 6000;
    let excerpt = text.slice(0, MAX);
    if (text.length > MAX) {
      const lastSpace = excerpt.lastIndexOf(" ");
      if (lastSpace > MAX - 200) excerpt = excerpt.slice(0, lastSpace);
      excerpt += "…";
    }

    return NextResponse.json({
      excerpt,
      totalLength: text.length,
      truncated: text.length > MAX,
      source: url,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Error al descargar vista previa: " + (e?.message || "desconocido") },
      { status: 500 }
    );
  }
}
