import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /connexion, /inscription et /vendre/deposer sont en `noindex` (voir
      // leurs metadata) mais volontairement PAS ici : un moteur ne peut lire
      // une directive noindex que s'il est autorisé à crawler la page — les
      // bloquer ici l'empêcherait de découvrir le noindex et pourrait laisser
      // l'URL indexée nue (juste l'URL, sans titre ni description) à partir
      // d'un lien externe. Seules les zones réellement privées (données de
      // compte, back-office) ou non-HTML (API) restent bloquées.
      disallow: ["/compte", "/compte/", "/admin", "/admin/", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
