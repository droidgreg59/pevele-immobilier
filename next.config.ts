import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import { MAX_PHOTO_BYTES } from "./src/lib/photo-constants";

// Les photos d'annonce partent UNE PAR UNE (stagePhotoAction, compressées dans
// le navigateur) : une Server Action reçoit au plus une photo de
// MAX_PHOTO_BYTES. La limite par défaut (1 Mo) restait trop basse ; au-delà de
// 4,5 Mo, c'est de toute façon Vercel qui refuse la requête (413). Marge de
// +20 % pour l'overhead multipart.
const photosLimitMb = Math.ceil((MAX_PHOTO_BYTES * 1.2) / (1024 * 1024));

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
