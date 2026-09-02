import type { NextConfig } from "next";
import { MAX_PHOTOS, MAX_PHOTO_BYTES } from "./src/lib/photo-constants";

// Une annonce peut inclure jusqu'à MAX_PHOTOS photos de MAX_PHOTO_BYTES chacune
// (voir src/lib/photo-constants.ts) ; la limite par défaut des Server Actions
// (1 Mo) est bien trop basse et faisait échouer la publication ("Failed to
// fetch"). Marge de +20 % pour l'overhead multipart et les autres champs.
const photosLimitMb = Math.ceil((MAX_PHOTOS * MAX_PHOTO_BYTES * 1.2) / (1024 * 1024));

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: `${photosLimitMb}mb`,
    },
  },
};

export default nextConfig;
