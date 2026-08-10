import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { villages } from "../src/data/villages";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "demo1234";

async function upsertUser(input: {
  email: string;
  nom: string;
  entreprise?: string;
  type: "PARTICULIER" | "AGENCE";
}) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  return prisma.user.upsert({
    where: { email: input.email },
    update: {},
    create: { ...input, passwordHash, entreprise: input.entreprise ?? null },
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
    type: "AGENCE",
  });
  const partenaire = await upsertUser({
    email: "partenaire@example.com",
    nom: "Agence Partenaire Pévèle",
    entreprise: "Agence Partenaire Pévèle",
    type: "AGENCE",
  });
  const particulier = await upsertUser({
    email: "demo@example.com",
    nom: "Compte démo particulier",
    type: "PARTICULIER",
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

  for (const { photos, ...data } of listingsData) {
    await prisma.listing.create({
      data: {
        ...data,
        statut: "PUBLIEE",
        photos: photos
          ? { create: photos.map((url, order) => ({ url, order })) }
          : undefined,
      },
    });
  }

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
