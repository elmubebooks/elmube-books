import { NextRequest, NextResponse } from "next/server";

export interface Book {
  id: string;
  title: string;
  author: string;
  year?: number | null;
  language?: string;
  subjects?: string[];
  cover?: string | null;
  description?: string | null;
  source: "gutenberg" | "openlibrary" | "standardebooks";
  downloads: { label: string; url: string }[];
  previewUrl?: string | null;
}

/* Mapeo categorías UI → keywords por fuente */
export const CATEGORY_MAP: Record<
  string,
  { gutenberg: string; openlibrary: string; standardebooks: string }
> = {
  ficcion: {
    gutenberg: "fiction",
    openlibrary: "fiction",
    standardebooks: "fiction",
  },
  poesia: {
    gutenberg: "poetry",
    openlibrary: "poetry",
    standardebooks: "poetry",
  },
  filosofia: {
    gutenberg: "philosophy",
    openlibrary: "philosophy",
    standardebooks: "philosophy",
  },
  teatro: {
    gutenberg: "drama",
    openlibrary: "drama",
    standardebooks: "drama",
  },
  historia: {
    gutenberg: "history",
    openlibrary: "history",
    standardebooks: "history",
  },
  ciencia: {
    gutenberg: "science",
    openlibrary: "science",
    standardebooks: "science",
  },
  aventuras: {
    gutenberg: "adventure",
    openlibrary: "adventure",
    standardebooks: "adventure",
  },
  misterio: {
    gutenberg: "detective",
    openlibrary: "mystery",
    standardebooks: "mystery",
  },
  romance: {
    gutenberg: "romance",
    openlibrary: "romance",
    standardebooks: "romance",
  },
  infantiles: {
    gutenberg: "children",
    openlibrary: "juvenile fiction",
    standardebooks: "children",
  },
  religion: {
    gutenberg: "religion",
    openlibrary: "religion",
    standardebooks: "religion",
  },
  biografia: {
    gutenberg: "biography",
    openlibrary: "biography",
    standardebooks: "biography",
  },
};

/* Mapeo idioma UI → código por fuente */
const LANG_MAP: Record<string, { gutenberg: string; openlibrary: string }> = {
  es: { gutenberg: "es", openlibrary: "spa" },
  en: { gutenberg: "en", openlibrary: "eng" },
  fr: { gutenberg: "fr", openlibrary: "fre" },
  de: { gutenberg: "de", openlibrary: "ger" },
  it: { gutenberg: "it", openlibrary: "ita" },
  pt: { gutenberg: "pt", openlibrary: "por" },
};

