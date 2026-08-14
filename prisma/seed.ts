import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { villages } from "../src/data/villages";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "demo1234";

async function upsertUser(input: {
  email: string;
  nom: string;
  entreprise?: string;
  telephone?: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  siteWeb?: string;
  googleAvisUrl?: string;
  description?: string;
  categories?: string;
  communesDesservies?: string;
  type: "PARTICULIER" | "AGENCE" | "ARTISAN";
}) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const { email, ...rest } = input;
  return prisma.user.upsert({
    where: { email },
    update: { ...rest },
    create: { email, ...rest, passwordHash },
  });
}

function villageSlug(nom: string) {
  const v = villages.find((v) => v.nom === nom);
  if (!v) throw new Error(`Village inconnu dans le seed: ${nom}`);
  return v.slug;
}

async function main() {
  const pvl = await upsertUser({
    email: "pvl-immobilier@example.com",
    nom: "Agence PVL Immobilier",
    entreprise: "PVL Immobilier",
    telephone: "03 20 79 00 12",
    adresse: "8 Grand Place",
    codePostal: "59830",
    ville: "Cysoing",
    siteWeb: "https://pvl-immobilier.fr",
    googleAvisUrl: "https://g.page/r/exemple-pvl-immobilier/review",
    type: "AGENCE",
  });
  const partenaire = await upsertUser({
    email: "partenaire@example.com",
    nom: "Agence Partenaire Pévèle",
    entreprise: "Agence Partenaire Pévèle",
    telephone: "03 20 79 45 60",
    adresse: "22 rue de Lille",
    codePostal: "59252",
    ville: "Templeuve-en-Pévèle",
    siteWeb: "https://agence-partenaire-pevele.fr",
    googleAvisUrl: "https://g.page/r/exemple-partenaire-pevele/review",
    type: "AGENCE",
  });
  const particulier = await upsertUser({
    email: "demo@example.com",
    nom: "Compte démo particulier",
    type: "PARTICULIER",
  });
  await upsertUser({
    email: "artisan-couverture@example.com",
    nom: "Julien Deram",
    entreprise: "Deram Couverture",
    telephone: "03 20 79 12 34",
    adresse: "14 rue du Moulin",
    codePostal: "59830",
    ville: "Cysoing",
    siteWeb: "https://deram-couverture.fr",
    description:
      "Couvreur-zingueur en Pévèle depuis 15 ans : rénovation de toiture, zinguerie, isolation de combles. Devis gratuit sous 48h.",
    categories: "Toiture,Isolation",
    communesDesservies: [
      villageSlug("Cysoing"),
      villageSlug("Camphin-en-Pévèle"),
      villageSlug("Bachy"),
    ].join(","),
    type: "ARTISAN",
  });
  await upsertUser({
    email: "artisan-electricite@example.com",
    nom: "Sophie Cambier",
    entreprise: "SC Élec",
    telephone: "03 20 79 56 78",
    adresse: "3 place de l'Église",
    codePostal: "59310",
    ville: "Orchies",
    description:
      "Électricienne certifiée Qualifelec, mises aux normes, rénovation électrique et installation de bornes de recharge.",
    categories: "Électricité,Diagnostics",
    communesDesservies: [
      villageSlug("Orchies"),
      villageSlug("Nomain"),
      villageSlug("Templeuve-en-Pévèle"),
    ].join(","),
    type: "ARTISAN",
  });

  const listingsData = [
    {
      ownerId: pvl.id,
      transaction: "VENTE" as const,
      badge: "PLAN 2D + VISITE 360°",
      titre: "Maison de caractère",
      description:
        "Ancienne ferme briquette entièrement rénovée, à deux pas du centre de Camphin-en-Pévèle. Volumes traversants, poutres apparentes au séjour, cuisine ouverte récente et dépendance aménageable.",
      prix: 449000,
      commune: "Camphin-en-Pévèle",
      villageSlug: villageSlug("Camphin-en-Pévèle"),
      pieces: 5,
      chambres: 3,
      surface: 142,
      exterieur: "685 M² JARD.",
      dpe: "C",
      equipements: "Poêle à bois,Garage,Dépendance,Double vitrage",
      photos: ["/images/camphin-en-pevele.png"],
    },
    {
      ownerId: particulier.id,
      transaction: "VENTE" as const,
      badge: "VISITE SUR RDV",
      titre: "Longère à rafraîchir",
      description:
        "Longère typique de la Pévèle à rénover, sur un terrain arboré de 900 m². Belle opportunité pour un projet de rénovation : gros œuvre sain, toiture refaite il y a 8 ans, réseaux à revoir.",
      prix: 298000,
      prixInitial: 325000,
      commune: "Bachy",
      villageSlug: villageSlug("Bachy"),
      pieces: 4,
      chambres: 3,
      surface: 128,
      exterieur: "900 M² TER.",
      dpe: "E",
      equipements: "Terrain clos,Puits,Abri de jardin",
    },
    {
      ownerId: partenaire.id,
      transaction: "VENTE" as const,
      badge: "PLANS 2D·3D",
      titre: "Ferme rénovée au calme",
      description:
        "Grande ferme en U entièrement restaurée aux portes de Cysoing, sur un terrain clos de 1 250 m². Belle réception, suite parentale avec dressing, dépendances aménagées en atelier et bureau.",
      prix: 585000,
      commune: "Cysoing",
      villageSlug: villageSlug("Cysoing"),
      pieces: 6,
      chambres: 4,
      surface: 188,
      exterieur: "1 250 M² TER.",
      dpe: "B",
      equipements: "Pompe à chaleur,Dépendances,Piscine,Alarme",
    },
    {
      ownerId: particulier.id,
      transaction: "VENTE" as const,
      badge: "SANS COMMISSION",
      titre: "Maison de village + garage",
      description:
        "Maison de village avec cour privative et garage, à proximité immédiate des commerces de Nomain. Idéale premier achat : trois chambres à l'étage, séjour lumineux, aucun travaux à prévoir.",
      prix: 242000,
      commune: "Nomain",
      villageSlug: villageSlug("Nomain"),
      pieces: 4,
      chambres: 3,
      surface: 105,
      exterieur: "COUR 60 M²",
      dpe: "D",
      equipements: "Garage,Cour privative,Chaudière récente",
    },
    {
      ownerId: partenaire.id,
      transaction: "VENTE" as const,
      badge: "NOUVEAUTÉ",
      titre: "Plain-pied contemporain",
      description:
        "Construction récente de plain-pied à Templeuve-en-Pévèle, proche de la gare TER. Prestations soignées, cuisine équipée ouverte, garage attenant et jardin clos exposé sud.",
      prix: 365000,
      commune: "Templeuve-en-Pévèle",
      villageSlug: villageSlug("Templeuve-en-Pévèle"),
      pieces: 4,
      chambres: 3,
      surface: 110,
      exterieur: "520 M² JARD.",
      dpe: "A",
      equipements: "Cuisine équipée,Garage attenant,Domotique",
    },
    {
      ownerId: particulier.id,
      transaction: "LOCATION" as const,
      badge: "LOCATION",
      titre: "Appartement en centre-bourg",
      description:
        "Appartement lumineux en centre-bourg d'Orchies, à deux pas des commerces et de la gare. Cuisine équipée, balcon exposé sud, place de parking privative incluse.",
      prix: 790,
      commune: "Orchies",
      villageSlug: villageSlug("Orchies"),
      pieces: 3,
      chambres: 2,
      surface: 68,
      exterieur: "BALCON",
      dpe: "D",
      equipements: "Cuisine équipée,Parking privatif,Balcon",
    },
  ];

  await prisma.listing.deleteMany({
    where: { ownerId: { in: [pvl.id, partenaire.id, particulier.id] } },
  });

  const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  for (const { photos, prixInitial, ...data } of listingsData) {
    const priceHistory = prixInitial
      ? [
          { prix: prixInitial, changedAt: THIRTY_DAYS_AGO },
          { prix: data.prix, changedAt: new Date() },
        ]
      : [{ prix: data.prix }];

    await prisma.listing.create({
      data: {
        ...data,
        statut: "PUBLIEE",
        photos: photos
          ? { create: photos.map((url, order) => ({ url, order })) }
          : undefined,
        priceHistory: { create: priceHistory },
      },
    });
  }

  await prisma.review.upsert({
    where: { agencyId_authorId: { agencyId: pvl.id, authorId: particulier.id } },
    update: {},
    create: {
      agencyId: pvl.id,
      authorId: particulier.id,
      note: 5,
      commentaire:
        "Accompagnement au top pour la vente de notre maison à Camphin, réactifs et de bon conseil.",
    },
  });
  await prisma.review.upsert({
    where: { agencyId_authorId: { agencyId: partenaire.id, authorId: particulier.id } },
    update: {},
    create: {
      agencyId: partenaire.id,
      authorId: particulier.id,
      note: 4,
      commentaire:
        "Bon suivi sur notre projet à Cysoing, quelques délais de retour un peu longs mais le résultat est là.",
    },
  });

  console.log(`Seed terminé — ${listingsData.length} annonces de démonstration créées.`);
  console.log(`Comptes démo (mot de passe : "${DEMO_PASSWORD}") :`);
  console.log(`  - ${pvl.email} (agence)`);
  console.log(`  - ${partenaire.email} (agence)`);
  console.log(`  - ${particulier.email} (particulier)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
