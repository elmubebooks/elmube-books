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
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "ELMUBE BOOKS",
    description: "Buscar y descargar libros libres de dominio público",
    type: "website",
  },
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
