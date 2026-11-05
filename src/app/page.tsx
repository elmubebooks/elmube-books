"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  User,
  Headphones,
  Play,
  Pause,
  Mic,
  MicOff,
  BookText,
  ChevronLeft,
  ChevronRight,
  X as XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
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
  source: "gutenberg" | "openlibrary" | "standardebooks" | "archive" | "wikisource" | "wattpad" | "librivox";
  downloads: { label: string; url: string }[];
  previewUrl?: string | null;
  audioUrl?: string | null;
  audioDuration?: string | null;
  isAudiobook?: boolean;
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
  wattpad: "Wattpad",
  librivox: "Audiolibro (LibriVox)",
};

const SOURCE_BADGE: Record<Book["source"], string> = {
  gutenberg: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200",
  openlibrary: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200",
  standardebooks: "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-900/30 dark:text-rose-200",
  archive: "bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-900/30 dark:text-sky-200",
  wikisource: "bg-violet-100 text-violet-900 border-violet-300 dark:bg-violet-900/30 dark:text-violet-200",
  wattpad: "bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-900/30 dark:text-orange-200",
  librivox: "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300 dark:bg-fuchsia-900/30 dark:text-fuchsia-200",
};

const SOURCE_SHORT: Record<Book["source"], string> = {
  gutenberg: "PG",
  openlibrary: "OL",
  standardebooks: "SE",
  archive: "IA",
  wikisource: "WS",
  wattpad: "WP",
  librivox: "🎧",
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
  // Literatura
  { value: "ficcion", label: "Ficción", icon: "📖" },
  { value: "novela", label: "Novela", icon: "📚" },
  { value: "cuentos", label: "Cuentos", icon: "✍️" },
  { value: "poesia", label: "Poesía", icon: "✒️" },
  { value: "teatro", label: "Teatro", icon: "🎭" },
  { value: "ensayo", label: "Ensayo", icon: "📝" },
  // Géneros narrativos
  { value: "aventuras", label: "Aventuras", icon: "🗺️" },
  { value: "misterio", label: "Misterio", icon: "🔍" },
  { value: "romance", label: "Romance", icon: "❤️" },
  { value: "terror", label: "Terror", icon: "💀" },
  { value: "ciencia_ficcion", label: "Ciencia Ficción", icon: "🚀" },
  { value: "fantasia", label: "Fantasía", icon: "🐉" },
  { value: "humor", label: "Humor", icon: "😄" },
  // Conocimiento
  { value: "filosofia", label: "Filosofía", icon: "🧠" },
  { value: "historia", label: "Historia", icon: "🏛️" },
  { value: "ciencia", label: "Ciencia", icon: "🔬" },
  { value: "religion", label: "Religión", icon: "🕊️" },
  { value: "biografia", label: "Biografía", icon: "👤" },
  { value: "politica", label: "Política", icon: "⚖️" },
  { value: "economia", label: "Economía", icon: "💰" },
  // Especial
  { value: "infantiles", label: "Infantil", icon: "🧸" },
  { value: "juvenil", label: "Juvenil", icon: "🎯" },
  { value: "viajes", label: "Viajes", icon: "🧳" },
  { value: "cocina", label: "Cocina", icon: "🍳" },
  { value: "musica", label: "Música", icon: "🎵" },
  { value: "arte", label: "Arte", icon: "🎨" },
];

