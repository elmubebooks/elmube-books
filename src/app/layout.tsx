import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const interSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const loraSerif = Lora({
  variable: "--font-serif-google",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ELMUBE BOOKS · Buscar y descargar libros libres",
  description:
    "Buscador de libros libres y de dominio público. Descarga EPUB, PDF, TXT y HTML desde Project Gutenberg, Open Library y Standard Ebooks.",
  keywords: [
    "ELMUBE BOOKS",
    "libros gratis",
    "libros descarga",
    "epub",
    "pdf",
    "biblioteca digital",
    "Project Gutenberg",
    "Open Library",
    "dominio público",
  ],
  authors: [{ name: "ELMUBE BOOKS" }],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ELMUBE BOOKS",
  },
  openGraph: {
    title: "ELMUBE BOOKS",
    description: "Buscar y descargar libros libres de dominio público",
    type: "website",
  },
};

export const viewport = {
  themeColor: "#6b4423",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${interSans.variable} ${loraSerif.variable} antialiased bg-background text-foreground paper-texture`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
