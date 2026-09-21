import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import { MAX_PHOTOS, MAX_PHOTO_BYTES } from "./src/lib/photo-constants";

// Une annonce peut inclure jusqu'à MAX_PHOTOS photos de MAX_PHOTO_BYTES chacune
// (voir src/lib/photo-constants.ts) ; la limite par défaut des Server Actions
// (1 Mo) est bien trop basse et faisait échouer la publication ("Failed to
// fetch"). Marge de +20 % pour l'overhead multipart et les autres champs.
const photosLimitMb = Math.ceil((MAX_PHOTOS * MAX_PHOTO_BYTES * 1.2) / (1024 * 1024));

// Photos d'annonces et logos servis depuis Cloudflare R2 (src/lib/r2.ts) —
// next/image doit connaître ce domaine pour l'optimiser. R2_PUBLIC_URL peut
// être absent en local tant que le bucket n'est pas configuré.
const r2Hostname = process.env.R2_PUBLIC_URL
  ? new URL(process.env.R2_PUBLIC_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  // Guides éditoriaux (content/guides/*.mdx, Sprint 4) — importés
  // dynamiquement depuis src/app/guides/[slug]/page.tsx, jamais routés
  // directement en tant que pages (content/ est hors de app/).
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  experimental: {
    serverActions: {
      bodySizeLimit: `${photosLimitMb}mb`,
    },
  },
  images: {
    remotePatterns: r2Hostname
      ? [{ protocol: "https", hostname: r2Hostname, pathname: "/**" }]
      : [],
  },
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
