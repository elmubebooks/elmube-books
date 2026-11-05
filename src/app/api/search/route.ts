import { NextRequest, NextResponse } from "next/server";
import https from "https";

// Workaround para error "fetch failed" con LibriVox (problema TLS/IPv6 de undici)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  family: 4, // Forzar IPv4
});

export type BookSource = "gutenberg" | "openlibrary" | "standardebooks" | "archive" | "wikisource" | "wattpad" | "librivox";

export interface Book {
  id: string;
  title: string;
  author: string;
  year?: number | null;
  language?: string;
  subjects?: string[];
  cover?: string | null;
  description?: string | null;
  source: BookSource;
  downloads: { label: string; url: string }[];
  previewUrl?: string | null;
  audioUrl?: string | null;
  audioDuration?: string | null;
  isAudiobook?: boolean;
}

/* Mapeo categorías UI → keywords por fuente */
export const CATEGORY_MAP: Record<
  string,
  { gutenberg: string; openlibrary: string; standardebooks: string; gutenbergEs?: string }
> = {
  // Literatura
  ficcion: { gutenberg: "fiction", openlibrary: "fiction", standardebooks: "fiction", gutenbergEs: "novela español" },
  novela: { gutenberg: "novel", openlibrary: "novel", standardebooks: "fiction", gutenbergEs: "novela español" },
  cuentos: { gutenberg: "short stories", openlibrary: "short stories", standardebooks: "fiction", gutenbergEs: "cuentos español" },
  poesia: { gutenberg: "poetry", openlibrary: "poetry", standardebooks: "poetry", gutenbergEs: "poesía español" },
  teatro: { gutenberg: "drama", openlibrary: "drama", standardebooks: "drama", gutenbergEs: "teatro español" },
  ensayo: { gutenberg: "essays", openlibrary: "essays", standardebooks: "essays", gutenbergEs: "ensayo español" },
  // Géneros narrativos
  aventuras: { gutenberg: "adventure", openlibrary: "adventure", standardebooks: "adventure", gutenbergEs: "aventura español" },
  misterio: { gutenberg: "detective", openlibrary: "mystery", standardebooks: "mystery", gutenbergEs: "misterio español" },
  romance: { gutenberg: "romance", openlibrary: "romance", standardebooks: "romance", gutenbergEs: "amor español" },
  terror: { gutenberg: "horror", openlibrary: "horror", standardebooks: "horror", gutenbergEs: "terror español" },
  ciencia_ficcion: { gutenberg: "science fiction", openlibrary: "science fiction", standardebooks: "science fiction", gutenbergEs: "ciencia ficción español" },
  fantasia: { gutenberg: "fantasy", openlibrary: "fantasy", standardebooks: "fantasy", gutenbergEs: "fantasía español" },
  humor: { gutenberg: "humor", openlibrary: "humor", standardebooks: "humor", gutenbergEs: "humor español" },
  // Conocimiento
  filosofia: { gutenberg: "philosophy", openlibrary: "philosophy", standardebooks: "philosophy", gutenbergEs: "filosofía español" },
  historia: { gutenberg: "history", openlibrary: "history", standardebooks: "history", gutenbergEs: "historia español" },
  ciencia: { gutenberg: "science", openlibrary: "science", standardebooks: "science", gutenbergEs: "ciencia español" },
  religion: { gutenberg: "religion", openlibrary: "religion", standardebooks: "religion", gutenbergEs: "religión español" },
  biografia: { gutenberg: "biography", openlibrary: "biography", standardebooks: "biography", gutenbergEs: "biografía español" },
  politica: { gutenberg: "politics", openlibrary: "politics", standardebooks: "politics", gutenbergEs: "política español" },
  economia: { gutenberg: "economics", openlibrary: "economics", standardebooks: "economics", gutenbergEs: "economía español" },
  // Especial
  infantiles: { gutenberg: "children", openlibrary: "juvenile fiction", standardebooks: "children", gutenbergEs: "cuentos niños español" },
  juvenil: { gutenberg: "young adult", openlibrary: "young adult fiction", standardebooks: "young adult", gutenbergEs: "juvenil español" },
  viajes: { gutenberg: "travel", openlibrary: "travel", standardebooks: "travel", gutenbergEs: "viajes español" },
  cocina: { gutenberg: "cooking", openlibrary: "cookery", standardebooks: "cooking", gutenbergEs: "cocina español" },
  musica: { gutenberg: "music", openlibrary: "music", standardebooks: "music", gutenbergEs: "música español" },
  arte: { gutenberg: "art", openlibrary: "art", standardebooks: "art", gutenbergEs: "arte español" },
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
    // Filtrar resultados: si hay idioma seleccionado, excluir libros que NO lo tengan
    // Para mayor precisión, exigimos que el idioma esté en la lista de idiomas del libro
    const docsRaw: any[] = data.docs || [];
    const docs = language && LANG_MAP[language]
      ? docsRaw.filter((b: any) => {
          const langs = b.language || [];
          const targetLang = LANG_MAP[language].openlibrary;
          // Si el libro no trae idioma, lo excluimos cuando hay filtro activo
          if (langs.length === 0) return false;
          return langs.includes(targetLang);
        })
      : docsRaw;
    const results: Book[] = docs.map((b: any) => {
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
        // Si hay idioma filtrado, mostrar ese; si no, el primero
        language: language && LANG_MAP[language] && (b.language || []).includes(LANG_MAP[language].openlibrary)
          ? LANG_MAP[language].openlibrary
          : (b.language || [])[0] || null,
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

/* ================= Internet Archive (libros + audiolibros) ================= */
async function searchArchive(query: string, page: number, limit: number, language?: string) {
  try {
    const start = (Math.max(1, page) - 1) * limit;

    // Hacemos DOS búsquedas: una para libros (texts) y otra para audiolibros (audio)
    // y las combinamos. La API de Archive no soporta OR entre mediatypes correctamente.
    const buildQuery = (mediatype: string) => {
      let q = `mediatype:${mediatype}`;
      if (query) {
        q += ` AND (title:(${query}) OR creator:(${query}) OR description:(${query}))`;
      } else {
        q += ` AND collection:(gutenberg OR opensource OR americana)`;
      }
      if (language && LANG_MAP[language]) {
        const langMap: Record<string, string> = {
          es: "spa OR spanish OR español",
          en: "eng OR english",
          fr: "fre OR french OR français",
          de: "ger OR german OR deutsch",
          it: "ita OR italian",
          pt: "por OR portuguese",
        };
        if (langMap[language]) q += ` AND language:(${langMap[language]})`;
      }
      return q;
    };

    // Función para obtener docs de Archive
    const fetchDocs = async (mediatype: string): Promise<any[]> => {
      const params = new URLSearchParams({
        q: buildQuery(mediatype),
        "fl[]": "identifier,title,creator,year,language,description,collection",
        rows: String(mediatype === "audio" ? limit : limit),
        start: String(start),
        output: "json",
      });
      const url = `https://archive.org/advancedsearch.php?${params.toString()}`;
      const res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "ELMUBEBOOKS/1.0" },
        next: { revalidate: 60 },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data?.response?.docs || [];
    };

    // Lanzar búsquedas en paralelo
    // Solo buscar audiolibros cuando hay un query explícito del usuario
    // (no en carruseles por categoría, que traen audios aleatorios no literarios)
    const [textDocs, audioDocs] = await Promise.all([
      fetchDocs("texts"),
      query ? fetchDocs("audio") : Promise.resolve([] as any[]),
    ]);
    // Combinar: primero audiolibros, luego textos
    const docs = [...audioDocs, ...textDocs].slice(0, limit * 2);
    if (docs.length === 0) return [];

    // Para cada libro, obtener metadata completa (para archivos descargables)
    const results: Book[] = [];
    await Promise.all(
      docs.slice(0, limit).map(async (doc: any) => {
        try {
          const id = doc.identifier;
          const metaRes = await fetch(`https://archive.org/metadata/${id}`, {
            headers: { "User-Agent": "ELMUBEBOOKS/1.0" },
            next: { revalidate: 300 },
          });
          if (!metaRes.ok) return;
          const meta = await metaRes.json();
          const m = meta.metadata || {};
          const server = meta.server || "ia800001.us.archive.org";
          const dir = meta.dir || `/30/items/${id}`;

          // Construir URLs de descarga
          const downloads: { label: string; url: string }[] = [];
          let audioUrl: string | null = null;
          let totalDuration: string | null = null;
          let mp3Count = 0;
          for (const f of meta.files || []) {
            const name = f.name || "";
            const fmt = (f.format || "").toLowerCase();
            const url = `https://${server}${dir}/${name}`;
            if (fmt.includes("pdf") && !downloads.some((d) => d.label === "PDF"))
              downloads.push({ label: "PDF", url });
            else if ((fmt.includes("epub") || name.endsWith(".epub")) && !downloads.some((d) => d.label === "EPUB"))
              downloads.push({ label: "EPUB", url });
            else if ((fmt.includes("mobi") || fmt.includes("kindle")) && !downloads.some((d) => d.label === "Kindle"))
              downloads.push({ label: "Kindle", url });
            else if (fmt.includes("text") && name.includes("_djvu.txt"))
              downloads.push({ label: "TXT", url });
            else if (fmt.includes("html") || name.endsWith(".htm") || name.endsWith(".html"))
              downloads.push({ label: "HTML", url });
            // Detectar audiolibros (MP3)
            else if (fmt.includes("mp3") || name.endsWith(".mp3")) {
              mp3Count++;
              if (!audioUrl) audioUrl = url;
            }
          }

          // Determinar si es audiolibro: si el mediatype es audio o tiene MP3s
          const collections = Array.isArray(m.collection) ? m.collection : (m.collection ? [m.collection] : []);
          const mediatype = (m.mediatype || "").toLowerCase();
          const isLibrivox = collections.some((c: string) => String(c).toLowerCase().includes("librivox"));
          const isAudiobook = isLibrivox || mediatype === "audio" || mp3Count > 0;

          if (isAudiobook) {
            // Para audiolibros, ofrecer escuchar y descargar MP3
            downloads.unshift({ label: "▶ Escuchar online", url: `https://archive.org/details/${id}` });
            // URL de streaming (primer MP3 o playlist)
            if (mp3Count > 0) {
              downloads.push({ label: "MP3 (primero)", url: audioUrl! });
            }
            // Descargar todo como ZIP
            downloads.push({ label: "Audio ZIP", url: `https://archive.org/compress/${id}/formats=64KBPS MP3` });
            // Duración total si existe
            totalDuration = m.runtime || (mp3Count > 0 ? `${mp3Count} pistas` : null);
          } else {
            // Para libros, ofrecer "Leer en línea" (BookReader)
            downloads.push({ label: "Leer online", url: `https://archive.org/details/${id}` });
          }

          // Preview: TXT si existe (solo para libros, no audiolibros)
          const txtFile = !isAudiobook ? (meta.files || []).find((f: any) =>
            (f.format || "").toLowerCase().includes("text") && (f.name || "").includes("_djvu.txt")
          ) : null;
          const previewUrl = txtFile
            ? `https://${server}${dir}/${txtFile.name}`
            : null;

          results.push({
            id: `archive-${id}`,
            title: m.title || doc.title || "Sin título",
            author: Array.isArray(m.creator) ? m.creator.join(", ") : m.creator || "Autor desconocido",
            year: m.year ? parseInt(String(m.year).slice(0, 4), 10) || null : null,
            language: Array.isArray(m.language) ? m.language[0] : m.language || null,
            subjects: Array.isArray(m.collection) ? m.collection.slice(0, 4) : [],
            // Para audiolibros: no usar la portada de Archive (suele ser ondas de voz)
            // Usar null para que el fallback de audífonos se muestre en la UI
            cover: isAudiobook ? null : `https://archive.org/services/img/${id}`,
            description: Array.isArray(m.description) ? m.description[0]?.slice(0, 400) : (m.description || null),
            source: isAudiobook ? "librivox" : "archive",
            downloads,
            previewUrl,
            audioUrl: isAudiobook ? audioUrl : undefined,
            audioDuration: totalDuration,
            isAudiobook: isAudiobook,
          });
        } catch {}
      })
    );
    return results;
  } catch {
    return [];
  }
}

/* ================= Wikisource (obra en texto libre) ================= */
async function searchWikisource(query: string, page: number, limit: number, language?: string) {
  try {
    // Wikisource tiene APIs por idioma. Usamos es.wikisource.org si español, en.wikisource.org en otro caso
    const langCode = language === "es" ? "es" : "en";
    const baseUrl = `https://${langCode}.wikisource.org`;
    const params = new URLSearchParams({
      action: "query",
      list: "search",
      srsearch: query,
      srlimit: String(limit),
      srnamespace: "0|102|106", // 0=Main, 102=Author, 106=Index (en); es usa mismos
      format: "json",
      origin: "*",
    });
    const url = `${baseUrl}/w/api.php?${params.toString()}`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "ELMUBEBOOKS/1.0 (contacto: elmubebooks@gmail.com)",
      },
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const search = data?.query?.search || [];
    const start = (Math.max(1, page) - 1) * limit;
    const results: Book[] = search.slice(start, start + limit).map((item: any) => {
      const title = item.title.replace(/^Autor:/, "").replace(/^Index:/, "");
      const pageUrl = `${baseUrl}/wiki/${encodeURIComponent(item.title.replace(/ /g, "_"))}`;
      // Limpiar snippet de HTML
      const snippet = (item.snippet || "").replace(/<[^>]+>/g, "").slice(0, 300);
      return {
        id: `wikisource-${langCode}-${item.pageid}`,
        title,
        author: "Wikisource",
        year: null,
        language: langCode,
        subjects: ["Wikisource", "Texto libre"],
        cover: null,
        description: snippet || null,
        source: "wikisource",
        downloads: [
          { label: "Leer online", url: pageUrl },
          { label: "HTML", url: `${pageUrl}?action=raw` },
          { label: "EPUB", url: `${baseUrl}/w/index.php?title=Special:ElectronPdf&page=${encodeURIComponent(item.title)}&action=show-download-screen` },
        ],
        previewUrl: null,
      };
    });
    return results;
  } catch {
    return [];
  }
}

/* ================= Wattpad (autores contemporáneos gratuitos y legales) ================= */
// Wattpad permite a autores publicar gratis. Su API v3 es pública y devuelve JSON.
async function searchWattpad(query: string, page: number, limit: number, language?: string) {
  try {
    // Idioma: Wattpad usa códigos ISO 639-1 (es, en, fr, etc.)
    const lang = language && language !== "all" ? language : "es";
    const offset = (Math.max(1, page) - 1) * limit;
    const url = `https://www.wattpad.com/api/v3/stories?query=${encodeURIComponent(query)}&language=${lang}&limit=${limit}&offset=${offset}`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "ELMUBEBOOKS/1.0 (contacto: elmubebooks@gmail.com)",
      },
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const stories = data.stories || [];
    const results: Book[] = stories.map((s: any) => {
      const storyId = s.id;
      const cover = s.cover
        ? s.cover.replace("-256-", "-512-") // portada más grande
        : null;
      const author = s.user?.name || s.user?.fullname || "Autor Wattpad";
      const readUrl = `https://www.wattpad.com/story/${storyId}`;
      return {
        id: `wattpad-${storyId}`,
        title: s.title || "Sin título",
        author,
        year: s.createDate ? parseInt(s.createDate.slice(0, 4), 10) : null,
        language: lang,
        subjects: ["Wattpad", "Autores contemporáneos"],
        cover,
        description: s.description ? s.description.slice(0, 400) : null,
        source: "wattpad",
        downloads: [
          { label: "Leer online", url: readUrl },
        ],
        previewUrl: null,
      };
    });
    return results;
  } catch {
    return [];
  }
}

