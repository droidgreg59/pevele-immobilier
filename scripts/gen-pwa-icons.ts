/**
 * Génère les icônes PNG de la PWA à partir de `public/icon-master.png`
 * (le carré arrondi rogné, sans marge blanche — la marge est retirée avec
 * `.trim()` pour rester robuste si le fichier source en a une).
 * Rejouer après toute modification du visuel de marque.
 *
 * Usage : npx tsx scripts/gen-pwa-icons.ts
 */
import sharp from "sharp";

const SRC = "public/icon-master.png";
const OUT: { file: string; size: number }[] = [
  { file: "public/icon-192.png", size: 192 },
  { file: "public/icon-512.png", size: 512 },
  { file: "public/apple-touch-icon.png", size: 180 },
];

async function main() {
  const trimmed = await sharp(SRC).trim({ background: "#ffffff", threshold: 8 }).toBuffer();
  for (const { file, size } of OUT) {
    await sharp(trimmed).resize(size, size, { fit: "fill" }).png().toFile(file);
    console.log(`écrit ${file} (${size}×${size})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
