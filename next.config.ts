import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sin `output: "standalone"` porque Netlify usa su propio runtime
  // a través del plugin @netlify/plugin-nextjs.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    // Permitimos portadas de Open Library y Gutenberg sin optimización local
    // (Netlify no tiene sharp por defecto en algunos planes).
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "covers.openlibrary.org" },
      { protocol: "https", hostname: "www.gutenberg.org" },
    ],
  },
};

export default nextConfig;