/* ================= LibriVox (audiolibros gratis en dominio público) ================= */
// LibriVox tiene +30,000 audiolibros narrados por voluntarios. API pública sin auth.
// Usamos https.get en vez de fetch porque undici (fetch de Next.js) tiene problemas TLS con LibriVox.
async function searchLibrivox(query: string, page: number, limit: number, language?: string): Promise<Book[]> {
  return new Promise((resolve) => {
    const offset = (Math.max(1, page) - 1) * limit;
    const fetchLimit = language && language !== "all" ? 50 : limit * 2;
    const params = new URLSearchParams({
      format: "json",
      limit: String(fetchLimit),
      offset: String(offset),
    });
    if (query) {
      params.set("title", query);
    }
    const url = `https://librivox.org/api/feed/audiobooks?${params.toString()}`;
    const parsedUrl = new URL(url);

    const req = https.get(
      url,
      {
        agent: httpsAgent,
        headers: {
          Accept: "application/json",
          "User-Agent": "ELMUBEBOOKS/1.0 (contacto: elmubebooks@gmail.com)",
        },
        family: 4,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            processLibrivoxResults(parsed, query, limit, language, resolve);
          } catch (e) {
            console.error("LibriVox parse error:", e);
            resolve([]);
          }
        });
      }
    );
    req.on("error", (e) => {
      console.error("LibriVox request error:", e.message);
      resolve([]);
    });
    req.setTimeout(15000, () => {
      req.destroy();
      resolve([]);
    });
  });
}

