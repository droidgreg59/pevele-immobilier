import { getVillageBySlug } from "@/data/villages";
import type { ListingFieldsInput } from "./listings";
import { ETATS, EXPOSITIONS, CHAUFFAGE_TYPES, ASSAINISSEMENTS } from "./listing-carac";

function parsePositiveInt(value: FormDataEntryValue | null): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Entier ≥ 0 (ex. étage : 0 = rez-de-chaussée). Chaîne vide → null. */
function parseNonNegInt(value: FormDataEntryValue | null): number | null {
  if (value === null || String(value).trim() === "") return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 200 ? n : null;
}

/** Année de construction plausible, sinon null. */
function parseYear(value: FormDataEntryValue | null): number | null {
  const n = Number(value);
  const max = new Date().getFullYear() + 3;
  return Number.isInteger(n) && n >= 1700 && n <= max ? n : null;
}

/** Renvoie la valeur si elle est dans `allowed`, sinon null. */
function oneOf<T extends string>(value: FormDataEntryValue | null, allowed: readonly T[]): T | null {
  const s = String(value ?? "").trim();
  return (allowed as readonly string[]).includes(s) ? (s as T) : null;
}

/** Sélecteur tri-état "true" / "false" / "" → boolean | null. */
function triBool(value: FormDataEntryValue | null): boolean | null {
  const s = String(value ?? "");
  return s === "true" ? true : s === "false" ? false : null;
}


