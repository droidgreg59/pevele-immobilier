import { getVillageBySlug } from "@/data/villages";
import type { ListingFieldsInput } from "./listings";

function parsePositiveInt(value: FormDataEntryValue | null): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
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
  const modeChauffageRaw = String(formData.get("modeChauffage") ?? "").trim();
  // `null` explicite (pas `undefined`) : voir la même remarque pour typeMaison
  // ci-dessus — sinon une mise à jour laisserait une ancienne valeur en place.
  const modeChauffage = typeBien !== "TERRAIN" && modeChauffageRaw ? modeChauffageRaw : null;
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
      modeChauffage,
      videoUrl: videoUrl || undefined,
      visiteVirtuelleUrl: visiteVirtuelleUrl || undefined,
      visitesIndividuelles,
      visitesGroupees,
    },
  };
}