function processLibrivoxResults(
  data: any,
  query: string,
  limit: number,
  language: string | undefined,
  resolve: (books: Book[]) => void
) {
  let books: any[] = data.books || [];

  // Filtrar por título si hay query
  if (query && books.length > 0) {
    const qLower = query.toLowerCase();
    const filtered = books.filter((b: any) => {
      const title = (b.title || "").toLowerCase();
      return title.includes(qLower);
    });
    if (filtered.length > 0) {
      books = filtered;
    }
  }

  // Filtrar por idioma
  if (language && language !== "all") {
    const langMap: Record<string, string[]> = {
      es: ["spanish", "español", "espanol"],
      en: ["english", "inglés"],
      fr: ["french", "français"],
      de: ["german", "deutsch"],
      it: ["italian", "italiano"],
      pt: ["portuguese", "português"],
    };
    const targetLangs = langMap[language] || [language];
    books = books.filter((b: any) => {
      const bookLang = (b.language || "").toLowerCase();
      return targetLangs.some((l) => bookLang.includes(l));
    });
  }

  const results: Book[] = books.slice(0, limit).map((b: any) => {
    const authors = b.authors || [];
    const authorName =
      authors.length > 0
        ? `${authors[0].first_name || ""} ${authors[0].last_name || ""}`.trim() || "Autor desconocido"
        : "Autor desconocido";
    const cover = b.url_image && !b.url_image.includes("noimage") ? b.url_image : null;
    const librivoxUrl = b.url_librivox || "";
    const rssUrl = b.url_rss || "";
    const zipUrl = b.url_zip_file || "";
    const desc = b.description ? b.description.replace(/<[^>]+>/g, "").slice(0, 400) : null;
    const langRaw = (b.language || "").toLowerCase();
    let langCode = langRaw;
    if (langRaw.includes("spanish") || langRaw.includes("español")) langCode = "es";
    else if (langRaw.includes("english")) langCode = "en";
    else if (langRaw.includes("french") || langRaw.includes("français")) langCode = "fr";
    else if (langRaw.includes("german") || langRaw.includes("deutsch")) langCode = "de";
    else if (langRaw.includes("italian")) langCode = "it";
    else if (langRaw.includes("portuguese")) langCode = "pt";

    const downloads: { label: string; url: string }[] = [
      { label: "▶ Escuchar", url: librivoxUrl },
    ];
    if (zipUrl) {
      downloads.push({ label: "MP3 (zip)", url: zipUrl });
    }

    return {
      id: `librivox-${b.id}`,
      title: b.title || "Sin título",
      author: authorName,
      year: b.copyright_year ? parseInt(String(b.copyright_year), 10) || null : null,
      language: langCode,
      subjects: ["Audiolibro", "LibriVox"],
      cover,
      description: desc,
      source: "librivox",
      downloads,
      previewUrl: null,
      audioUrl: rssUrl || librivoxUrl,
      audioDuration: b.totaltime || null,
      isAudiobook: true,
    };
  });
  resolve(results);
}

export const dynamic = "force-dynamic";

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

  // Si el idioma es español, usar keywords en español para Gutenberg (mejor filtrado)
  const catEntry = category && CATEGORY_MAP[category];
  const topic = catEntry
    ? (language === "es" && catEntry.gutenbergEs ? catEntry.gutenbergEs : catEntry.gutenberg)
    : undefined;

  const tasks: Promise<Book[]>[] = [];
  if (source === "all" || source === "gutenberg")
    tasks.push(searchGutenberg(query, page, language || undefined, topic));
  if (source === "all" || source === "openlibrary")
    tasks.push(searchOpenLibrary(query, page, limit, language || undefined, topic));
  if (source === "all" || source === "standardebooks")
    tasks.push(searchStandardEbooks(query, page, limit, topic));
  if (source === "all" || source === "archive")
    tasks.push(searchArchive(query, page, limit, language || undefined));
  if (source === "all" || source === "wikisource")
    tasks.push(searchWikisource(query, page, limit, language || undefined));
  if (source === "all" || source === "wattpad")
    tasks.push(searchWattpad(query, page, limit, language || undefined));
  if (source === "all" || source === "librivox")
    tasks.push(searchLibrivox(query, page, limit, language || undefined));

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
