import { villages } from "@/data/villages";
import { EQUIPEMENTS } from "@/data/equipements";
import { normalizeName } from "./ac3-import";
import type { Parsed4mListing } from "./site-4m";
import type { TransactionType, TypeBien } from "@prisma/client";

/**
 * Reprise des annonces d'un mandataire BSK Immobilier depuis sa page
 * publique (bskimmobilier.com/<prenom-nom-id>), avec son autorisation (case
 * cochée à l'inscription). Pas de flux XML, pas de pare-feu : simple fetch.
 *
 * Fiches rendues côté serveur, sans données structurées : lecture du HTML
 * par ses classes (relevées en direct sur la fiche 350868 de Virginie
 * Chauchoy le 2026-11-17 — ne jamais en deviner d'autres). Les biens de
 * l'agent portent `?from=agent` sur sa page ; les « biens similaires »
 * d'autres conseillers, non.
 */

export const BSK_ORIGIN = "https://bskimmobilier.com";
export const BSK_IMPORT_SOURCE = "SITE_BSK";

export function isBskAgentPage(url: string | null | undefined): boolean {
  return /^https:\/\/(www\.)?bskimmobilier\.com\/[a-z0-9-]+-\d+\/?$/i.test(url ?? "");
}

/** Fiches de l'agent (liens `?from=agent`), sans le paramètre. */
export function bskListingUrls(html: string): string[] {
  const re = /href="(https:\/\/bskimmobilier\.com\/bien\/[a-z0-9-]+\/[a-z0-9-]+\/\d+)\?from=agent"/gi;
  return [...new Set([...html.matchAll(re)].map((m) => m[1]))];
}

/** Page « tous les biens » de l'agent, liée depuis sa page. */
export function bskBiensPageUrl(html: string): string | null {
  return /href="(https:\/\/bskimmobilier\.com\/[a-z0-9-]+-\d+\/biens)"/i.exec(html)?.[1] ?? null;
}

export function bskRefFromUrl(url: string): string | null {
  return /\/bien\/[^/]+\/[^/]+\/(\d+)/.exec(url)?.[1] ?? null;
}

const decode = (s: string) =>
  s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&euro;/g, "€")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;#0?39;|&#0?39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

const clean = (s: string) => decode(s).replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();

function byClass(html: string, cls: string): string | null {
  const m = new RegExp(`<(\\w+)[^>]*class="[^"]*\\b${cls}\\b[^"]*"[^>]*>([\\s\\S]*?)</\\1>`).exec(html);
  return m ? clean(m[2]) : null;
}

