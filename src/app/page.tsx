"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  BookOpen,
  Download,
  Heart,
  X,
  Loader2,
  Library,
  Sparkles,
  Sun,
  Moon,
  Bookmark,
  FileText,
  BookMarked,
  ExternalLink,
  Filter,
  History,
  Eye,
  Tag,
  Globe,
  Grid3x3,
  ThumbsUp,
  Gift,
  Copy,
  Check,
  QrCode,
  DownloadCloud,
  Send,
  MessageSquare,
  ChevronDown,
  ArrowLeft,
  Home as HomeIcon,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

interface Book {
  id: string;
  title: string;
  author: string;
  year?: number | null;
  language?: string;
  subjects?: string[];
  cover?: string | null;
  description?: string | null;
  source: "gutenberg" | "openlibrary" | "standardebooks" | "archive" | "wikisource";
  downloads: { label: string; url: string }[];
  previewUrl?: string | null;
}

interface DownloadEntry {
  book: Book;
  format: string;
  url: string;
  timestamp: number;
}

/* Botón de icono con etiqueta de texto debajo (visible en desktop, oculto en móvil) */
function IconButtonWithLabel({
  icon,
  label,
  onClick,
  active,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  badge?: string | number;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center gap-0.5 px-2 h-12 min-w-11 rounded-md transition-colors hover:bg-secondary ${
        active ? "bg-primary text-primary-foreground hover:bg-primary" : "text-foreground"
      }`}
      title={label}
      aria-label={label}
    >
      <span className="relative">
        {icon}
        {badge !== undefined && (
          <span className="absolute -top-1.5 -right-2 bg-accent text-accent-foreground text-[9px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
            {badge}
          </span>
        )}
      </span>
      <span className="text-[9px] leading-none font-medium hidden sm:block">{label}</span>
    </button>
  );
}

const SOURCE_LABEL: Record<Book["source"], string> = {
  gutenberg: "Project Gutenberg",
  openlibrary: "Open Library",
  standardebooks: "Standard Ebooks",
  archive: "Internet Archive",
  wikisource: "Wikisource",
};

const SOURCE_BADGE: Record<Book["source"], string> = {
  gutenberg: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200",
  openlibrary: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200",
  standardebooks: "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-900/30 dark:text-rose-200",
  archive: "bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-900/30 dark:text-sky-200",
  wikisource: "bg-violet-100 text-violet-900 border-violet-300 dark:bg-violet-900/30 dark:text-violet-200",
};

const SOURCE_SHORT: Record<Book["source"], string> = {
  gutenberg: "PG",
  openlibrary: "OL",
  standardebooks: "SE",
  archive: "IA",
  wikisource: "WS",
};

const LANG_LABEL: Record<string, string> = {
  en: "Inglés",
  es: "Español",
  fr: "Francés",
  de: "Alemán",
  it: "Italiano",
  pt: "Portugués",
  la: "Latín",
  el: "Griego",
  ru: "Ruso",
  zh: "Chino",
  ja: "Japonés",
  yid: "Yiddish",
  spa: "Español",
  eng: "Inglés",
  fre: "Francés",
  ger: "Alemán",
  ita: "Italiano",
  por: "Portugués",
};

const LANGUAGES = [
  { value: "all", label: "Idioma" },
  { value: "es", label: "Español" },
  { value: "en", label: "Inglés" },
  { value: "fr", label: "Francés" },
  { value: "de", label: "Alemán" },
  { value: "it", label: "Italiano" },
  { value: "pt", label: "Portugués" },
];

const CATEGORIES = [
  { value: "ficcion", label: "Ficción", icon: "📖" },
  { value: "poesia", label: "Poesía", icon: "✒️" },
  { value: "filosofia", label: "Filosofía", icon: "🧠" },
  { value: "teatro", label: "Teatro", icon: "🎭" },
  { value: "historia", label: "Historia", icon: "🏛️" },
  { value: "ciencia", label: "Ciencia", icon: "🔬" },
  { value: "aventuras", label: "Aventuras", icon: "🗺️" },
  { value: "misterio", label: "Misterio", icon: "🔍" },
  { value: "romance", label: "Romance", icon: "❤️" },
  { value: "infantiles", label: "Infantil", icon: "🧸" },
  { value: "religion", label: "Religión", icon: "🕊️" },
  { value: "biografia", label: "Biografía", icon: "👤" },
];

type View = "home" | "results" | "favorites" | "history" | "categories";

export default function Home() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<"all" | "gutenberg" | "openlibrary" | "standardebooks" | "archive" | "wikisource">("all");
  const [language, setLanguage] = useState<string>("all");
  const [category, setCategory] = useState<string>("");
  const [selected, setSelected] = useState<Book | null>(null);
  const [favorites, setFavorites] = useState<Book[]>([]);
  const [history, setHistory] = useState<DownloadEntry[]>([]);
  const [view, setView] = useState<View>("home");
  const [dark, setDark] = useState(false);
  const [previewBook, setPreviewBook] = useState<Book | null>(null);
  const [previewText, setPreviewText] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string>("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [showDonativo, setShowDonativo] = useState(false);
  const [copiedClabe, setCopiedClabe] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentSending, setCommentSending] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* ----- PWA: detectar posibilidad de instalación ----- */
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => {
      setIsInstalled(true);
      setInstallPromptEvent(null);
    };
    window.addEventListener("appinstalled", installedHandler);

    // Verificar si ya está instalada (standalone)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPromptEvent) return;
    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    if (outcome === "accepted") {
      toast({ title: "¡App instalada!", description: "Encuéntrala en tu pantalla de inicio" });
    }
    setInstallPromptEvent(null);
  };

  /* ----- Enviar comentario por correo ----- */
  const sendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) {
      toast({ title: "Escribe tu comentario", variant: "destructive" });
      return;
    }
    setCommentSending(true);
    const subject = `Comentario de ${commentName || "un lector"} - ELMUBE BOOKS`;
    const body = `Nombre: ${commentName || "Anónimo"}\n\nComentario:\n${commentText}\n\n---\nEnviado desde elmubebooks.netlify.app`;
    const mailto = `mailto:elmubebooks@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    setTimeout(() => {
      setCommentSending(false);
      setCommentName("");
      setCommentText("");
      toast({ title: "Abriendo tu correo…", description: "Completa el envío desde tu app de correo" });
    }, 500);
  };

  /* ----- Me gusta (likes) ----- */
  useEffect(() => {
    try {
      // ¿El usuario ya dio like?
      const userLiked = localStorage.getItem("elmube-liked") === "true";
      setLiked(userLiked);
      // Contador global persistente (suma de todos los likes en este navegador)
      const count = parseInt(localStorage.getItem("elmube-likes-count") || "0", 10);
      setLikeCount(count);
    } catch {}
  }, []);

  const toggleLike = () => {
    const next = !liked;
    setLiked(next);
    const newCount = Math.max(0, likeCount + (next ? 1 : -1));
    setLikeCount(newCount);
    try {
      localStorage.setItem("elmube-liked", String(next));
      localStorage.setItem("elmube-likes-count", String(newCount));
    } catch {}
    toast({
      title: next ? "¡Gracias por tu me gusta! ❤" : "Quitaste tu me gusta",
      description: next ? "Nos alegra que disfrutes ELMUBE BOOKS" : undefined,
    });
  };

  /* ----- Copiar CLABE ----- */
  const copyClabe = async () => {
    const clabe = "728969000071167065";
    try {
      await navigator.clipboard.writeText(clabe);
      setCopiedClabe(true);
      toast({ title: "CLABE copiada", description: clabe });
      setTimeout(() => setCopiedClabe(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = clabe;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopiedClabe(true);
        toast({ title: "CLABE copiada", description: clabe });
        setTimeout(() => setCopiedClabe(false), 2000);
      } catch {
        toast({ title: "No se pudo copiar", variant: "destructive" });
      }
      document.body.removeChild(ta);
    }
  };

  /* ----- Tema oscuro ----- */
  useEffect(() => {
    const saved = localStorage.getItem("elmube-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("elmube-theme", next ? "dark" : "light");
  };

  /* ----- Favoritos e Historial desde localStorage ----- */
  useEffect(() => {
    try {
      const rawFav = localStorage.getItem("elmube-favoritos");
      if (rawFav) setFavorites(JSON.parse(rawFav));
      const rawHist = localStorage.getItem("elmube-historial");
      if (rawHist) setHistory(JSON.parse(rawHist));
    } catch {}
  }, []);

  const saveFavs = (f: Book[]) => {
    setFavorites(f);
    localStorage.setItem("elmube-favoritos", JSON.stringify(f));
  };

  const saveHistory = (h: DownloadEntry[]) => {
    setHistory(h);
    localStorage.setItem("elmube-historial", JSON.stringify(h));
  };

  const isFav = useCallback(
    (id: string) => favorites.some((b) => b.id === id),
    [favorites]
  );

  const toggleFav = (book: Book) => {
    if (isFav(book.id)) {
      saveFavs(favorites.filter((b) => b.id !== book.id));
      toast({ title: "Quitado de favoritos", description: book.title });
    } else {
      saveFavs([book, ...favorites]);
      toast({ title: "Añadido a favoritos", description: book.title });
    }
  };

  const recordDownload = (book: Book, format: string, url: string) => {
    const entry: DownloadEntry = { book, format, url, timestamp: Date.now() };
    // Evitar duplicados exactos en los últimos 5
    const filtered = history.filter(
      (e) => !(e.book.id === book.id && e.format === format)
    );
    const next = [entry, ...filtered].slice(0, 50);
    saveHistory(next);
    toast({ title: "Descarga iniciada", description: `${book.title} · ${format}` });
  };

  const clearHistory = () => {
    saveHistory([]);
    toast({ title: "Historial borrado" });
  };

  /* ----- Búsqueda ----- */
  const search = useCallback(
    async (q: string, src: typeof source, lang: string, cat: string) => {
      if (!q && !cat) return;
      setLoading(true);
      setBooks([]);
      try {
        const params = new URLSearchParams();
        if (q) params.set("q", q.trim());
        if (lang && lang !== "all") params.set("language", lang);
        if (cat) params.set("category", cat);
        params.set("source", src);
        params.set("limit", "12");
        const res = await fetch(`/api/search?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`Servidor respondió ${res.status}`);
        }
        const data = await res.json();
        setBooks(data.books || []);
        if ((data.books || []).length === 0) {
          toast({
            title: "Sin resultados",
            description: cat
              ? `No se encontraron libros en "${CATEGORIES.find(c => c.value === cat)?.label || cat}"`
              : `No se encontraron libros para "${q.trim()}". Prueba con otra palabra.`,
          });
        }
      } catch (e: any) {
        toast({
          title: "Error de búsqueda",
          description: `No se pudo completar la búsqueda. ${e?.message || ""}. Verifica tu conexión e inténtalo de nuevo.`,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQuery(query);
    setCategory("");
    setView("results");
    search(query, source, language, "");
  };

  const onSourceChange = (val: string) => {
    const s = val as typeof source;
    setSource(s);
    if (activeQuery || category) search(activeQuery, s, language, category);
  };

  const onLanguageChange = (val: string) => {
    setLanguage(val);
    if (activeQuery || category) search(activeQuery, source, val, category);
  };

  const onCategoryClick = (cat: string) => {
    setCategory(cat);
    setActiveQuery("");
    setQuery("");
    setView("results");
    search("", source, language, cat);
  };

  /* ----- Vista previa ----- */
  const openPreview = async (book: Book) => {
    setPreviewBook(book);
    setPreviewText("");
    setPreviewError("");
    setPreviewLoading(true);
    try {
      if (!book.previewUrl) {
        setPreviewError("Este libro no tiene vista previa en texto disponible.");
        return;
      }
      const res = await fetch(`/api/preview?url=${encodeURIComponent(book.previewUrl)}`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPreviewText(data.excerpt || "");
    } catch (e: any) {
      setPreviewError(e?.message || "No se pudo cargar la vista previa");
    } finally {
      setPreviewLoading(false);
    }
  };

  /* ----- Título de la vista actual ----- */
  const getViewTitle = () => {
    if (view === "favorites") return "Mis favoritos";
    if (view === "history") return "Historial de descargas";
    if (view === "results") {
      if (category) {
        const cat = CATEGORIES.find((c) => c.value === category);
        return cat ? `${cat.icon} ${cat.label}` : "Resultados";
      }
      return `Resultados para “${activeQuery}”`;
    }
    return "";
  };

  const displayed =
    view === "favorites"
      ? favorites
      : view === "history"
      ? history.map((h) => h.book)
      : books;

  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/85 border-b border-border">
        {/* Fila 1: Logo + Buscador + Idioma (desktop) / Buscador (móvil) */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3 flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              setView("home");
              setActiveQuery("");
              setCategory("");
              setQuery("");
            }}
            className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="hidden lg:block text-left">
              <h1 className="font-serif text-lg font-semibold leading-none">
                ELMUBE BOOKS
              </h1>
              <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                Libros libres de dominio público
              </p>
            </div>
          </button>

          <form onSubmit={handleSubmit} className="flex-1 flex gap-2 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por título, autor o tema…"
                className="pl-9 pr-3 h-10 font-sans"
                aria-label="Buscar libros"
              />
            </div>
            {/* Selector de idioma - desktop */}
            <div className="hidden sm:flex items-center">
              <Select value={language} onValueChange={onLanguageChange}>
                <SelectTrigger className="w-[140px] h-10">
                  <Globe className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={loading} className="h-10 px-3 sm:px-4">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span className="hidden sm:inline ml-1">Buscar</span>
            </Button>
          </form>

          {/* Iconos - solo desktop, en móvil van en fila de abajo */}
          <div className="hidden md:flex items-center gap-1 flex-shrink-0">
            <IconButtonWithLabel
              icon={<Grid3x3 className="w-5 h-5" />}
              label="Categorías"
              active={view === "categories"}
              onClick={() => {
                setView(view === "categories" ? "home" : "categories");
                setActiveQuery("");
                setCategory("");
              }}
            />
            <IconButtonWithLabel
              icon={<History className="w-5 h-5" />}
              label="Historial"
              active={view === "history"}
              badge={history.length > 0 ? (history.length > 9 ? "9+" : history.length) : undefined}
              onClick={() => setView(view === "history" ? "home" : "history")}
            />
            <IconButtonWithLabel
              icon={<Bookmark className="w-5 h-5" />}
              label="Favoritos"
              active={view === "favorites"}
              badge={favorites.length > 0 ? (favorites.length > 9 ? "9+" : favorites.length) : undefined}
              onClick={() => setView(view === "favorites" ? "home" : "favorites")}
            />
            <IconButtonWithLabel
              icon={dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              label={dark ? "Claro" : "Oscuro"}
              onClick={toggleDark}
            />
            <IconButtonWithLabel
              icon={<ThumbsUp className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />}
              label="Me gusta"
              active={liked}
              badge={likeCount > 0 ? (likeCount > 99 ? "99+" : likeCount) : undefined}
              onClick={toggleLike}
            />
            {installPromptEvent && !isInstalled && (
              <button
                onClick={handleInstallClick}
                className="flex flex-col items-center justify-center gap-0.5 px-3 h-12 rounded-md bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
                title="Instalar app en tu dispositivo"
                aria-label="Instalar app"
              >
                <DownloadCloud className="w-5 h-5" />
                <span className="text-[9px] leading-none font-semibold hidden sm:block">Instalar</span>
              </button>
            )}
          </div>
        </div>

        {/* Fila 2 (móvil/tablet): Categorías scrollables + idioma + menú hamburguesa - sticky */}
        <div className="md:hidden sticky top-[56px] z-30 bg-background/95 backdrop-blur-md border-b border-border max-w-7xl mx-auto px-3 py-2 flex items-center gap-1.5 overflow-x-auto scroll-elegant">
          {/* Botón hamburguesa */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex items-center justify-center w-8 h-8 rounded-md border border-border bg-card hover:bg-secondary transition-colors flex-shrink-0"
            aria-label="Abrir menú"
          >
            <Menu className="w-4 h-4" />
          </button>
          {/* Selector idioma compacto */}
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger className="h-8 w-[90px] text-xs flex-shrink-0">
              <Globe className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Categorías scrollables siempre visibles */}
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => onCategoryClick(c.value)}
              className={`flex items-center gap-1 px-2.5 h-8 rounded-md text-xs flex-shrink-0 transition-colors ${
                category === c.value ? "bg-primary text-primary-foreground" : "hover:bg-secondary bg-card border border-border"
              }`}
            >
              <span>{c.icon}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        {/* Menú hamburguesa móvil (overlay) */}
        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="absolute top-0 right-0 bottom-0 w-72 max-w-[80vw] bg-background border-l border-border shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-serif text-lg font-semibold">Menú</h3>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-md hover:bg-secondary flex items-center justify-center"
                  aria-label="Cerrar menú"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto scroll-elegant p-3 space-y-1">
                {/* Inicio */}
                <button
                  onClick={() => {
                    setView("home");
                    setActiveQuery("");
                    setCategory("");
                    setQuery("");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 h-11 rounded-md text-sm transition-colors ${
                    view === "home" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                  }`}
                >
                  <HomeIcon className="w-4 h-4" />
                  <span>Inicio</span>
                </button>

                {/* Categorías */}
                <button
                  onClick={() => {
                    setView("categories");
                    setActiveQuery("");
                    setCategory("");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 h-11 rounded-md text-sm transition-colors ${
                    view === "categories" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                  }`}
                >
                  <Grid3x3 className="w-4 h-4" />
                  <span>Categorías</span>
                </button>

                {/* Historial */}
                <button
                  onClick={() => {
                    setView("history");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-3 h-11 rounded-md text-sm transition-colors ${
                    view === "history" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <History className="w-4 h-4" />
                    <span>Historial</span>
                  </div>
                  {history.length > 0 && (
                    <span className="bg-accent text-accent-foreground text-[10px] font-bold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
                      {history.length > 9 ? "9+" : history.length}
                    </span>
                  )}
                </button>

                {/* Favoritos */}
                <button
                  onClick={() => {
                    setView("favorites");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-3 h-11 rounded-md text-sm transition-colors ${
                    view === "favorites" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Bookmark className="w-4 h-4" />
                    <span>Favoritos</span>
                  </div>
                  {favorites.length > 0 && (
                    <span className="bg-accent text-accent-foreground text-[10px] font-bold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
                      {favorites.length > 9 ? "9+" : favorites.length}
                    </span>
                  )}
                </button>

                <div className="h-px bg-border my-2" />

                {/* Modo oscuro */}
                <button
                  onClick={toggleDark}
                  className="w-full flex items-center gap-3 px-3 h-11 rounded-md text-sm hover:bg-secondary transition-colors"
                >
                  {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  <span>{dark ? "Modo claro" : "Modo oscuro"}</span>
                </button>

                {/* Me gusta */}
                <button
                  onClick={toggleLike}
                  className={`w-full flex items-center justify-between gap-3 px-3 h-11 rounded-md text-sm transition-colors ${
                    liked ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ThumbsUp className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
                    <span>{liked ? "Te gusta esta app" : "Me gusta"}</span>
                  </div>
                  {likeCount > 0 && (
                    <span className="bg-accent text-accent-foreground text-[10px] font-bold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
                      {likeCount > 99 ? "99+" : likeCount}
                    </span>
                  )}
                </button>

                {/* Instalar */}
                {installPromptEvent && !isInstalled && (
                  <button
                    onClick={() => {
                      handleInstallClick();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 h-11 rounded-md text-sm bg-accent text-accent-foreground hover:bg-accent/90 transition-colors font-semibold"
                  >
                    <DownloadCloud className="w-4 h-4" />
                    <span>Instalar app</span>
                  </button>
                )}

                <div className="h-px bg-border my-2" />

                {/* Donativo */}
                <button
                  onClick={() => {
                    setShowDonativo(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 h-11 rounded-md text-sm hover:bg-secondary transition-colors"
                >
                  <Gift className="w-4 h-4 text-accent" />
                  <span>Donativo</span>
                </button>
              </div>

              <div className="p-4 border-t border-border text-center">
                <p className="font-serif text-sm font-semibold">ELMUBE BOOKS</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Libros libres de dominio público
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Indicador de idioma activo (solo en resultados, si hay filtro) */}
        {view === "results" && language !== "all" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                <Globe className="w-3 h-3 mr-1" />
                {LANGUAGES.find((l) => l.value === language)?.label}
              </Badge>
              <button
                onClick={() => onLanguageChange("all")}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Quitar filtro
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ===== Home ===== */}
      {view === "home" && (
        <section className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              {">"} 70.000 libros libres de descarga
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold leading-tight mb-4">
              Busca, descubre y descarga
              <br />
              <span className="text-primary">libros de dominio público</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg mb-8 max-w-xl mx-auto">
              Una sola búsqueda en Project Gutenberg, Open Library y Standard Ebooks.
              Descarga en EPUB, PDF, TXT, HTML o Kindle — totalmente gratis y legal.
            </p>

            {/* Categorías destacadas - carrusel horizontal en móvil, grid en desktop */}
            <div className="mb-12">
              <h3 className="font-serif text-xl font-semibold mb-4 flex items-center justify-center gap-2">
                <Tag className="w-5 h-5" /> Explora por categoría
              </h3>
              {/* Móvil: carrusel horizontal scrollable */}
              <div className="sm:hidden flex gap-2 overflow-x-auto scroll-elegant pb-2 -mx-4 px-4">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => onCategoryClick(c.value)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card hover:bg-secondary hover:border-primary/40 transition-colors text-left flex-shrink-0 whitespace-nowrap"
                  >
                    <span className="text-lg">{c.icon}</span>
                    <span className="text-sm font-medium">{c.label}</span>
                  </button>
                ))}
              </div>
              {/* Desktop: grid */}
              <div className="hidden sm:grid grid-cols-3 md:grid-cols-4 gap-2 max-w-3xl mx-auto">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => onCategoryClick(c.value)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-card hover:bg-secondary hover:border-primary/40 transition-colors text-left"
                  >
                    <span className="text-lg">{c.icon}</span>
                    <span className="text-sm font-medium">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <FeatureCard
                icon={<Library className="w-5 h-5" />}
                title="3 fuentes en 1"
                desc="Gutenberg, Open Library y Standard Ebooks unificados."
              />
              <FeatureCard
                icon={<Download className="w-5 h-5" />}
                title="Descarga directa"
                desc="EPUB, PDF, TXT, HTML, Kindle — sin registros ni anuncios."
              />
              <FeatureCard
                icon={<Eye className="w-5 h-5" />}
                title="Vista previa"
                desc="Lee un fragmento antes de descargar el libro completo."
              />
            </div>
          </div>
        </section>
      )}

      {/* ===== Vista de categorías (grid grande) ===== */}
      {view === "categories" && (
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => {
                setView("home");
                setActiveQuery("");
                setCategory("");
                setQuery("");
              }}
              className="flex items-center gap-1.5 px-3 h-9 rounded-md border border-border bg-card hover:bg-secondary transition-colors text-sm flex-shrink-0"
              aria-label="Volver al inicio"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Volver</span>
            </button>
            <h2 className="font-serif text-2xl font-bold">Explora por categoría</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-6">
            Descubre libros agrupados por género literario. {CATEGORIES.length} categorías disponibles.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => onCategoryClick(c.value)}
                className="group relative p-6 rounded-xl border border-border bg-card hover:bg-secondary hover:border-primary/50 transition-all text-left overflow-hidden"
              >
                <div className="text-4xl mb-3">{c.icon}</div>
                <h3 className="font-serif text-lg font-semibold mb-1">{c.label}</h3>
                <p className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver libros →
                </p>
              </button>
            ))}
          </div>
        </main>
      )}

      {/* ===== Resultados / Favoritos / Historial ===== */}
      {(view === "results" || view === "favorites" || view === "history") && (
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
          {/* Barra superior con botón volver + título + total */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => {
                  setView("home");
                  setActiveQuery("");
                  setCategory("");
                  setQuery("");
                  setBooks([]);
                }}
                className="flex items-center gap-1.5 px-3 h-9 rounded-md border border-border bg-card hover:bg-secondary transition-colors text-sm flex-shrink-0"
                aria-label="Volver al inicio"
                title="Volver al inicio"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Volver</span>
              </button>
              <h2 className="font-serif text-lg sm:text-xl font-semibold flex items-center gap-2 min-w-0 truncate">
                {view === "favorites" && <Bookmark className="w-5 h-5 flex-shrink-0" />}
                {view === "history" && <History className="w-5 h-5 flex-shrink-0" />}
                <span className="truncate">{getViewTitle()}</span>
              </h2>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Badge variant="secondary" className="text-xs">
                {displayed.length} {displayed.length === 1 ? "libro" : "libros"}
              </Badge>
              {view === "history" && history.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearHistory}>
                  <X className="w-3.5 h-3.5 mr-1.5" /> Borrar
                </Button>
              )}
            </div>
          </div>

          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[2/3] w-full rounded-md" />
              ))}
            </div>
          )}

          {!loading && displayed.length === 0 && (
            <Card className="p-10 text-center border-dashed">
              {view === "favorites" ? (
                <>
                  <Bookmark className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Aún no has guardado libros en favoritos. ¡Busca y marca los que te gusten!
                  </p>
                </>
              ) : view === "history" ? (
                <>
                  <History className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Aún no has descargado libros. Cuando lo hagas aparecerán aquí.
                  </p>
                </>
              ) : (
                <>
                  <BookMarked className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No se encontraron libros. Prueba con otra palabra clave o categoría.
                  </p>
                </>
              )}
            </Card>
          )}

          {!loading && view === "history" && displayed.length > 0 && (
            <div className="space-y-2 mb-4">
              {history.map((entry, i) => (
                <Card
                  key={`${entry.book.id}-${entry.timestamp}-${i}`}
                  className="p-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-10 h-14 flex-shrink-0 rounded overflow-hidden bg-secondary flex items-center justify-center">
                    {entry.book.cover ? (
                      <img
                        src={entry.book.cover}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                      />
                    ) : (
                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-sm font-medium line-clamp-1">{entry.book.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{entry.book.author}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">{entry.format}</Badge>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {new Date(entry.timestamp).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => recordDownload(entry.book, entry.format, entry.url)}
                    >
                      <Download className="w-3.5 h-3.5 mr-1" /> Repetir
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelected(entry.book)}
                  >
                    Ver
                  </Button>
                </Card>
              ))}
            </div>
          )}

          {!loading && view !== "history" && displayed.length > 0 && (
            <>
              {/* Móvil: carrusel horizontal scrollable */}
              <div className="sm:hidden flex gap-3 overflow-x-auto scroll-elegant pb-2 -mx-4 px-4 snap-x snap-mandatory">
                {displayed.map((b) => (
                  <div key={b.id} className="flex-shrink-0 w-32 snap-start">
                    <BookCard
                      book={b}
                      fav={isFav(b.id)}
                      onToggleFav={() => toggleFav(b)}
                      onOpen={() => setSelected(b)}
                    />
                  </div>
                ))}
              </div>
              {/* Desktop: grid */}
              <div className="hidden sm:grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {displayed.map((b) => (
                  <BookCard
                    key={b.id}
                    book={b}
                    fav={isFav(b.id)}
                    onToggleFav={() => toggleFav(b)}
                    onOpen={() => setSelected(b)}
                  />
                ))}
              </div>
            </>
          )}
        </main>
      )}

      {/* ===== Footer con sección de donativo ===== */}
      <footer className="mt-auto border-t border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Sección Donativo - grande y visible */}
          <div className="mb-6 p-6 rounded-xl bg-gradient-to-br from-secondary/80 to-secondary/40 border border-border text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gift className="w-6 h-6 text-accent" />
              <h3 className="font-serif text-xl font-bold">Apoya ELMUBE BOOKS</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4 max-w-xl mx-auto">
              Si esta app te ha sido útil, considera apoyarla con un donativo.
              Cada peso ayuda a mantener el servidor y seguir mejorando.
            </p>
            <Button
              onClick={() => setShowDonativo(true)}
              size="lg"
              className="font-semibold"
            >
              <Gift className="w-4 h-4 mr-2" />
              Hacer un donativo
            </Button>
          </div>

          {/* Sección Comentarios (colapsable) */}
          <div className="mb-6 rounded-xl border border-border bg-card overflow-hidden">
            <button
              onClick={() => setShowComments((v) => !v)}
              className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-secondary/40 transition-colors text-left"
              aria-expanded={showComments}
              aria-controls="comments-form"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <MessageSquare className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-base sm:text-lg font-bold leading-tight">
                    Comentarios y sugerencias
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {showComments
                      ? "Toca para cerrar"
                      : "¿Tienes una idea o comentario? Toca para escribirnos"}
                  </p>
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${
                  showComments ? "rotate-180" : ""
                }`}
              />
            </button>

            {showComments && (
              <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-border">
                <p className="text-sm text-muted-foreground mb-4 mt-3">
                  Tu mensaje se enviará a <strong>elmubebooks@gmail.com</strong>.
                </p>
                <form onSubmit={sendComment} className="space-y-3">
                  <div>
                    <Label htmlFor="comment-name" className="text-xs mb-1 block">
                      Tu nombre (opcional)
                    </Label>
                    <Input
                      id="comment-name"
                      value={commentName}
                      onChange={(e) => setCommentName(e.target.value)}
                      placeholder="Anónimo"
                      className="h-9"
                      maxLength={80}
                    />
                  </div>
                  <div>
                    <Label htmlFor="comment-text" className="text-xs mb-1 block">
                      Tu comentario <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="comment-text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Escribe aquí tu mensaje, sugerencia o idea para mejorar ELMUBE BOOKS…"
                      rows={4}
                      maxLength={1000}
                      required
                    />
                    <p className="text-[10px] text-muted-foreground mt-1 text-right">
                      {commentText.length}/1000
                    </p>
                  </div>
                  <Button type="submit" disabled={commentSending} className="w-full sm:w-auto">
                    {commentSending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    {commentSending ? "Abriendo correo…" : "Enviar comentario"}
                  </Button>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    💡 Se abrirá tu app de correo con el mensaje precargado. Solo presiona enviar.
                  </p>
                </form>
              </div>
            )}
          </div>

          {/* Texto legal */}
          <div className="text-center text-xs text-muted-foreground space-y-2">
            <p>
              Todos los libros indexados son de dominio público o con permiso de descarga
              gratuita, provenientes de Project Gutenberg, Open Library e Internet Archive,
              y Standard Ebooks.
            </p>
            <p>
              Hecho con cariño para los amantes de la lectura · {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>

      {/* ===== Modal de detalle ===== */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex gap-4 items-start">
                  <div className="w-24 h-36 flex-shrink-0 rounded-md overflow-hidden border border-border bg-secondary flex items-center justify-center">
                    {selected.cover ? (
                      <img
                        src={selected.cover}
                        alt={`Portada de ${selected.title}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <BookOpen className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Badge
                      variant="outline"
                      className={`mb-1 ${SOURCE_BADGE[selected.source]}`}
                    >
                      {SOURCE_LABEL[selected.source]}
                    </Badge>
                    <DialogTitle className="font-serif text-xl leading-tight pr-6">
                      {selected.title}
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-sm">
                      por {selected.author}
                      {selected.year ? ` · ${selected.year}` : ""}
                      {selected.language
                        ? ` · ${LANG_LABEL[selected.language] || selected.language}`
                        : ""}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {selected.subjects && selected.subjects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selected.subjects.slice(0, 6).map((s, i) => (
                      <Badge key={i} variant="secondary" className="text-xs font-normal">
                        {s.length > 40 ? s.slice(0, 40) + "…" : s}
                      </Badge>
                    ))}
                  </div>
                )}

                {selected.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selected.description}
                  </p>
                )}

                {/* Botón de vista previa */}
                {selected.previewUrl && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      openPreview(selected);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1.5" /> Ver vista previa del texto
                  </Button>
                )}

                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <Download className="w-4 h-4" /> Descargas disponibles
                  </h4>
                  {selected.downloads.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No hay descargas directas para este título. Prueba en otra fuente.
                    </p>
                  ) : (
                    <>
                      {/* Recomendación EPUB */}
                      {selected.downloads.some((d) => d.label === "EPUB") && (
                        <div className="mb-3 p-2.5 rounded-md bg-accent/10 border border-accent/30 text-xs text-accent-foreground flex items-start gap-2">
                          <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-accent" />
                          <span>
                            <strong>Recomendado:</strong> descarga en formato{" "}
                            <strong>EPUB</strong> — funciona en todos los lectores
                            (telefono, tablet, Kindle) y pesa menos. El PDF no está
                            disponible para todos los libros.
                          </span>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {selected.downloads.map((d, i) => {
                          const isExternal = d.url.startsWith("http");
                          const isEpub = d.label === "EPUB";
                          const isPdf = d.label === "PDF";
                          return (
                            <Button
                              key={i}
                              asChild
                              size="sm"
                              variant={isEpub ? "default" : isPdf ? "outline" : i === 0 ? "default" : "outline"}
                            >
                              <a
                                href={d.url}
                                target={isExternal ? "_blank" : undefined}
                                rel={isExternal ? "noopener noreferrer" : undefined}
                                onClick={() => recordDownload(selected, d.label, d.url)}
                              >
                                <FileText className="w-3.5 h-3.5 mr-1.5" />
                                {d.label}
                                {isEpub && (
                                  <Badge variant="secondary" className="ml-1.5 text-[9px] py-0 px-1 h-3.5">
                                    ✓
                                  </Badge>
                                )}
                                {isExternal && <ExternalLink className="w-3 h-3 ml-1 opacity-60" />}
                              </a>
                            </Button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    variant={isFav(selected.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleFav(selected)}
                  >
                    <Heart
                      className={`w-4 h-4 mr-1.5 ${isFav(selected.id) ? "fill-current" : ""}`}
                    />
                    {isFav(selected.id) ? "En favoritos" : "Añadir a favoritos"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== Sheet de vista previa ===== */}
      <Sheet
        open={!!previewBook}
        onOpenChange={(o) => {
          if (!o) {
            setPreviewBook(null);
            setPreviewText("");
            setPreviewError("");
          }
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-serif flex items-center gap-2 pr-6">
              <Eye className="w-4 h-4" /> Vista previa
            </SheetTitle>
            <SheetDescription className="line-clamp-1">
              {previewBook?.title} — {previewBook?.author}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            {previewLoading && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" /> Cargando texto…
                </p>
              </div>
            )}
            {!previewLoading && previewError && (
              <Card className="p-4 border-dashed">
                <p className="text-sm text-muted-foreground">{previewError}</p>
              </Card>
            )}
            {!previewLoading && !previewError && previewText && (
              <ScrollArea className="h-[calc(100vh-8rem)]">
                <p className="font-serif text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                  {previewText}
                </p>
                <div className="mt-6 pt-4 border-t border-border text-xs text-muted-foreground">
                  Fragmento de muestra. Descarga el libro completo para seguir leyendo.
                </div>
              </ScrollArea>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ===== Diálogo de Donativo ===== */}
      <Dialog open={showDonativo} onOpenChange={setShowDonativo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <Gift className="w-5 h-5 text-accent" /> Apoya ELMUBE BOOKS
            </DialogTitle>
            <DialogDescription>
              Si esta app te ha sido útil, considera apoyarla con un donativo.
              Cada peso ayuda a mantener el servidor y seguir mejorando.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* QR */}
            <div className="flex flex-col items-center gap-2">
              <div className="bg-white p-3 rounded-lg border border-border">
                <img
                  src="/donativo/qr-spei.png"
                  alt="Código QR para donativo SPEI a ELMUBE BOOKS"
                  className="w-48 h-48"
                  width={192}
                  height={192}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center flex items-center gap-1">
                <QrCode className="w-3 h-3" />
                Escanea con tu app bancaria para transferir
              </p>
            </div>

            {/* Datos bancarios */}
            <div className="bg-secondary/50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Beneficiario:</span>
                <span className="font-medium text-right">Miguel Balderas Medina</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Banco:</span>
                <span className="font-medium text-right">Spin by Oxxo</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-muted-foreground">CLABE:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium tracking-wider">7289 6900 0071 1670 65</span>
                  <button
                    onClick={copyClabe}
                    className="p-1 rounded hover:bg-background transition-colors"
                    title="Copiar CLABE"
                    aria-label="Copiar CLABE al portapapeles"
                  >
                    {copiedClabe ? (
                      <Check className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground italic">
              "Un libro, un café, una sonrisa — gracias por tu apoyo." 📚
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}

/* ====== Subcomponentes ====== */

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Card className="p-4 text-left">
      <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-2">
        {icon}
      </div>
      <h3 className="font-serif font-semibold text-sm mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </Card>
  );
}

function BookCard({
  book,
  fav,
  onToggleFav,
  onOpen,
}: {
  book: Book;
  fav: boolean;
  onToggleFav: () => void;
  onOpen: () => void;
}) {
  return (
    <div className="group flex flex-col">
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
        className="relative aspect-[2/3] w-full rounded-md overflow-hidden border border-border bg-secondary hover:border-primary/50 transition-all shadow-sm hover:shadow-md text-left cursor-pointer"
      >
        {book.cover ? (
          <img
            src={book.cover}
            alt={`Portada de ${book.title}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              const t = e.currentTarget as HTMLImageElement;
              t.style.display = "none";
              const parent = t.parentElement;
              if (parent && !parent.querySelector(".fallback-cover")) {
                const fb = document.createElement("div");
                fb.className =
                  "fallback-cover w-full h-full flex flex-col items-center justify-center p-2 text-center";
                fb.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground mb-1"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg><span class="text-[10px] text-muted-foreground line-clamp-3 font-serif">${book.title.replace(/</g, "&lt;").slice(0, 60)}</span>`;
                parent.appendChild(fb);
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
            <BookOpen className="w-6 h-6 text-muted-foreground mb-1" />
            <span className="text-[10px] text-muted-foreground line-clamp-3 font-serif">
              {book.title}
            </span>
          </div>
        )}

        {/* Badge fuente */}
        <div className="absolute top-1.5 left-1.5">
          <Badge
            variant="outline"
            className={`text-[9px] py-0 px-1.5 h-4 backdrop-blur-sm ${SOURCE_BADGE[book.source]}`}
          >
            {SOURCE_SHORT[book.source]}
          </Badge>
        </div>

        {/* Botón favorito */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFav();
          }}
          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
          aria-label={fav ? "Quitar de favoritos" : "Añadir a favoritos"}
        >
          <Heart
            className={`w-3.5 h-3.5 ${fav ? "fill-accent text-accent" : "text-muted-foreground"}`}
          />
        </button>

        {/* Indicador de descarga */}
        {book.downloads.length > 0 && (
          <div className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <Download className="w-3 h-3" />
          </div>
        )}

        {/* Indicador de vista previa */}
        {book.previewUrl && (
          <div className="absolute bottom-1.5 left-1.5 w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
            <Eye className="w-3 h-3" />
          </div>
        )}
      </div>

      <div className="mt-2 px-0.5">
        <h3 className="font-serif text-sm font-medium leading-snug line-clamp-2">
          {book.title}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
          {book.author}
        </p>
      </div>
    </div>
  );
}
