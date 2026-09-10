/**
 * Génère les icônes PNG de la PWA à partir de `public/icon.svg`.
 * Rejouer après toute modification du visuel de marque.
 *
 * Usage : npx tsx scripts/gen-pwa-icons.ts
 */
import { readFileSync } from "node:fs";
import sharp from "sharp";

const SRC = "public/icon.svg";
const OUT: { file: string; size: number }[] = [
  { file: "public/icon-192.png", size: 192 },
  { file: "public/icon-512.png", size: 512 },
  { file: "public/apple-touch-icon.png", size: 180 },
];

async function main() {
  const svg = readFileSync(SRC);
  for (const { file, size } of OUT) {
    await sharp(svg, { density: 384 }).resize(size, size).png().toFile(file);
    console.log(`écrit ${file} (${size}×${size})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