const int = (s: string | null | undefined) => {
  const n = Number((s ?? "").replace(/\s| | /g, "").match(/\d+/)?.[0]);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const TYPES: Record<string, TypeBien> = { maison: "MAISON", appartement: "APPARTEMENT", terrain: "TERRAIN" };
const EXPOSITIONS = new Set(["nord", "sud", "est", "ouest", "nord-est", "nord-ouest", "sud-est", "sud-ouest"]);

export function parseBskListing(
  html: string,
  url: string
): { listing: Parsed4mListing } | { externalRef: string; reason: string } | null {
  const externalRef = bskRefFromUrl(url);
  const h1 = /<div class="property-title">\s*<h1>([\s\S]*?)<\/h1>/.exec(html)?.[1];
  if (!externalRef || !h1) return null; // page illisible (refonte, erreur)
  const titreGenerique = clean(h1);

  // Bandeau sur la photo : « Exclusivité » relevé ; un bien vendu ou sous
  // compromis n'est jamais repris.
  const bandeau = byClass(html, "section-photo-banner") ?? "";
  if (/vendu|compromis|sous offre/i.test(bandeau)) return { externalRef, reason: `indisponible (${bandeau})` };

  const typeBien = TYPES[normalizeName(titreGenerique.split(" ")[0] ?? "")];
  if (!typeBien) return { externalRef, reason: `type non pris en charge (${titreGenerique})` };

  const prixTexte = byClass(html, "property-price") ?? "";
  // Seule la vente a été observée ; un loyer s'afficherait « / mois ».
  const transaction: TransactionType = /mois|loyer/i.test(prixTexte) ? "LOCATION" : "VENTE";
  const prix = int(prixTexte);
  if (!prix) return { externalRef, reason: "prix non communiqué" };

  const location = byClass(html, "property-location") ?? "";
  const city = location.replace(/^\d{5}\s*/, "");
  const village = villages.find((v) => normalizeName(v.nom) === normalizeName(city));
  if (!village) return { externalRef, reason: `hors Pévèle (${city || "ville inconnue"})` };

  const info = (cls: string) => int(byClass(html, `property-info-${cls}`));
  const surface = info("surface");
  if (!surface) return { externalRef, reason: "surface manquante" };
  const bati = typeBien !== "TERRAIN";

  // Caractéristiques : libellés comparés à notre liste d'équipements.
  const equipements = new Set<string>();
  let exposition: string | null = null;
  for (const m of html.matchAll(/<li class="property-caracteristic-list-item ([a-z-]+)">([\s\S]*?)<\/li>/g)) {
    const label = clean(m[2]);
    if (m[1] === "property-caracteristic-exposition") {
      const e = normalizeName(label.replace(/^exposition/i, "")).replace(/ /g, "-");
      if (EXPOSITIONS.has(e)) exposition = e;
      continue;
    }
    const eq = EQUIPEMENTS.find((x) => normalizeName(x) === normalizeName(label));
    if (eq && bati) equipements.add(eq);
  }

  // Description de l'agent, puis mentions légales (agent, honoraires, DPE).
  const descHtml = /<p class="property-description">([\s\S]*?)<\/p>/.exec(html)?.[1] ?? "";
  const full = clean(descHtml);
  const cut = full.search(/Cette annonce référence/);
  const description = (cut >= 0 ? full.slice(0, cut) : full).trim();
  const mentions = cut >= 0 ? full.slice(cut) : "";

  const honorairesCharge = /charge du vendeur/i.test(mentions)
    ? "vendeur"
    : /charge de l'acqu[ée]reur/i.test(mentions)
      ? "acquereur"
      : null;
  const prixHorsHonoraires = int(/hors honoraires\D{0,20}([\d\s  ]+)/i.exec(mentions)?.[1]);
  const honoraires =
    honorairesCharge === "acquereur" && prixHorsHonoraires && prixHorsHonoraires < prix
      ? prix - prixHorsHonoraires
      : null;

  const dpeM = /CLASSE ÉNERGIE\s*:\s*([A-G])\s*\((\d+)/i.exec(mentions);
  const gesM = /CLASSE CLIMAT\s*:\s*([A-G])\s*\((\d+)/i.exec(mentions);
  const coutM = /entre ([\d\s  ]+)\s*€ et ([\d\s  ]+)\s*€/i.exec(mentions);
  const anneeRef = /indexés sur l'année (\d{4})/i.exec(mentions)?.[1];
  const dateM = /diagnostic énergétique\s*:\s*(\d{2})\/(\d{2})\/(\d{4})/i.exec(mentions);

  // Photos du bien : dossier de la photo principale (og:image), ordre de la galerie.
  const folder = /property="og:image" content="https:\/\/[^"]*\/data\/ads\/([0-9a-f-]+)\//.exec(html)?.[1];
  const photoUrls = folder
    ? [
        ...new Set(
          [...html.matchAll(/data-src="(https:\/\/[^"]+\/data\/ads\/([0-9a-f-]+)\/[^"]+)"/g)]
            .filter((m) => m[2] === folder)
            .map((m) => m[1])
        ),
      ]
    : [];

  const titreAgent = /<div class="section section-description">\s*<h2 class="section-label">([\s\S]*?)<\/h2>/.exec(html)?.[1];

  return {
    listing: {
      externalRef,
      transaction,
      typeBien,
      titre: (titreAgent && clean(titreAgent)) || titreGenerique,
      description: description || titreGenerique,
      prix,
      villageSlug: village.slug,
      commune: village.nom,
      pieces: bati ? (info("room") ?? 0) : 0,
      chambres: bati ? (info("bedroom") ?? 0) : 0,
      surface,
      exterieur:
        ["Jardin", "Balcon", "Terrasse"]
          .filter((e) => equipements.has(e))
          .map((e) => e.toUpperCase())
          .join(", ") || "—",
      surfaceTerrain: null,
      equipements: [...equipements].join(","),
      dpe: bati ? dpeM?.[1] : undefined,
      ges: bati ? gesM?.[1] : undefined,
      dpeConsommation: bati && dpeM ? Number(dpeM[2]) : null,
      dpeEmissions: bati && gesM ? Number(gesM[2]) : null,
      dpeCoutMin: bati ? int(coutM?.[1]) : null,
      dpeCoutMax: bati ? int(coutM?.[2]) : null,
      dpeCoutAnneeRef: bati && anneeRef ? Number(anneeRef) : null,
      dpeDate: bati && dateM ? new Date(`${dateM[3]}-${dateM[2]}-${dateM[1]}T00:00:00Z`) : null,
      exposition: bati ? exposition : null,
      honoraires: transaction === "VENTE" ? honoraires : null,
      honorairesCharge: transaction === "VENTE" ? honorairesCharge : null,
      photoUrls,
    },
  };
}
