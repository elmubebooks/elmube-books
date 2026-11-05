import { NextRequest, NextResponse } from "next/server";

interface LinkCheck {
  url: string;
  label: string;
  status: "ok" | "error" | "timeout";
  code?: number;
  reason?: string;
}

/**
 * Verifica si un enlace funciona.
 * Usa fetch con redirect: "follow" para seguir redirecciones.
 * Verifica código final + Content-Type (HTML = error, no es el archivo real).
 */
async function checkUrl(url: string, label: string, timeoutMs = 8000): Promise<LinkCheck> {
  const result: LinkCheck = { url, label, status: "error" };

  try {
    // Crear un AbortController para el timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "ELMUBEBOOKS/1.0 (contacto: elmubebooks@gmail.com)",
        Accept: "*/*",
        // Pedir solo el primer byte para no descargar todo el archivo
        Range: "bytes=0-0",
      },
      redirect: "follow",
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    result.code = res.status;

    // Si el código es 401, 403, 404, 500 → error
    if (res.status === 401 || res.status === 403 || res.status === 404 || res.status >= 500) {
      result.status = "error";
      result.reason = `HTTP ${res.status}`;
      return result;
    }

    // Si el código es 200 o 206 (Partial Content) → probablemente OK
    // Pero necesitamos verificar el Content-Type
    if (res.status === 200 || res.status === 206) {
      const contentType = res.headers.get("content-type") || "";

      // Si el Content-Type es HTML → probablemente es una página de error
      // (ej: "Item not available" de Internet Archive)
      if (contentType.includes("text/html")) {
        // Leer el primer chunk para ver si contiene "not available" o "error"
        const text = await res.text();
        if (
          text.toLowerCase().includes("not available") ||
          text.toLowerCase().includes("item is not") ||
          text.toLowerCase().includes("authorization required") ||
          text.toLowerCase().includes("access denied") ||
          text.toLowerCase().includes("not found")
        ) {
          result.status = "error";
          result.reason = "Página de error (HTML)";
          return result;
        }
        // Si es HTML pero no contiene texto de error, podría ser un visor
        // Lo marcamos como dudoso pero OK
        result.status = "ok";
        result.reason = "HTML (posible visor)";
        return result;
      }

      // Si el Content-Type corresponde al formato esperado → OK
      const labelLower = label.toLowerCase();
      if (
        (labelLower.includes("epub") && (contentType.includes("epub") || contentType.includes("octet-stream") || contentType.includes("zip"))) ||
        (labelLower.includes("pdf") && contentType.includes("pdf")) ||
        (labelLower.includes("txt") && (contentType.includes("text") || contentType.includes("plain"))) ||
        (labelLower.includes("html") && contentType.includes("html")) ||
        (labelLower.includes("kindle") && (contentType.includes("octet-stream") || contentType.includes("mobipocket"))) ||
        (labelLower.includes("mp3") && contentType.includes("audio")) ||
        (labelLower.includes("zip") && (contentType.includes("zip") || contentType.includes("octet-stream"))) ||
        contentType.includes("octet-stream") ||
        contentType.includes("application/")
      ) {
        result.status = "ok";
        return result;
      }

      // Si no coincide el Content-Type esperado, marcar como OK (beneficio de la duda)
      result.status = "ok";
      return result;
    }

    // Códigos 2xx otros
    if (res.status >= 200 && res.status < 300) {
      result.status = "ok";
      return result;
    }

    // Cualquier otro código → error
    result.status = "error";
    result.reason = `HTTP ${res.status}`;
    return result;
  } catch (e: any) {
    if (e?.name === "AbortError") {
      result.status = "timeout";
      result.reason = "Timeout";
    } else {
      result.status = "error";
      result.reason = e?.message || "Error de red";
    }
    return result;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const links: { url: string; label: string }[] = body.links || [];

    if (!links || links.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // Verificar todos los enlaces en paralelo
    const results = await Promise.all(
      links.map((link) => checkUrl(link.url, link.label))
    );

    return NextResponse.json({ results });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Error al verificar enlaces: " + (e?.message || "desconocido") },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
