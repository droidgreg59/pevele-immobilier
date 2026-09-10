import { describe, it, expect } from "vitest";
import { feedNodeForListing } from "./listing-feed";
import type { ListingWithOwner } from "./listings";

function make(overrides: Partial<ListingWithOwner> = {}): ListingWithOwner {
  return {
    id: "abc123",
    ownerId: "o1",
    transaction: "VENTE",
    statut: "PUBLIEE",
    typeBien: "MAISON",
    typeMaison: "INDIVIDUELLE",
    titre: "Maison de charme",
    description: "Jolie maison < avec caractères & spéciaux >",
    prix: 320000,
    commune: "Cysoing",
    villageSlug: "cysoing",
    pieces: 5,
    chambres: 3,
    surface: 110,
    exterieur: "jardin",
    dpe: "D",
    ges: "D",
    dpeConsommation: null,
    dpeEmissions: null,
    dpeCoutMin: null,
    dpeCoutMax: null,
    dpeCoutAnneeRef: null,
    dpeDate: null,
    modeChauffage: null,
    honoraires: 12000,
    honorairesCharge: "acquereur",
    chargesCopro: 120,
    taxeFonciere: 1400,
    chargesLoc: null,
    depotGarantie: null,
    meuble: null,
    equipements: "",
    visitesIndividuelles: true,
    visitesGroupees: false,
    badge: null,
    videoUrl: null,
    visiteVirtuelleUrl: null,
    externalRef: null,
    importSource: null,
    createdAt: new Date("2026-02-01T10:00:00Z"),
    photos: [
      { id: "p1", listingId: "abc123", url: "/uploads/listings/abc123/1.jpg", order: 0 },
      { id: "p2", listingId: "abc123", url: "https://cdn.example/x.jpg", order: 1 },
    ],
    priceHistory: [{ prix: 320000 }],
    owner: {
      nom: "Jean Dupont",
      entreprise: "Agence Cysoing",
      type: "AGENCE",
      logoUrl: null,
      verifStatut: "VERIFIEE",
    },
    ...overrides,
  } as ListingWithOwner;
}

describe("feedNodeForListing", () => {
  it("mappe les champs de base et l'URL absolue de la fiche", () => {
    const n = feedNodeForListing(make());
    expect(n.ref).toBe("abc123");
    expect(n.url).toBe("https://pevele-immobilier.fr/acheter/abc123");
    expect(n.transaction).toBe("vente");
    expect(n.type).toBe("maison");
    expect(n.typeMaison).toBe("individuelle");
    expect(n.commune).toBe("Cysoing");
    expect(n.codeInsee).toBe("59168");
    expect(n.prix).toBe(320000);
    expect(n.surface).toBe(110);
  });

  it("joint les coordonnées de la commune", () => {
    const n = feedNodeForListing(make());
    expect(typeof n.latitude).toBe("number");
    expect(typeof n.longitude).toBe("number");
  });

  it("rend les photos en URL absolues (relatives préfixées, absolues intactes)", () => {
    const n = feedNodeForListing(make()) as { photos: { photo: string[] } };
    expect(n.photos.photo).toEqual([
      "https://pevele-immobilier.fr/uploads/listings/abc123/1.jpg",
      "https://cdn.example/x.jpg",
    ]);
  });

  it("porte les honoraires avec l'attribut charge, et le contact typé", () => {
    const n = feedNodeForListing(make()) as {
      honoraires: { "@_charge": string; "#text": number };
      contact: { "@_type": string; "#text": string };
    };
    expect(n.honoraires).toEqual({ "@_charge": "acquereur", "#text": 12000 });
    expect(n.contact).toEqual({ "@_type": "agence", "#text": "Agence Cysoing" });
  });

  it("route une location vers /louer et expose charges / dépôt / meublé", () => {
    const n = feedNodeForListing(
      make({
        transaction: "LOCATION",
        typeBien: "APPARTEMENT",
        typeMaison: null,
        honoraires: null,
        honorairesCharge: null,
        taxeFonciere: null,
        chargesCopro: null,
        chargesLoc: 80,
        depotGarantie: 900,
        meuble: true,
      })
    );
    expect(n.url).toBe("https://pevele-immobilier.fr/louer/abc123");
    expect(n.transaction).toBe("location");
    expect(n.type).toBe("appartement");
    expect(n.typeMaison).toBeUndefined();
    expect(n.charges).toBe(80);
    expect(n.depotGarantie).toBe(900);
    expect(n.meuble).toBe("oui");
    expect(n.honoraires).toBeUndefined();
  });

  it("omet les champs vides plutôt que d'émettre des balises nulles", () => {
    const n = feedNodeForListing(
      make({ dpe: null, ges: null, chargesCopro: null, taxeFonciere: null, honoraires: null })
    );
    expect(n).not.toHaveProperty("dpe");
    expect(n).not.toHaveProperty("chargesCopro");
    expect(n).not.toHaveProperty("honoraires");
  });
});
