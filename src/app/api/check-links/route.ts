import { NextRequest, NextResponse } from "next/server";
import https from "https";

// Agente HTTPS que fuerza IPv4 e ignora certificados (para evitar errores TLS)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  family: 4,
});

interface LinkCheck {
  url: string;
  label: string;
  status: "ok" | "error" | "timeout";
  code?: number;
}

/**
 * Verifica si un enlace funciona haciendo una petición HEAD.
 * Usa https.get en vez de fetch para evitar problemas TLS/CORS.
 */
function checkUrl(url: string, timeoutMs = 5000): Promise<LinkCheck> {
  return new Promise((resolve) => {
    const result: LinkCheck = { url, label: "", status: "error" };

    const req = https.get(
      url,
      {
        agent: httpsAgent,
        method: "HEAD",
        headers: {
          "User-Agent": "ELMUBEBOOKS/1.0 (contacto: elmubebooks@gmail.com)",
          Accept: "*/*",
        },
        family: 4,
        timeout: timeoutMs,
      },
      (res) => {
        // Si el servidor responde (incluso con redirect), el enlace existe
        // Códigos 200, 301, 302, 304 = OK
        // Códigos 401, 403, 404, 500 = Error
        const code = res.statusCode || 0;
        result.code = code;
        if (code >= 200 && code < 400) {
          result.status = "ok";
        } else {
          result.status = "error";
        }
        // Consumir el cuerpo para liberar la conexión
        res.resume();
        resolve(result);
      }
    );

    req.on("error", (e) => {
      result.status = "error";
      resolve(result);
    });

    req.on("timeout", () => {
      req.destroy();
      result.status = "timeout";
      resolve(result);
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const links: { url: string; label: string }[] = body.links || [];

    if (!links || links.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // Verificar todos los enlaces en paralelo (máximo 8 a la vez)
    const results = await Promise.all(
      links.map((link) => checkUrl(link.url).then((r) => ({ ...r, label: link.label })))
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
