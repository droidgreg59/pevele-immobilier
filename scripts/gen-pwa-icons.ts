/**
 * Génère les icônes PNG de la PWA et le favicon.ico à partir de
 * `public/icon-master.png` (le carré arrondi rogné, sans marge blanche — la
 * marge est retirée avec `.trim()` pour rester robuste si le fichier source
 * en a une). Rejouer après toute modification du visuel de marque.
 *
 * Usage : npx tsx scripts/gen-pwa-icons.ts
 */
import { writeFileSync } from "node:fs";
import sharp from "sharp";

const SRC = "public/icon-master.png";
const OUT: { file: string; size: number }[] = [
  { file: "public/icon-192.png", size: 192 },
  { file: "public/icon-512.png", size: 512 },
  { file: "public/apple-touch-icon.png", size: 180 },
];
const FAVICON_FILE = "src/app/favicon.ico";
const FAVICON_SIZES = [16, 32, 48];

/**
 * Construit un .ico minimal en empaquetant des PNG déjà encodés (supporté
 * depuis Windows Vista, universellement lu par les navigateurs) — pas besoin
 * d'une dépendance dédiée pour un format aussi simple. Voir la spec ICONDIR/
 * ICONDIRENTRY : https://en.wikipedia.org/wiki/ICO_(file_format)
 */
function buildIco(images: { size: number; png: Buffer }[]): Buffer {
  const headerSize = 6 + 16 * images.length;
  let offset = headerSize;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type = icon
  header.writeUInt16LE(images.length, 4);

  const entries: Buffer[] = [];
  for (const { size, png } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 = 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height (0 = 256)
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bit count
    entry.writeUInt32LE(png.length, 8); // bytes in resource
    entry.writeUInt32LE(offset, 12); // offset
    offset += png.length;
    entries.push(entry);
  }

  return Buffer.concat([header, ...entries, ...images.map((i) => i.png)]);
}

async function main() {
  const trimmed = await sharp(SRC).trim({ background: "#ffffff", threshold: 8 }).toBuffer();
  for (const { file, size } of OUT) {
    await sharp(trimmed).resize(size, size, { fit: "fill" }).png().toFile(file);
    console.log(`écrit ${file} (${size}×${size})`);
  }

  const favicons = await Promise.all(
    FAVICON_SIZES.map(async (size) => ({
      size,
      // ensureAlpha() : Next/Turbopack décode le PNG embarqué en ICO en exigeant
      // du RGBA — un PNG opaque que sharp encoderait en RGB (sans canal alpha)
      // fait échouer le build avec « The PNG is not in RGBA format! ».
      png: await sharp(trimmed).resize(size, size, { fit: "fill" }).ensureAlpha().png().toBuffer(),
    }))
  );
  writeFileSync(FAVICON_FILE, buildIco(favicons));
  console.log(`écrit ${FAVICON_FILE} (${FAVICON_SIZES.join("×")}px)`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
