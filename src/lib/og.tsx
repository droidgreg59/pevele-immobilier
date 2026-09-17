import { ImageResponse } from "next/og";
import { formatPrix } from "./format";
import type { TransactionType } from "@prisma/client";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const BLUE = "#2743a6";
const INK = "#20242e";
const YELLOW = "#f5b52e";

/**
 * Carte OpenGraph de marque pour une annonce (partage social, aperçu Google).
 * Pas de photo distante chargée : un fond dégradé + les infos clés, jamais en
 * échec de rendu. satori exige `display:flex` sur tout élément à plusieurs
 * enfants — on garde donc un seul enfant texte par bloc quand c'est possible.
 */
export function listingOgImage(listing: {
  titre: string;
  prix: number;
  commune: string;
  transaction: TransactionType;
  typeBien: "MAISON" | "APPARTEMENT" | "TERRAIN";
  ownerType: "PARTICULIER" | "AGENCE" | "ARTISAN";
}): ImageResponse {
  const typeBienLabel =
    listing.typeBien === "MAISON"
      ? "Maison"
      : listing.typeBien === "APPARTEMENT"
        ? "Appartement"
        : "Terrain";
  const sourceLabel = listing.ownerType === "AGENCE" ? "Agence" : "Entre voisins";
  const pill = `${listing.transaction === "VENTE" ? "À vendre" : "À louer"} · ${sourceLabel}`;
  const situation = `${typeBienLabel} · ${listing.commune}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: `linear-gradient(135deg, ${BLUE} 0%, #1b2f78 100%)`,
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 800 }}>
            <span>Pévèle</span>
            <span style={{ color: YELLOW, marginLeft: 10 }}>Immobilier</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 700,
              padding: "8px 20px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.15)",
            }}
          >
            {pill}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 600, color: "#c9d3f2", marginBottom: 18 }}>
            {situation}
          </div>
          <div style={{ display: "flex", fontSize: 60, fontWeight: 800, lineHeight: 1.05, maxWidth: 980 }}>
            {listing.titre}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              fontSize: 52,
              fontWeight: 800,
              color: INK,
              background: YELLOW,
              padding: "14px 32px",
              borderRadius: 18,
            }}
          >
            {formatPrix(listing.prix, listing.transaction)}
          </div>
          <div style={{ display: "flex", fontSize: 24, color: "#c9d3f2" }}>pevele-immobilier.fr</div>
        </div>
      </div>
    ),
    OG_SIZE
  );
}
