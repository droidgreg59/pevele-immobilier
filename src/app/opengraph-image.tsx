import { siteOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Pévèle Immobilier — Annonces et prix immobiliers dans toute la Pévèle";

export default function Image() {
  return siteOgImage();
}
