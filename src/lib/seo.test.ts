import { describe, it, expect } from "vitest";
import { breadcrumbJsonLd, itemListJsonLd, listingJsonLd, SITE_URL } from "./seo";

describe("breadcrumbJsonLd", () => {
  it("numérote les éléments à partir de 1 et préfixe les URL absolues", () => {
    const ld = breadcrumbJsonLd([
      { name: "Accueil", url: "/" },
      { name: "Acheter", url: "/acheter" },
    ]);
    expect(ld["@type"]).toBe("BreadcrumbList");
    expect(ld.itemListElement).toHaveLength(2);
    expect(ld.itemListElement[0]).toMatchObject({ position: 1, name: "Accueil", item: `${SITE_URL}/` });
    expect(ld.itemListElement[1].position).toBe(2);
  });
});

describe("itemListJsonLd", () => {
  it("expose le nombre d'éléments et des URL absolues", () => {
    const ld = itemListJsonLd([
      { url: "/acheter/1", name: "Maison A" },
      { url: "/acheter/2", name: "Maison B" },
    ]);
    expect(ld["@type"]).toBe("ItemList");
    expect(ld.numberOfItems).toBe(2);
    expect(ld.itemListElement[0]).toMatchObject({ position: 1, url: `${SITE_URL}/acheter/1` });
  });
});

describe("listingJsonLd", () => {
  const listing = {
    id: "abc",
    titre: "Maison de charme",
    description: "Jolie maison",
    prix: 320_000,
    transaction: "VENTE" as const,
    commune: "Cysoing",
    villageSlug: "cysoing",
    surface: 110,
    pieces: 5,
    chambres: 3,
    createdAt: new Date("2026-02-01T10:00:00Z"),
    photos: [{ url: "/uploads/listings/abc/1.jpg" }, { url: "https://cdn.example/x.jpg" }],
    owner: { nom: "Agence Y", entreprise: "Agence Y SARL", type: "AGENCE" as const },
  };

  it("produit un RealEstateListing cohérent", () => {
    const ld = listingJsonLd(listing);
    expect(ld["@type"]).toBe("RealEstateListing");
    expect(ld.url).toBe(`${SITE_URL}/acheter/abc`);
    expect(ld.datePosted).toBe("2026-02-01T10:00:00.000Z");
    expect(ld.offers).toMatchObject({ price: 320_000, priceCurrency: "EUR" });
    expect(ld.numberOfRooms).toBe(5);
    expect(ld.numberOfBedrooms).toBe(3);
  });

  it("préfixe les photos relatives par le domaine, laisse les absolues", () => {
    const ld = listingJsonLd(listing);
    expect(ld.image).toEqual([`${SITE_URL}/uploads/listings/abc/1.jpg`, "https://cdn.example/x.jpg"]);
  });

  it("ajoute un broker RealEstateAgent pour une agence, pas pour un particulier", () => {
    const agence = listingJsonLd(listing) as Record<string, unknown>;
    expect(agence.broker).toMatchObject({ "@type": "RealEstateAgent", name: "Agence Y SARL" });

    const particulier = listingJsonLd({
      ...listing,
      owner: { nom: "Jean", entreprise: null, type: "PARTICULIER" },
    }) as Record<string, unknown>;
    expect(particulier.broker).toBeUndefined();
  });

  it("route une location vers /louer", () => {
    const ld = listingJsonLd({ ...listing, transaction: "LOCATION" });
    expect(ld.url).toBe(`${SITE_URL}/louer/abc`);
  });
});
