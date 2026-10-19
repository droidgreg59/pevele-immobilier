/**
 * Réseaux de mandataires immobiliers indépendants. Un mandataire est un agent
 * commercial (art. L134-1 du code de commerce) : il n'a pas de carte T, il
 * exerce sous celle de son réseau et est immatriculé au RSAC. Il ne représente
 * pas une agence : il s'affiche « RÉSEAU – Prénom Nom ».
 *
 * `logo` : chemin d'un fichier fourni par l'exploitant dans public/reseaux/
 * (logo officiel du réseau) — null tant qu'il n'a pas été fourni, l'initiale
 * s'affiche alors à la place. Ne jamais recréer un logo à la main.
 */
export type Reseau = { label: string; logo: string | null };

export const RESEAUX: Reseau[] = [
  { label: "SAFTI", logo: "/reseaux/safti.png" },
  { label: "IAD", logo: "/reseaux/iad.png" },
  { label: "MeilleursBiens", logo: "/reseaux/meilleursbiens.png" },
  { label: "Capifrance", logo: null },
  { label: "Optimhome", logo: null },
  { label: "Propriétés-privées", logo: null },
  { label: "BSK Immobilier", logo: null },
  { label: "Efficity", logo: "/reseaux/efficity.png" },
  { label: "Megagence", logo: null },
  { label: "Sextant France", logo: null },
  { label: "Expertimo", logo: null },
  { label: "3G Immo", logo: null },
];

/** Valeur du sélecteur pour un réseau absent de la liste (saisi librement). */
export const AUTRE_RESEAU = "__autre__";

const clean = (s: string) => s.replace(/\s+/g, " ").trim();

/** Réseau retenu à partir du choix du sélecteur et de la saisie libre « autre ». */
export function normalizeReseau(choice: string, autre: string): string | null {
  if (choice === AUTRE_RESEAU) {
    const v = clean(autre).slice(0, 60);
    return v || null;
  }
  return RESEAUX.find((r) => r.label === choice)?.label ?? null;
}

export function reseauLogo(reseau: string | null | undefined): string | null {
  if (!reseau) return null;
  return RESEAUX.find((r) => r.label === reseau)?.logo ?? null;
}

/** Nom public d'un mandataire : « SAFTI – Prénom Nom ». */
export function mandataireDisplayName(reseau: string, prenom: string | null, nom: string): string {
  return clean(`${reseau} – ${clean(prenom ?? "")} ${clean(nom)}`);
}

/** Le numéro RSAC d'un agent commercial est son SIREN (9 premiers chiffres du SIRET). */
export function rsacNumero(siret: string | null | undefined): string | null {
  const digits = (siret ?? "").replace(/\D/g, "");
  if (digits.length < 9) return null;
  const siren = digits.slice(0, 9);
  return `${siren.slice(0, 3)} ${siren.slice(3, 6)} ${siren.slice(6, 9)}`;
}

/**
 * Mention légale d'un mandataire sur ses annonces et sa fiche : statut
 * d'agent commercial (exigé par la DGCCRF dans toute publicité), réseau et,
 * quand ils sont connus, ville du greffe et numéro RSAC.
 */
export function mandataireMention(m: {
  reseau: string;
  prenom: string | null;
  nom: string;
  rsacVille: string | null;
  siret: string | null;
}): string {
  const who = clean(`${m.prenom ?? ""} ${m.nom}`);
  const numero = rsacNumero(m.siret);
  const rsac =
    m.rsacVille && numero ? `, immatriculé(e) au RSAC de ${clean(m.rsacVille)} sous le n° ${numero}` : "";
  return `${who}, agent commercial immobilier, mandataire indépendant du réseau ${m.reseau}${rsac}.`;
}