// Autores cuyas obras SÍ son dominio público, organizados por país
// Incluye escritores de la época colonial, independencia, romanticismo y modernistas
// NOTA: García Márquez (†2014), Vargas Llosa (vivo), Borges (†1986) NO son dominio público aún
const LATIN_AUTHORS = [
  // México 🇲🇽
  { name: "Sor Juana Inés de la Cruz", country: "🇲🇽", years: "1648-1695", query: "Sor Juana Ines de la Cruz" },
  { name: "Amado Nervo", country: "🇲🇽", years: "1870-1919", query: "Amado Nervo" },
  { name: "Manuel Gutiérrez Nájera", country: "🇲🇽", years: "1859-1895", query: "Manuel Gutierrez Najera" },
  { name: "Ignacio Manuel Altamirano", country: "🇲🇽", years: "1834-1893", query: "Ignacio Manuel Altamirano" },
  { name: "Manuel Acuña", country: "🇲🇽", years: "1849-1873", query: "Manuel Acuna" },
  { name: "Salvador Díaz Mirón", country: "🇲🇽", years: "1853-1928", query: "Salvador Diaz Miron" },
  { name: "José Joaquín Fernández de Lizardi", country: "🇲🇽", years: "1776-1827", query: "Fernandez Lizardi Periquillo" },
  { name: "Justo Sierra", country: "🇲🇽", years: "1848-1912", query: "Justo Sierra" },
  { name: "Luis G. Urbina", country: "🇲🇽", years: "1864-1934", query: "Luis Urbina" },
  { name: "Balún Canán / Rosario Castellanos", country: "🇲🇽", years: "1925-1974", query: "Rosario Castellanos" },
  // Argentina 🇦🇷
  { name: "José Hernández", country: "🇦🇷", years: "1834-1886", query: "Jose Hernandez Martin Fierro" },
  { name: "Esteban Echeverría", country: "🇦🇷", years: "1805-1851", query: "Esteban Echeverria" },
  { name: "Domingo Faustino Sarmiento", country: "🇦🇷", years: "1811-1888", query: "Sarmiento Facundo" },
  { name: "Juan Bautista Alberdi", country: "🇦🇷", years: "1810-1884", query: "Juan Bautista Alberdi" },
  { name: "Mitre / Bartolomé Mitre", country: "🇦🇷", years: "1821-1906", query: "Bartolome Mitre" },
  { name: "Eugenio Cambaceres", country: "🇦🇷", years: "1843-1888", query: "Eugenio Cambaceres" },
  { name: "Rafael Obligado", country: "🇦🇷", years: "1851-1920", query: "Rafael Obligado" },
  // Uruguay 🇺🇾
  { name: "Juan Zorrilla de San Martín", country: "🇺🇾", years: "1855-1931", query: "Juan Zorrilla San Martin" },
  { name: "Horacio Quiroga", country: "🇺🇾", years: "1878-1937", query: "Horacio Quiroga" },
  { name: "José Enrique Rodó", country: "🇺🇾", years: "1871-1917", query: "Jose Enrique Rodo Ariel" },
  { name: "Juan Carlos Onetti", country: "🇺🇾", years: "1909-1994", query: "Juan Carlos Onetti" },
  // Nicaragua 🇳🇮
  { name: "Rubén Darío", country: "🇳🇮", years: "1867-1916", query: "Ruben Dario" },
  // Colombia 🇨🇴
  { name: "José Asunción Silva", country: "🇨🇴", years: "1865-1896", query: "Jose Asuncion Silva" },
  { name: "Jorge Isaacs", country: "🇨🇴", years: "1837-1895", query: "Jorge Isaacs Maria" },
  { name: "Tomás Carrasquilla", country: "🇨🇴", years: "1858-1940", query: "Tomas Carrasquilla" },
  { name: "Rufino José Cuervo", country: "🇨🇴", years: "1844-1911", query: "Rufino Jose Cuervo" },
  // Cuba 🇨🇺
  { name: "José Martí", country: "🇨🇺", years: "1853-1895", query: "Jose Marti" },
  { name: "Gertrudis Gómez de Avellaneda", country: "🇨🇺", years: "1814-1873", query: "Gertrudis Gomez Avellaneda" },
  { name: "Julián del Casal", country: "🇨🇺", years: "1863-1893", query: "Julian del Casal" },
  { name: "Cirilo Villaverde", country: "🇨🇺", years: "1812-1894", query: "Cirilo Villaverde Cecilia Valdes" },
  // Perú 🇵🇪
  { name: "Ricardo Palma", country: "🇵🇪", years: "1833-1919", query: "Ricardo Palma Tradiciones" },
  { name: "Manuel González Prada", country: "🇵🇪", years: "1844-1918", query: "Manuel Gonzalez Prada" },
  { name: "Clorinda Matto de Turner", country: "🇵🇪", years: "1852-1909", query: "Clorinda Matto Turner" },
  { name: "Abraham Valdelomar", country: "🇵🇪", years: "1888-1919", query: "Abraham Valdelomar" },
  // Venezuela 🇻🇪
  { name: "Andrés Bello", country: "🇻🇪", years: "1781-1865", query: "Andres Bello" },
  { name: "Simón Rodríguez", country: "🇻🇪", years: "1769-1854", query: "Simon Rodriguez" },
  { name: "Fermín Toro", country: "🇻🇪", years: "1806-1865", query: "Fermin Toro" },
  // Chile 🇨🇱
  { name: "Gabriela Mistral", country: "🇨🇱", years: "1889-1957", query: "Gabriela Mistral" },
  { name: "Alberto Blest Gana", country: "🇨🇱", years: "1830-1920", query: "Alberto Blest Gana" },
  { name: "Baldomero Lillo", country: "🇨🇱", years: "1867-1923", query: "Baldomero Lillo" },
  { name: "Pedro Prado", country: "🇨🇱", years: "1886-1952", query: "Pedro Prado" },
  // Guatemala 🇬🇹
  { name: "Miguel Ángel Asturias", country: "🇬🇹", years: "1899-1974", query: "Miguel Angel Asturias" },
  { name: "José Milla y Vidaurre", country: "🇬🇹", years: "1822-1882", query: "Jose Milla Vidaurre" },
  // Bolivia 🇧🇴
  { name: "Jaime Saenz", country: "🇧🇴", years: "1921-1986", query: "Jaime Saenz" },
  { name: "Ricardo Jaimes Freyre", country: "🇧🇴", years: "1868-1933", query: "Ricardo Jaimes Freyre" },
  // Ecuador 🇪🇨
  { name: "Juan Montalvo", country: "🇪🇨", years: "1832-1889", query: "Juan Montalvo" },
  { name: "Juan León Mera", country: "🇪🇨", years: "1832-1894", query: "Juan Leon Mera Cumanda" },
  // Paraguay 🇵🇾
  { name: "Augusto Roa Bastos", country: "🇵🇾", years: "1917-2005", query: "Roa Bastos" },
  // Puerto Rico 🇵🇷
  { name: "Eugenio María de Hostos", country: "🇵🇷", years: "1839-1903", query: "Eugenio Hostos" },
  // República Dominicana 🇩🇴
  { name: "Salomé Ureña", country: "🇩🇴", years: "1850-1897", query: "Salome Urena" },
  // Brasil 🇧🇷
  { name: "Machado de Assis", country: "🇧🇷", years: "1839-1908", query: "Machado Assis" },
  { name: "José de Alencar", country: "🇧🇷", years: "1829-1877", query: "Jose Alencar" },
  { name: "Castro Alves", country: "🇧🇷", years: "1847-1871", query: "Castro Alves" },
  // España 🇪🇸
  { name: "Cervantes", country: "🇪🇸", years: "1547-1616", query: "Cervantes Saavedra" },
  { name: "Lope de Vega", country: "🇪🇸", years: "1562-1635", query: "Lope de Vega" },
  { name: "Tirso de Molina", country: "🇪🇸", years: "1579-1648", query: "Tirso de Molina" },
  { name: "Calderón de la Barca", country: "🇪🇸", years: "1600-1681", query: "Calderon Barca" },
  { name: "Quevedo", country: "🇪🇸", years: "1580-1645", query: "Francisco Quevedo" },
  { name: "Góngora", country: "🇪🇸", years: "1561-1627", query: "Luis Gongora" },
  { name: "Bécquer", country: "🇪🇸", years: "1836-1870", query: "Gustavo Adolfo Becquer" },
  { name: "Fernán Caballero", country: "🇪🇸", years: "1796-1877", query: "Fernan Caballero" },
  { name: "Pedro Antonio de Alarcón", country: "🇪🇸", years: "1833-1891", query: "Pedro Antonio Alarcon" },
  { name: "Juan Valera", country: "🇪🇸", years: "1824-1905", query: "Juan Valera" },
  { name: "José de Espronceda", country: "🇪🇸", years: "1808-1842", query: "Espronceda" },
  { name: "Mariano José de Larra", country: "🇪🇸", years: "1809-1837", query: "Mariano Larra" },
  { name: "Benito Pérez Galdós", country: "🇪🇸", years: "1843-1920", query: "Benito Perez Galdos" },
  { name: "Leopoldo Alas Clarín", country: "🇪🇸", years: "1852-1901", query: "Leopoldo Alas Clarin" },
  { name: "Emilia Pardo Bazán", country: "🇪🇸", years: "1851-1921", query: "Emilia Pardo Bazan" },
  { name: "Vicente Blasco Ibáñez", country: "🇪🇸", years: "1867-1928", query: "Vicente Blasco Ibanez" },
  { name: "Miguel de Unamuno", country: "🇪🇸", years: "1864-1936", query: "Miguel Unamuno" },
  { name: "Pío Baroja", country: "🇪🇸", years: "1872-1956", query: "Pio Baroja" },
  { name: "Azorín", country: "🇪🇸", years: "1873-1967", query: "Azorin Jose Martinez Ruiz" },
  { name: "Antonio Machado", country: "🇪🇸", years: "1875-1939", query: "Antonio Machado" },
  { name: "Juan Ramón Jiménez", country: "🇪🇸", years: "1881-1958", query: "Juan Ramon Jimenez Platero" },
  { name: "Ramón del Valle-Inclán", country: "🇪🇸", years: "1866-1936", query: "Valle Inclan" },
];