/* ================= Project Gutenberg (OPDS feed directo) ================= */
// Gutendex está bajo Cloudflare con challenge que bloquea peticiones servidor,
// así que usamos el feed OPDS oficial: https://www.gutenberg.org/ebooks/search.opds/?query=...
// Para categorías: https://www.gutenberg.org/ebooks/subjects/{topic}.opds (paginado por ?start_index=)
async function searchGutenberg(
  query: string,
  page: number,
  language?: string,
  topic?: string
) {
  try {
    const pageIdx = Math.max(1, page);
    const start = (pageIdx - 1) * 25 + 1;

    let url: string;
    // Para categorías usamos el buscador OPDS con el topic como query
    // (el endpoint /ebooks/subjects/{topic}.opds devuelve 403)
    const q = topic && query ? `${query} ${topic}` : topic || query;
    url = `https://www.gutenberg.org/ebooks/search.opds/?query=${encodeURIComponent(q)}&start_index=${start}`;

    const res = await fetch(url, {
      headers: { Accept: "application/atom+xml" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const xml = await res.text();

    const results: Book[] = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let m: RegExpExecArray | null;
    while ((m = entryRegex.exec(xml)) !== null) {
      const block = m[1];
      // Solo entradas que sean ebooks (tienen /ebooks/ID.opds)
      const idMatch = block.match(/<id>https?:\/\/[^<]*\/ebooks\/(\d+)\.opds<\/id>/);
      if (!idMatch) continue;
      const ebookId = idMatch[1];
      const title = block.match(/<title>([^<]+)<\/title>/)?.[1] || "Sin título";
      // El autor suele ir en <content type="text">
      const contentMatch = block.match(/<content[^>]*>([^<]*)<\/content>/);
      const author = contentMatch?.[1]?.trim() || "Autor desconocido";

      // URLs canónicas de descarga para un ebook ID de Gutenberg
      // IMPORTANTE: Gutenberg NO ofrece PDF en la mayoría de los casos
      // (las URLs /files/{id}/{id}-pdf.pdf devuelven 404). Por eso no lo incluimos.
      const base = `https://www.gutenberg.org/ebooks/${ebookId}`;
      const formats: { label: string; url: string }[] = [
        { label: "EPUB", url: `${base}.epub3.images` },
        { label: "EPUB", url: `${base}.epub.images` },
        { label: "Kindle", url: `${base}.kf8.images` },
        { label: "HTML", url: `${base}.html.images` },
        { label: "TXT", url: `${base}.txt.utf-8` },
      ];
      // Quitar duplicados de label dejando solo el primero de cada tipo
      const seen = new Set<string>();
      const downloads = formats.filter((f) => {
        if (seen.has(f.label)) return false;
        seen.add(f.label);
        return true;
      });

      results.push({
        id: `gutenberg-${ebookId}`,
        title,
        author,
        year: null,
        language: language || "en",
        subjects: topic ? [topic] : [],
        cover: `https://www.gutenberg.org/cache/epub/${ebookId}/pg${ebookId}.cover.medium.jpg`,
        description: null,
        source: "gutenberg",
        downloads,
        previewUrl: `${base}.txt.utf-8`,
      });
    }

    // Filtrar por idioma: el feed OPDS no filtra por idioma, así que lo hacemos en cliente
    // solo si el usuario lo pide (limitación aceptable: filtramos por la URL del txt ya que
    // Gutenberg organiza por ID y no expone idioma en el feed)
    return results;
  } catch {
    return [];
  }
}

/* ================= Open Library ================= */
async function searchOpenLibrary(
  query: string,
  page: number,
  limit: number,
  language?: string,
  topic?: string
) {
  try {
    const pageIdx = Math.max(1, page);
    // Open Library soporta q=subject:Fiction y language=spa
    let q = query;
    if (topic && !query) q = `subject:${topic}`;
    else if (topic && query) q = `${query} subject:${topic}`;
    const params = new URLSearchParams({
      q,
      page: String(pageIdx),
      limit: String(limit),
      fields: "key,title,author_name,first_publish_year,language,subject,cover_i,ia",
    });
    if (language && LANG_MAP[language]) params.set("language", LANG_MAP[language].openlibrary);
    const url = `https://openlibrary.org/search.json?${params.toString()}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const results: Book[] = (data.docs || []).map((b: any) => {
      const cover = b.cover_i
        ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg`
        : null;
      const key = b.key;
      const downloads: { label: string; url: string }[] = [];
      if (b.ia && Array.isArray(b.ia) && b.ia.length > 0) {
        const iaId = b.ia[0];
        downloads.push({ label: "PDF", url: `https://archive.org/download/${iaId}/${iaId}.pdf` });
        downloads.push({ label: "EPUB", url: `https://archive.org/download/${iaId}/${iaId}.epub` });
        downloads.push({ label: "TXT", url: `https://archive.org/download/${iaId}/${iaId}_djvu.txt` });
      }
      if (key) {
        downloads.push({ label: "Leer online", url: `https://openlibrary.org${key}` });
      }
      return {
        id: `openlibrary-${(b.key || "").replace("/works/", "")}`,
        title: b.title || "Sin título",
        author: (b.author_name || ["Autor desconocido"])[0],
        year: b.first_publish_year || null,
        language: (b.language || [])[0] || null,
        subjects: (b.subject || []).slice(0, 6),
        cover,
        description: null,
        source: "openlibrary",
        downloads,
        previewUrl: null,
      };
    });
    return results;
  } catch {
    return [];
  }
}

/* ================= Standard Ebooks (OPDS feed) ================= */
async function searchStandardEbooks(
  query: string,
  page: number,
  limit: number,
  topic?: string
) {
  try {
    // Standard Ebooks tiene colecciones OPDS por categoría:
    // https://standardebooks.org/opds/collections/fiction
    const baseUrl = topic
      ? `https://standardebooks.org/opds/collections/${topic}`
      : "https://standardebooks.org/opds/all";
    const res = await fetch(baseUrl, {
      headers: { Accept: "application/atom+xml" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const entries: Book[] = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let m: RegExpExecArray | null;
    const q = (query || "").toLowerCase();
    const start = (page - 1) * limit;
    while ((m = entryRegex.exec(xml)) !== null) {
      const block = m[1];
      const title = block.match(/<title>([^<]+)<\/title>/)?.[1] || "";
      const authorEmail =
        block.match(/<author>[\s\S]*?<name>([^<]+)<\/name>/)?.[1] || "Autor desconocido";
      const id = block.match(/<id>([^<]+)<\/id>/)?.[1] || "";
      const summary =
        block.match(/<summary[^>]*>([\s\S]*?)<\/summary>/)?.[1]?.trim() || "";
      const linkRegex = /<link[^>]+>/g;
      const downloads: { label: string; url: string }[] = [];
      let previewUrl: string | null = null;
      let lm: RegExpExecArray | null;
      while ((lm = linkRegex.exec(block)) !== null) {
        const tag = lm[0];
        const href = tag.match(/href="([^"]+)"/)?.[1] || "";
        const type = tag.match(/type="([^"]+)"/)?.[1] || "";
        const rel = tag.match(/rel="([^"]+)"/)?.[1] || "";
        if (rel === "http://opds-spec.org/acquisition" && href) {
          let label = "Archivo";
          if (type.includes("epub+zip")) label = "EPUB";
          else if (type.includes("epub3")) label = "EPUB3";
          else if (type.includes("pdf")) label = "PDF";
          else if (type.includes("html")) label = "HTML";
          else if (type.includes("text/plain")) label = "TXT";
          else if (type.includes("mobipocket")) label = "Kindle";
          else if (type.includes("kobo")) label = "Kobo";
          downloads.push({ label, url: href });
          if (type.includes("html")) previewUrl = href;
        }
      }
      const matches = !q || title.toLowerCase().includes(q) || authorEmail.toLowerCase().includes(q);
      if (matches) {
        entries.push({
          id: `standardebooks-${id}`,
          title,
          author: authorEmail,
          year: null,
          language: "en",
          subjects: [],
          cover: null,
          description: summary.replace(/<[^>]+>/g, "").slice(0, 400) || null,
          source: "standardebooks",
          downloads,
          previewUrl,
        });
      }
    }
    return entries.slice(start, start + limit);
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("q") || "").trim();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(48, Math.max(6, parseInt(searchParams.get("limit") || "12", 10)));
  const source = (searchParams.get("source") || "all").toLowerCase();
  const language = (searchParams.get("language") || "").toLowerCase();
  const category = (searchParams.get("category") || "").toLowerCase();

  // Permitir búsqueda vacía si hay categoría
  if (!query && !category) {
    return NextResponse.json({ books: [], total: 0, query, page, source });
  }

  const topic = category && CATEGORY_MAP[category] ? CATEGORY_MAP[category].gutenberg : undefined;

  const tasks: Promise<Book[]>[] = [];
  if (source === "all" || source === "gutenberg")
    tasks.push(searchGutenberg(query, page, language || undefined, topic));
  if (source === "all" || source === "openlibrary")
    tasks.push(searchOpenLibrary(query, page, limit, language || undefined, topic));
  if (source === "all" || source === "standardebooks")
    tasks.push(searchStandardEbooks(query, page, limit, topic));

  const settled = await Promise.allSettled(tasks);
  let books: Book[] = [];
  for (const r of settled) {
    if (r.status === "fulfilled") books = books.concat(r.value);
  }

  books.sort((a, b) => {
    const aD = a.downloads.length > 0 ? 1 : 0;
    const bD = b.downloads.length > 0 ? 1 : 0;
    if (aD !== bD) return bD - aD;
    return a.title.localeCompare(b.title);
  });

  return NextResponse.json({
    books: books.slice(0, limit * 2),
    total: books.length,
    query,
    page,
    source,
    language,
    category,
  });
}