function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function parseListingFields(
  formData: FormData
): { error: string } | { fields: ListingFieldsInput } {
  const transaction = formData.get("transaction") === "LOCATION" ? "LOCATION" : "VENTE";
  const typeBienRaw = String(formData.get("typeBien") ?? "");
  const typeBien =
    typeBienRaw === "APPARTEMENT" || typeBienRaw === "TERRAIN" ? typeBienRaw : "MAISON";
  const typeMaisonRaw = String(formData.get("typeMaison") ?? "");
  // `null` explicite (pas `undefined`) : sur une mise à jour, Prisma ignore
  // un champ `undefined` (« ne pas toucher ») alors qu'on veut bien effacer
  // typeMaison si le bien n'est plus une maison ou si « peu importe » a été choisi.
  const typeMaison: "INDIVIDUELLE" | "SEMI_INDIVIDUELLE" | "MITOYENNE" | null =
    typeBien === "MAISON" &&
    (typeMaisonRaw === "INDIVIDUELLE" ||
      typeMaisonRaw === "SEMI_INDIVIDUELLE" ||
      typeMaisonRaw === "MITOYENNE")
      ? typeMaisonRaw
      : null;
  const villageSlug = String(formData.get("villageSlug") ?? "");
  const titre = String(formData.get("titre") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const exterieur = String(formData.get("exterieur") ?? "").trim();
  const equipements = formData.getAll("equipements").map(String).join(",");
  const dpe = String(formData.get("dpe") ?? "").trim();
  const gesRaw = String(formData.get("ges") ?? "").trim().toUpperCase();
  const ges = /^[A-G]$/.test(gesRaw) ? gesRaw : "";
  const dpeConsommation = parsePositiveInt(formData.get("dpeConsommation"));
  const dpeEmissions = parsePositiveInt(formData.get("dpeEmissions"));
  const modeChauffageRaw = String(formData.get("modeChauffage") ?? "").trim();
  // `null` explicite (pas `undefined`) : voir la même remarque pour typeMaison
  // ci-dessus — sinon une mise à jour laisserait une ancienne valeur en place.
  const modeChauffage = typeBien !== "TERRAIN" && modeChauffageRaw ? modeChauffageRaw : null;
  // Frais & charges. `fraisData` (listings.ts) remet à null ce qui est hors
  // périmètre de la transaction ; on parse ici tout ce qui est fourni.
  const honoraires = parsePositiveInt(formData.get("honoraires"));
  const honorairesChargeRaw = String(formData.get("honorairesCharge") ?? "");
  const honorairesCharge =
    honorairesChargeRaw === "acquereur" || honorairesChargeRaw === "vendeur"
      ? honorairesChargeRaw
      : null;
  const chargesCopro = parsePositiveInt(formData.get("chargesCopro"));
  const taxeFonciere = parsePositiveInt(formData.get("taxeFonciere"));
  const chargesLoc = parsePositiveInt(formData.get("chargesLoc"));
  const depotGarantie = parsePositiveInt(formData.get("depotGarantie"));
  const meubleRaw = String(formData.get("meuble") ?? "");
  const meuble = meubleRaw === "true" ? true : meubleRaw === "false" ? false : null;

  // Caractéristiques détaillées — toutes facultatives, `caracData` (listings.ts)
  // met à null ce qui n'est pas fourni.
  const anneeConstruction = parseYear(formData.get("anneeConstruction"));
  const etat = oneOf(formData.get("etat"), ETATS);
  const exposition = oneOf(formData.get("exposition"), EXPOSITIONS);
  const surfaceTerrain = parsePositiveInt(formData.get("surfaceTerrain"));
  const etage = typeBien === "APPARTEMENT" ? parseNonNegInt(formData.get("etage")) : null;
  const ascenseur = typeBien === "APPARTEMENT" ? triBool(formData.get("ascenseur")) : null;
  const nbSallesDeBain = parsePositiveInt(formData.get("nbSallesDeBain"));
  const stationnement = String(formData.get("stationnement") ?? "").trim().slice(0, 120) || null;
  const chauffageType =
    typeBien === "TERRAIN" ? null : oneOf(formData.get("chauffageType"), CHAUFFAGE_TYPES);
  const fibre = triBool(formData.get("fibre"));
  const assainissement =
    typeBien === "APPARTEMENT" ? null : oneOf(formData.get("assainissement"), ASSAINISSEMENTS);

  const videoUrl = String(formData.get("videoUrl") ?? "").trim();
  const visiteVirtuelleUrl = String(formData.get("visiteVirtuelleUrl") ?? "").trim();
  const visitesIndividuelles = formData.get("visitesIndividuelles") === "true";
  const visitesGroupees = formData.get("visitesGroupees") === "true";

  const village = getVillageBySlug(villageSlug);
  if (!village) return { error: "Merci de choisir un village dans la liste." };
  if (!titre) return { error: "Merci d'indiquer un titre pour l'annonce." };
  if (!description) return { error: "Merci d'ajouter une courte description du bien." };
  if (videoUrl && !isValidHttpUrl(videoUrl)) {
    return { error: "Le lien vidéo doit être une URL valide (https://...)." };
  }
  if (visiteVirtuelleUrl && !isValidHttpUrl(visiteVirtuelleUrl)) {
    return { error: "Le lien de visite virtuelle doit être une URL valide (https://...)." };
  }
  if (!visitesIndividuelles && !visitesGroupees) {
    return {
      error:
        "Choisissez au moins un mode de visite : demandes individuelles ou visites groupées (portes ouvertes).",
    };
  }

  const prix = parsePositiveInt(formData.get("prix"));
  const pieces = parsePositiveInt(formData.get("pieces"));
  const chambres = parsePositiveInt(formData.get("chambres"));
  const surface = parsePositiveInt(formData.get("surface"));

  if (!prix) return { error: "Le prix doit être un nombre positif." };
  if (!pieces) return { error: "Le nombre de pièces doit être un nombre positif." };
  if (!chambres) return { error: "Le nombre de chambres doit être un nombre positif." };
  if (!surface) return { error: "La surface doit être un nombre positif (en m²)." };

  return {
    fields: {
      transaction,
      typeBien,
      typeMaison,
      titre,
      description,
      prix,
      villageSlug: village.slug,
      commune: village.nom,
      pieces,
      chambres,
      surface,
      exterieur: exterieur || "—",
      equipements,
      dpe: dpe || undefined,
      ges: ges || undefined,
      dpeConsommation,
      dpeEmissions,
      modeChauffage,
      honoraires,
      honorairesCharge,
      chargesCopro,
      taxeFonciere,
      chargesLoc,
      depotGarantie,
      meuble,
      anneeConstruction,
      etat,
      exposition,
      surfaceTerrain,
      etage,
      ascenseur,
      nbSallesDeBain,
      stationnement,
      chauffageType,
      fibre,
      assainissement,
      videoUrl: videoUrl || undefined,
      visiteVirtuelleUrl: visiteVirtuelleUrl || undefined,
      visitesIndividuelles,
      visitesGroupees,
    },
  };
}