// Agrupar por país para el dropdown
const AUTHORS_BY_COUNTRY: Record<string, { name: string; years: string; query: string }[]> = (() => {
  const grouped: Record<string, { name: string; years: string; query: string }[]> = {};
  for (const a of LATIN_AUTHORS) {
    if (!grouped[a.country]) grouped[a.country] = [];
    grouped[a.country].push({ name: a.name, years: a.years, query: a.query });
  }
  return grouped;
})();

const COUNTRY_NAMES: Record<string, string> = {
  "🇲🇽": "México",
  "🇦🇷": "Argentina",
  "🇺🇾": "Uruguay",
  "🇳🇮": "Nicaragua",
  "🇨🇴": "Colombia",
  "🇨🇺": "Cuba",
  "🇵🇪": "Perú",
  "🇻🇪": "Venezuela",
  "🇨🇱": "Chile",
  "🇬🇹": "Guatemala",
  "🇧🇴": "Bolivia",
  "🇪🇨": "Ecuador",
  "🇵🇾": "Paraguay",
  "🇵🇷": "Puerto Rico",
  "🇩🇴": "Rep. Dominicana",
  "🇧🇷": "Brasil",
  "🇪🇸": "España",
};

// Gradientes de color por país para las tarjetas de autores
const COUNTRY_GRADIENTS: Record<string, string> = {
  "🇲🇽": "from-green-600 via-white to-red-600",       // México: verde-blanco-rojo
  "🇦🇷": "from-sky-400 via-white to-sky-600",          // Argentina: celeste-blanco
  "🇺🇾": "from-blue-500 via-white to-blue-700",        // Uruguay
  "🇳🇮": "from-blue-400 via-white to-blue-600",        // Nicaragua
  "🇨🇴": "from-yellow-400 via-blue-600 to-red-600",    // Colombia
  "🇨🇺": "from-blue-500 via-white to-red-500",         // Cuba
  "🇵🇪": "from-red-500 via-white to-red-700",          // Perú
  "🇻🇪": "from-yellow-400 via-blue-700 to-red-600",    // Venezuela
  "🇨🇱": "from-blue-700 via-white to-red-600",         // Chile
  "🇬🇹": "from-sky-400 via-white to-sky-600",          // Guatemala
  "🇧🇴": "from-red-500 via-yellow-400 to-green-600",   // Bolivia
  "🇪🇨": "from-yellow-400 via-blue-600 to-red-500",    // Ecuador
  "🇵🇾": "from-red-500 via-white to-blue-600",         // Paraguay
  "🇵🇷": "from-red-500 via-white to-blue-600",         // Puerto Rico
  "🇩🇴": "from-blue-500 via-white to-red-500",         // Rep. Dominicana
  "🇧🇷": "from-green-500 via-yellow-400 to-blue-500",  // Brasil
  "🇪🇸": "from-red-600 via-yellow-500 to-red-700",     // España: rojo-amarillo
};

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
  const [homeCarousels, setHomeCarousels] = useState<Record<string, Book[]>>({});
  const [homeCarouselsLoading, setHomeCarouselsLoading] = useState(true);
  const [booksDropdownOpen, setBooksDropdownOpen] = useState(false);
  const [authorsDropdownOpen, setAuthorsDropdownOpen] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [epubReaderBook, setEpubReaderBook] = useState<Book | null>(null);
  const [linkChecks, setLinkChecks] = useState<Record<string, "ok" | "error" | "timeout" | "checking">>({});
  const [linkCheckDone, setLinkCheckDone] = useState(false);

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

  /* ----- Verificar enlaces de descarga al abrir un libro ----- */
  useEffect(() => {
    if (!selected || selected.downloads.length === 0) {
      setLinkChecks({});
      setLinkCheckDone(false);
      return;
    }

    // Filtrar solo enlaces HTTP (no mailto, no javascript)
    const linksToCheck = selected.downloads
      .filter((d) => d.url.startsWith("http"))
      .map((d) => ({ url: d.url, label: d.label }));

    if (linksToCheck.length === 0) {
      setLinkCheckDone(true);
      return;
    }

    // Marcar todos como "checking"
    const initialChecks: Record<string, "checking"> = {};
    linksToCheck.forEach((l) => (initialChecks[l.url] = "checking"));
    setLinkChecks(initialChecks);
    setLinkCheckDone(false);

    // Llamar a la API para verificar
    fetch("/api/check-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ links: linksToCheck }),
    })
      .then((res) => res.json())
      .then((data) => {
        const newChecks: Record<string, "ok" | "error" | "timeout"> = {};
        for (const r of data.results || []) {
          newChecks[r.url] = r.status;
        }
        setLinkChecks(newChecks);
        setLinkCheckDone(true);
      })
      .catch(() => {
        // Si falla la verificación, asumir que todos están OK (no bloquear al usuario)
        const fallback: Record<string, "ok"> = {};
        linksToCheck.forEach((l) => (fallback[l.url] = "ok"));
        setLinkChecks(fallback);
        setLinkCheckDone(true);
      });
  }, [selected]);

  /* ----- Búsqueda por voz ----- */
  const toggleVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "No soportado",
        description: "Tu navegador no soporta búsqueda por voz. Prueba Chrome.",
        variant: "destructive",
      });
      return;
    }

    if (isListening && recognition) {
      recognition.stop();
      setIsListening(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "es-ES";
    rec.continuous = false;
    rec.interimResults = false;

    rec.onstart = () => {
      setIsListening(true);
      toast({ title: "🎤 Escuchando…", description: "Di el título o autor del libro" });
    };

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.trim();
      setQuery(transcript);
      setActiveQuery(transcript);
      setCategory("");
      setView("results");
      search(transcript, source, language, "");
    };

    rec.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === "not-allowed") {
        toast({ title: "Permiso denegado", description: "Activa el micrófono en tu navegador", variant: "destructive" });
      } else if (event.error === "no-speech") {
        toast({ title: "No te escuché", description: "Intenta hablar más fuerte" });
      } else {
        toast({ title: "Error", description: "No se pudo reconocer la voz", variant: "destructive" });
      }
    };

    rec.onend = () => {
      setIsListening(false);
    };

    setRecognition(rec);
    rec.start();
  };

  /* ----- Cargar carruseles de la home (libros destacados por categoría) ----- */
  // Carga 6 libros de cada categoría en paralelo al iniciar la app.
  // Solo se hace una vez. Si una categoría falla, se omite (no rompe la home).
  useEffect(() => {
    let cancelled = false;
    const loadHomeCarousels = async () => {
      setHomeCarouselsLoading(true);
      // Seleccionamos categorías destacadas para no saturar
      const featuredCats = [
        "ficcion", "novela", "cuentos", "poesia", "aventuras",
        "misterio", "infantiles", "filosofia", "historia", "romance",
      ];
      const results: Record<string, Book[]> = {};

      // Para cada categoría: primero intentar con español, luego complementar con todos
      await Promise.all(
        featuredCats.map(async (cat) => {
          try {
            // 1. Buscar primero en español (prioridad para México/Latinoamérica)
            const resEs = await fetch(`/api/search?category=${cat}&language=es&limit=8&source=all`);
            let books: Book[] = [];
            if (resEs.ok) {
              const dataEs = await resEs.json();
              books = dataEs.books || [];
            }
            // 2. Si hay pocos en español, complementar con todos los idiomas
            if (books.length < 5) {
              const resAll = await fetch(`/api/search?category=${cat}&limit=8&source=all`);
              if (resAll.ok) {
                const dataAll = await resAll.json();
                const allBooks = dataAll.books || [];
                // Mezclar: primero los de español, luego el resto sin duplicados
                const seen = new Set(books.map((b) => b.id));
                for (const b of allBooks) {
                  if (!seen.has(b.id)) {
                    books.push(b);
                    seen.add(b.id);
                  }
                  if (books.length >= 8) break;
                }
              }
            }
            // Solo incluir si hay al menos 3 libros
            if (books.length >= 3) {
              results[cat] = books.slice(0, 8);
            }
          } catch {
            // Silenciar error: simplemente no se muestra ese carrusel
          }
        })
      );
      if (!cancelled) {
        setHomeCarousels(results);
        setHomeCarouselsLoading(false);
      }
    };
    loadHomeCarousels();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const onAuthorClick = (author: string) => {
    setQuery(author);
    setActiveQuery(author);
    setCategory("");
    setView("results");
    search(author, source, language, "");
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
            {/* Solo desktop: nombre + subtítulo. En móvil solo el icono para dar espacio al buscador */}
            <div className="hidden lg:block text-left">
              <h1 className="font-serif text-lg font-semibold leading-none">
                ELMUBE BOOKS
              </h1>
              <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                Libros libres de dominio público
              </p>
            </div>
          </button>

          {/* Botón "Libros" con dropdown de categorías (desktop) */}
          <div className="relative hidden md:block flex-shrink-0">
            <button
              onClick={() => setBooksDropdownOpen((v) => !v)}
              className="flex items-center gap-1.5 px-3 h-10 rounded-md border border-border bg-card hover:bg-secondary transition-colors text-sm font-medium"
              aria-label="Ver categorías de libros"
              aria-expanded={booksDropdownOpen}
            >
              <BookOpen className="w-4 h-4" />
              <span>Libros</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${booksDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {booksDropdownOpen && (
              <>
                {/* Overlay para cerrar al hacer clic fuera */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setBooksDropdownOpen(false)}
                />
                <div className="absolute top-full left-0 mt-1 w-80 max-h-[70vh] overflow-y-auto scroll-elegant bg-popover border border-border rounded-md shadow-xl z-50 p-2">
                  <p className="text-xs font-semibold text-muted-foreground px-2 py-1.5 uppercase tracking-wide">
                    Explorar por categoría
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => {
                          onCategoryClick(c.value);
                          setBooksDropdownOpen(false);
                        }}
                        className="flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-secondary transition-colors text-left"
                      >
                        <span className="text-base">{c.icon}</span>
                        <span className="truncate">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Botón "Autores" con dropdown (desktop) */}
          <div className="relative hidden md:block flex-shrink-0">
            <button
              onClick={() => {
                setAuthorsDropdownOpen((v) => !v);
                setBooksDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 px-3 h-10 rounded-md border border-border bg-card hover:bg-secondary transition-colors text-sm font-medium"
              aria-label="Ver autores destacados"
              aria-expanded={authorsDropdownOpen}
            >
              <User className="w-4 h-4" />
              <span>Autores</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${authorsDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {authorsDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setAuthorsDropdownOpen(false)}
                />
                <div className="absolute top-full left-0 mt-1 w-96 max-h-[70vh] overflow-y-auto scroll-elegant bg-popover border border-border rounded-md shadow-xl z-50 p-2">
                  <p className="text-xs font-semibold text-muted-foreground px-2 py-1.5 uppercase tracking-wide">
                    Autores en español (dominio público)
                  </p>
                  {Object.entries(AUTHORS_BY_COUNTRY).map(([country, authors]) => (
                    <div key={country} className="mb-2">
                      <p className="text-xs font-bold text-foreground/80 px-2 py-1 flex items-center gap-1.5">
                        <span className="text-sm">{country}</span>
                        <span>{COUNTRY_NAMES[country] || country}</span>
                        <span className="text-muted-foreground font-normal">({authors.length})</span>
                      </p>
                      <div className="space-y-0.5">
                        {authors.map((author) => (
                          <button
                            key={author.name + country}
                            onClick={() => {
                              onAuthorClick(author.query);
                              setAuthorsDropdownOpen(false);
                            }}
                            className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded text-sm hover:bg-secondary transition-colors text-left"
                          >
                            <span className="truncate font-medium">{author.name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono flex-shrink-0">{author.years}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex gap-1.5 sm:gap-2 sm:max-w-2xl mx-auto">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por título, autor o tema…"
                className="pl-9 pr-10 h-10 font-sans"
                aria-label="Buscar libros"
              />
              {/* Botón micrófono dentro del input */}
              <button
                type="button"
                onClick={toggleVoiceSearch}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  isListening
                    ? "bg-red-500 text-white animate-pulse"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
                aria-label={isListening ? "Detener escucha" : "Buscar por voz"}
                title={isListening ? "Detener escucha" : "Buscar por voz"}
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
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
            <Button type="submit" disabled={loading} className="h-10 px-3 sm:px-4 flex-shrink-0">
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

        {/* Fila 2 (móvil/tablet): Menú → Libros → Autores → Idioma - sticky, SIN overflow */}
        <div className="md:hidden sticky top-[56px] z-30 bg-background/95 backdrop-blur-md border-b border-border max-w-7xl mx-auto px-2 py-2 flex items-center gap-1">
          {/* Botón Menú (solo icono) */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex items-center justify-center w-8 h-8 rounded-md border border-border bg-card hover:bg-secondary transition-colors flex-shrink-0"
            aria-label="Abrir menú"
          >
            <Menu className="w-4 h-4" />
          </button>
          {/* Botón Libros (dropdown categorías en móvil) */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setBooksDropdownOpen((v) => !v)}
              className="flex items-center gap-1 px-2 h-8 rounded-md border border-border bg-card hover:bg-secondary transition-colors text-xs font-medium"
              aria-label="Ver categorías de libros"
              aria-expanded={booksDropdownOpen}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Libros</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${booksDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {booksDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setBooksDropdownOpen(false)}
                />
                <div className="absolute top-full left-0 mt-1 w-72 max-h-[60vh] overflow-y-auto scroll-elegant bg-popover border border-border rounded-md shadow-xl z-50 p-2">
                  <p className="text-xs font-semibold text-muted-foreground px-2 py-1.5 uppercase tracking-wide">
                    Explorar por categoría
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => {
                          onCategoryClick(c.value);
                          setBooksDropdownOpen(false);
                        }}
                        className="flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-secondary transition-colors text-left"
                      >
                        <span className="text-base">{c.icon}</span>
                        <span className="truncate">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          {/* Botón Autores (dropdown en móvil) */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => {
                setAuthorsDropdownOpen((v) => !v);
                setBooksDropdownOpen(false);
              }}
              className="flex items-center gap-1 px-2 h-8 rounded-md border border-border bg-card hover:bg-secondary transition-colors text-xs font-medium"
              aria-label="Ver autores destacados"
              aria-expanded={authorsDropdownOpen}
            >
              <User className="w-3.5 h-3.5" />
              <span>Autores</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${authorsDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {authorsDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setAuthorsDropdownOpen(false)}
                />
                <div className="absolute top-full left-0 mt-1 w-80 max-h-[70vh] overflow-y-auto scroll-elegant bg-popover border border-border rounded-md shadow-xl z-50 p-2">
                  <p className="text-xs font-semibold text-muted-foreground px-2 py-1.5 uppercase tracking-wide">
                    Autores en español (dominio público)
                  </p>
                  {Object.entries(AUTHORS_BY_COUNTRY).map(([country, authors]) => (
                    <div key={country} className="mb-2">
                      <p className="text-[11px] font-bold text-foreground/80 px-2 py-1 flex items-center gap-1.5">
                        <span className="text-sm">{country}</span>
                        <span>{COUNTRY_NAMES[country] || country}</span>
                        <span className="text-muted-foreground font-normal">({authors.length})</span>
                      </p>
                      <div className="space-y-0.5">
                        {authors.map((author) => (
                          <button
                            key={author.name + country}
                            onClick={() => {
                              onAuthorClick(author.query);
                              setAuthorsDropdownOpen(false);
                            }}
                            className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded text-xs hover:bg-secondary transition-colors text-left"
                          >
                            <span className="truncate font-medium">{author.name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono flex-shrink-0">{author.years}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          {/* Selector Idioma - con icono Globe + texto completo */}
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger className="h-8 w-[130px] text-xs flex-shrink-0 px-2">
              <Globe className="w-3 h-3 mr-1.5 flex-shrink-0" />
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

      {/* ===== Home con carruseles tipo Netflix ===== */}
      <AnimatePresence mode="wait">
      {view === "home" && (
        <motion.main
          key="home"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6"
        >
          {/* Hero compacto */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              {">"} 70.000 libros libres de descarga
            </div>
            <h2 className="font-serif text-xl sm:text-3xl font-bold leading-tight mb-2">
              Busca, descubre y descarga
              <br />
              <span className="text-primary">libros de dominio público</span>
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-xl mx-auto">
              Una sola búsqueda en 7 fuentes. Descarga en EPUB, PDF, TXT, HTML o Kindle — gratis y legal.
            </p>
          </div>

          {/* Sección: Autores latinoamericanos y españoles destacados (dominio público) */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-3 px-1">
              <h3 className="font-serif text-lg sm:text-xl font-semibold flex items-center gap-2">
                <span className="text-xl">✨</span>
                <span>Autores en español</span>
              </h3>
              <span className="text-xs text-muted-foreground">(dominio público)</span>
            </div>
            <div className="flex gap-2 overflow-x-auto scroll-elegant pb-2 -mx-4 px-4 sm:mx-0 sm:px-1">
              {LATIN_AUTHORS.map((author) => {
                // Asignar color de gradiente según país
                const gradient = COUNTRY_GRADIENTS[author.country] || "from-amber-500 to-orange-600";
                return (
                  <button
                    key={author.name + author.country}
                    onClick={() => onAuthorClick(author.query)}
                    className={`flex-shrink-0 min-w-[140px] max-w-[180px] p-3 rounded-lg border border-white/10 bg-gradient-to-br ${gradient} hover:scale-105 hover:shadow-lg transition-all text-left relative overflow-hidden group`}
                  >
                    {/* Decoración de fondo */}
                    <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500" />
                    <div className="absolute bottom-0 left-0 w-12 h-12 bg-black/10 rounded-full -ml-6 -mb-6" />

                    {/* Contenido */}
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl drop-shadow-sm">{author.country}</span>
                        <span className="text-[10px] text-white/80 font-mono bg-black/20 px-1.5 py-0.5 rounded">
                          {author.years}
                        </span>
                      </div>
                      <p className="font-serif text-sm font-semibold leading-tight line-clamp-2 text-white drop-shadow">
                        {author.name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Carruseles por categoría */}
          {homeCarouselsLoading ? (
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <Skeleton className="h-6 w-48 mb-3" />
                  <div className="flex gap-3 overflow-hidden">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <Skeleton key={j} className="w-28 h-44 flex-shrink-0 rounded-md" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : Object.keys(homeCarousels).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No se pudieron cargar los libros destacados. Intenta buscar o explorar categorías.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(homeCarousels).map(([catKey, books]) => {
                const cat = CATEGORIES.find((c) => c.value === catKey);
                if (!cat || books.length === 0) return null;
                return (
                  <CategoryCarousel
                    key={catKey}
                    icon={cat.icon}
                    label={cat.label}
                    books={books}
                    isFav={isFav}
                    onToggleFav={toggleFav}
                    onOpen={(b) => setSelected(b)}
                    onSeeMore={() => onCategoryClick(catKey)}
                  />
                );
              })}
            </div>
          )}
        </motion.main>
      )}
      </AnimatePresence>

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
      <AnimatePresence mode="wait">
      {(view === "results" || view === "favorites" || view === "history") && (
        <motion.main
          key={view}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6"
        >
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
              {/* Móvil: grid de 2 columnas (cards grandes) */}
              <div className="sm:hidden grid grid-cols-2 gap-3">
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
        </motion.main>
      )}
      </AnimatePresence>

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

                {/* Reproductor de audio para audiolibros */}
                {selected.isAudiobook && selected.audioUrl && (
                  <div className="p-4 rounded-lg bg-fuchsia-50 dark:bg-fuchsia-900/20 border border-fuchsia-200 dark:border-fuchsia-800">
                    <div className="flex items-center gap-2 mb-3">
                      <Headphones className="w-5 h-5 text-fuchsia-600 dark:text-fuchsia-400" />
                      <div>
                        <p className="text-sm font-semibold text-fuchsia-900 dark:text-fuchsia-100">
                          Audiolibro disponible
                        </p>
                        {selected.audioDuration && (
                          <p className="text-xs text-fuchsia-700 dark:text-fuchsia-300">
                            Duración: {selected.audioDuration}
                          </p>
                        )}
                      </div>
                    </div>
                    <audio
                      ref={setAudioRef}
                      src={selected.audioUrl}
                      controls
                      className="w-full"
                      onPlay={() => setAudioPlaying(true)}
                      onPause={() => setAudioPlaying(false)}
                      onEnded={() => setAudioPlaying(false)}
                    >
                      Tu navegador no soporta audio.
                    </audio>
                    <p className="text-xs text-fuchsia-700 dark:text-fuchsia-300 mt-2">
                      💡 Pulsa play para escuchar ahora, o usa los botones de descarga abajo.
                    </p>
                  </div>
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

                {/* Botón Leer EPUB (solo si hay EPUB y el enlace funciona) */}
                {(() => {
                  const epubLink = selected.downloads.find((d) => d.label === "EPUB");
                  const epubOk = epubLink && linkChecks[epubLink.url] === "ok";
                  const epubChecking = epubLink && linkChecks[epubLink.url] === "checking";
                  // Si ya se verificó y NO funciona, no mostrar el botón
                  if (epubLink && linkCheckDone && !epubOk) return null;
                  // Si está verificando o funciona, mostrar el botón
                  if (!epubLink) return null;
                  return (
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {
                        setEpubReaderBook(selected);
                        setSelected(null);
                      }}
                    >
                      <BookText className="w-4 h-4 mr-1.5" /> Leer EPUB en la app
                    </Button>
                  );
                })()}

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
                          const linkStatus = linkChecks[d.url]; // "ok" | "error" | "timeout" | "checking" | undefined
                          const isBroken = linkStatus === "error" || linkStatus === "timeout";
                          const isChecking = linkStatus === "checking";
                          return (
                            <Button
                              key={i}
                              asChild
                              size="sm"
                              variant={isEpub ? "default" : isPdf ? "outline" : i === 0 ? "default" : "outline"}
                              className={isBroken ? "opacity-50 line-through" : ""}
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
                                {/* Estado del enlace */}
                                {isChecking && <Loader2 className="w-3 h-3 ml-1 animate-spin opacity-60" />}
                                {linkStatus === "ok" && <span className="ml-1 text-green-600">✅</span>}
                                {isBroken && <span className="ml-1 text-red-500">❌</span>}
                                {isExternal && !isChecking && !isBroken && linkStatus !== "ok" && (
                                  <ExternalLink className="w-3 h-3 ml-1 opacity-60" />
                                )}
                              </a>
                            </Button>
                          );
                        })}
                      </div>
                      {/* Mensaje si hay enlaces rotos */}
                      {linkCheckDone && Object.values(linkChecks).some((s) => s === "error" || s === "timeout") && (
                        <div className="mt-2 p-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                          <span className="text-red-500">⚠️</span>
                          <span>
                            Algunos enlaces no están disponibles (marcados con ❌).
                            Prueba con otro formato o fuente.
                          </span>
                        </div>
                      )}
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

      {/* ===== Menú hamburguesa móvil (overlay fuera del header) ===== */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
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

      {/* ===== Lector EPUB integrado ===== */}
      {epubReaderBook && (
        <EpubReader
          book={epubReaderBook}
          onClose={() => setEpubReaderBook(null)}
          onFavToggle={() => toggleFav(epubReaderBook)}
          isFav={isFav(epubReaderBook.id)}
        />
      )}

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

/* ====== Carrusel de categoría (tipo Netflix) ====== */
function CategoryCarousel({
  icon,
  label,
  books,
  isFav,
  onToggleFav,
  onOpen,
  onSeeMore,
}: {
  icon: string;
  label: string;
  books: Book[];
  isFav: (id: string) => boolean;
  onToggleFav: (book: Book) => void;
  onOpen: (book: Book) => void;
  onSeeMore: () => void;
}) {
  return (
    <section>
      {/* Header del carrusel */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="font-serif text-lg sm:text-xl font-semibold flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span>{label}</span>
        </h3>
        <button
          onClick={onSeeMore}
          className="text-xs text-primary hover:underline flex items-center gap-1 flex-shrink-0"
        >
          Ver más
          <ChevronDown className="w-3 h-3 -rotate-90" />
        </button>
      </div>

      {/* Carrusel horizontal scrollable */}
      <div className="flex gap-3 overflow-x-auto scroll-elegant pb-2 -mx-4 px-4 sm:mx-0 sm:px-1 snap-x snap-mandatory">
        {books.map((b) => (
          <div
            key={b.id}
            className="flex-shrink-0 w-28 sm:w-32 snap-start"
          >
            <BookCard
              book={b}
              fav={isFav(b.id)}
              onToggleFav={() => onToggleFav(b)}
              onOpen={() => onOpen(b)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ====== Lector EPUB integrado con epub.js ====== */
function EpubReader({
  book,
  onClose,
  onFavToggle,
  isFav,
}: {
  book: Book;
  onClose: () => void;
  onFavToggle: () => void;
  isFav: boolean;
}) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fontSize, setFontSize] = useState(100);
  const [theme, setTheme] = useState<"light" | "sepia" | "dark">("light");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: any = null;

    const loadEpub = async () => {
      try {
        // Encontrar la URL del EPUB
        const epubDownload = book.downloads.find((d) => d.label === "EPUB");
        if (!epubDownload) {
          setError("No hay archivo EPUB disponible para este libro.");
          setLoading(false);
          return;
        }

        // Timeout de 10 segundos: si no carga, mostrar error
        timeoutId = setTimeout(() => {
          if (!cancelled) {
            setError(
              "No se pudo cargar el EPUB en el lector. El servidor no permite lectura directa (CORS). " +
              "Puedes descargar el archivo EPUB y abrirlo con una app externa como Google Play Books o Apple Books."
            );
            setLoading(false);
            if (renditionRef.current) {
              try { renditionRef.current.destroy(); } catch {}
            }
          }
        }, 10000);

        // Cargar epub.js dinámicamente
        const ePub = (await import("epubjs")).default;
        if (!viewerRef.current || cancelled) return;

        // Intentar cargar directamente primero
        // Si falla por CORS, el timeout mostrará el error
        const bookInstance = ePub(epubDownload.url);

        // Manejar errores del libro
        bookInstance.on("openFailed", (err: any) => {
          if (!cancelled) {
            clearTimeout(timeoutId);
            setError(
              "No se pudo abrir el EPUB. El archivo puede no estar disponible o el servidor bloquea el acceso. " +
              "Te recomendamos descargar el archivo y abrirlo con una app de lectura externa."
            );
            setLoading(false);
          }
        });

        const rendition = bookInstance.renderTo(viewerRef.current, {
          width: "100%",
          height: "100%",
          spread: "none",
          flow: "paginated",
        });
        renditionRef.current = rendition;

        // Mostrar el libro
        await rendition.display();

        // Si llegó aquí, el libro cargó → cancelar timeout
        clearTimeout(timeoutId);

        // Tema inicial
        applyTheme(rendition, "light", fontSize);

        // Actualizar progreso al cambiar de página
        rendition.on("relocated", (location: any) => {
          if (location?.start?.percentage) {
            setProgress(Math.round(location.start.percentage * 100));
          }
        });

        if (!cancelled) setLoading(false);
      } catch (e: any) {
        console.error("EPUB load error:", e);
        if (!cancelled) {
          clearTimeout(timeoutId);
          setError(
            "No se pudo cargar el EPUB. El servidor no permite lectura directa desde el navegador. " +
            "Descarga el archivo EPUB y ábrelo con una app de lectura."
          );
          setLoading(false);
        }
      }
    };
    loadEpub();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (renditionRef.current) {
        try { renditionRef.current.destroy(); } catch {}
      }
    };
  }, [book]);

  const applyTheme = (rendition: any, themeName: string, size: number) => {
    const themes: Record<string, any> = {
      light: { body: { background: "#fff", color: "#1a1a1a" } },
      sepia: { body: { background: "#f4ecd8", color: "#5b4636" } },
      dark: { body: { background: "#1a1a1a", color: "#e0e0e0" } },
    };
    rendition.themes.register("custom", themes[themeName]);
    rendition.themes.select("custom");
    rendition.themes.fontSize(`${size}%`);
  };

  const changeTheme = (newTheme: "light" | "sepia" | "dark") => {
    setTheme(newTheme);
    if (renditionRef.current) {
      applyTheme(renditionRef.current, newTheme, fontSize);
    }
  };

  const changeFontSize = (delta: number) => {
    const newSize = Math.max(70, Math.min(200, fontSize + delta));
    setFontSize(newSize);
    if (renditionRef.current) {
      renditionRef.current.themes.fontSize(`${newSize}%`);
    }
  };

  const nextPage = () => renditionRef.current?.next();
  const prevPage = () => renditionRef.current?.prev();

  const bgClass = theme === "light" ? "bg-white" : theme === "sepia" ? "bg-[#f4ecd8]" : "bg-[#1a1a1a]";
  const textColor = theme === "dark" ? "text-white" : "text-gray-900";
  const mutedColor = theme === "dark" ? "text-gray-400" : "text-gray-600";
  const hoverBg = theme === "dark" ? "hover:bg-white/10" : "hover:bg-black/10";

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-background">
      {/* Barra superior */}
      <header className={`flex items-center justify-between gap-2 p-3 border-b ${bgClass} border-gray-300 ${textColor}`}>
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onClose}
            className={`flex items-center justify-center w-9 h-9 rounded-md ${hoverBg} ${textColor} flex-shrink-0 transition-colors`}
            aria-label="Cerrar lector"
          >
            <XIcon className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <p className={`font-serif text-sm font-semibold truncate ${textColor}`}>{book.title}</p>
            <p className={`text-xs ${mutedColor} truncate`}>{book.author}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Favorito */}
          <button
            onClick={onFavToggle}
            className={`flex items-center justify-center w-9 h-9 rounded-md ${hoverBg} transition-colors`}
            aria-label={isFav ? "Quitar de favoritos" : "Añadir a favoritos"}
          >
            <Heart className={`w-4 h-4 ${isFav ? "fill-red-500 text-red-500" : mutedColor}`} />
          </button>
          {/* Tamaño fuente */}
          <button
            onClick={() => changeFontSize(-10)}
            className={`flex items-center justify-center w-9 h-9 rounded-md ${hoverBg} ${textColor} text-sm font-bold transition-colors`}
            aria-label="Reducir texto"
            title="Texto más pequeño"
          >
            A-
          </button>
          <button
            onClick={() => changeFontSize(10)}
            className={`flex items-center justify-center w-9 h-9 rounded-md ${hoverBg} ${textColor} text-sm font-bold transition-colors`}
            aria-label="Aumentar texto"
            title="Texto más grande"
          >
            A+
          </button>
          {/* Tema */}
          <button
            onClick={() => changeTheme(theme === "light" ? "sepia" : theme === "sepia" ? "dark" : "light")}
            className={`flex items-center justify-center w-9 h-9 rounded-md ${hoverBg} ${textColor} transition-colors`}
            aria-label="Cambiar tema"
            title={`Tema: ${theme === "light" ? "Claro" : theme === "sepia" ? "Sepia" : "Oscuro"}`}
          >
            {theme === "light" ? "☀️" : theme === "sepia" ? "📜" : "🌙"}
          </button>
        </div>
      </header>

      {/* Contenido del EPUB */}
      <div className={`flex-1 relative ${bgClass}`}>
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando libro…</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <BookText className="w-10 h-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground max-w-xs">{error}</p>
            <Button variant="outline" size="sm" onClick={onClose}>
              Volver
            </Button>
          </div>
        )}
        <div
          ref={viewerRef}
          className="w-full h-full epub-viewer"
          style={{ display: loading || error ? "none" : "block" }}
        />
      </div>

      {/* Barra inferior: navegación + progreso */}
      <footer className={`flex items-center justify-between gap-2 p-3 border-t ${bgClass} border-gray-300 ${textColor}`}>
        <button
          onClick={prevPage}
          className={`flex items-center gap-1 px-3 h-9 rounded-md ${hoverBg} ${textColor} text-sm font-medium transition-colors`}
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        {/* Barra de progreso */}
        <div className="flex-1 flex items-center gap-2 max-w-xs">
          <div className={`flex-1 h-1.5 ${theme === "dark" ? "bg-white/20" : "bg-black/10"} rounded-full overflow-hidden`}>
            <div
              className={`h-full ${theme === "dark" ? "bg-amber-400" : "bg-amber-600"} transition-all`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className={`text-xs ${mutedColor} w-10 text-right`}>{progress}%</span>
        </div>

        <button
          onClick={nextPage}
          className={`flex items-center gap-1 px-3 h-9 rounded-md ${hoverBg} ${textColor} text-sm font-medium transition-colors`}
          aria-label="Página siguiente"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </footer>
    </div>
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
        className={`relative aspect-[2/3] w-full rounded-md overflow-hidden border hover:border-primary/50 transition-all shadow-sm hover:shadow-md text-left cursor-pointer ${
          book.isAudiobook && !book.cover
            ? "bg-gradient-to-br from-fuchsia-500 via-purple-600 to-indigo-700 border-fuchsia-300/50"
            : "bg-secondary border-border"
        }`}
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
                if (book.isAudiobook) {
                  fb.innerHTML = `<div class="w-14 h-14 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center mb-2 shadow-lg ring-2 ring-white/40"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H4a1 1 0 0 1-1-1z"/><path d="M21 14h-3a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h2a1 1 0 0 0 1-1z"/><path d="M3 14a9 9 0 0 1 18 0"/></svg></div><div class="text-[9px] font-bold text-white/90 uppercase tracking-wider mb-1">Audiolibro</div><span class="text-[10px] text-white line-clamp-3 font-serif px-1">${book.title.replace(/</g, "&lt;").slice(0, 60)}</span>`;
                } else {
                  fb.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground mb-1"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg><span class="text-[10px] text-muted-foreground line-clamp-3 font-serif">${book.title.replace(/</g, "&lt;").slice(0, 60)}</span>`;
                }
                parent.appendChild(fb);
              }
            }}
          />
        ) : book.isAudiobook ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gradient-to-br from-fuchsia-500 via-purple-600 to-indigo-700 relative overflow-hidden">
            {/* Decoración de ondas de sonido en el fondo */}
            <div className="absolute inset-0 opacity-20">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                <path d="M0,50 Q25,30 50,50 T100,50" stroke="white" strokeWidth="1" fill="none"/>
                <path d="M0,50 Q25,70 50,50 T100,50" stroke="white" strokeWidth="1" fill="none"/>
                <path d="M0,40 Q25,20 50,40 T100,40" stroke="white" strokeWidth="0.5" fill="none"/>
                <path d="M0,60 Q25,80 50,60 T100,60" stroke="white" strokeWidth="0.5" fill="none"/>
              </svg>
            </div>
            {/* Contenido */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center mb-2 shadow-lg ring-2 ring-white/40">
                <Headphones className="w-7 h-7 text-white" />
              </div>
              <div className="text-[9px] font-bold text-white/90 uppercase tracking-wider mb-1">
                Audiolibro
              </div>
              <span className="text-[10px] text-white line-clamp-3 font-serif px-1">
                {book.title}
              </span>
            </div>
          </div>
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

        {/* Indicador de audiolibro */}
        {book.isAudiobook && (
          <div className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-fuchsia-500 text-white flex items-center justify-center">
            <Headphones className="w-3 h-3" />
          </div>
        )}

        {/* Indicador de descarga (solo si no es audiolibro) */}
        {!book.isAudiobook && book.downloads.length > 0 && (
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
        <h3 className="font-serif text-sm sm:text-base font-medium leading-snug line-clamp-2">
          {book.title}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-1">
          {book.author}
        </p>
      </div>
    </div>
  );
}
