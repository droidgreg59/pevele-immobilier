// Ajoute des publications en BROUILLON dans la file (/admin/publications),
// après avoir envoyé leur média sur R2 sous social/.
// Usage : npx tsx --env-file=.env scripts/social/queue-add.ts <lot.json>
//   lot.json = [{ titre, file, type: "VIDEO"|"IMAGE", at: "2026-10-14T12:30" (Paris),
//                facebook?, instagram?, fb, ig }]
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { parisLocalToUtc, validateCaptions } from "../../src/lib/social-rules";

const prisma = new PrismaClient();
const s3 = new S3Client({ region: "auto", endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! } });
type Item = { titre: string; file: string; type: "VIDEO" | "IMAGE"; at: string; facebook?: boolean; instagram?: boolean; fb: string; ig: string };

async function main() {
  const items: Item[] = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  for (const it of items) {
    const err = validateCaptions(it.fb, it.ig); if (err) throw new Error(`${it.titre} : ${err}`);
    const at = parisLocalToUtc(it.at); if (!at) throw new Error(`${it.titre} : date invalide`);
    const key = `social/${path.basename(it.file)}`;
    await s3.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET!, Key: key, Body: fs.readFileSync(it.file),
      ContentType: it.type === "VIDEO" ? "video/mp4" : "image/jpeg", CacheControl: "public, max-age=31536000, immutable" }));
    const mediaUrl = `${process.env.R2_PUBLIC_URL!.replace(/\/$/, "")}/${key}`;
    const exists = await prisma.socialPost.findFirst({ where: { titre: it.titre } });
    if (exists) { console.log(`déjà dans la file : ${it.titre}`); continue; }
    const p = await prisma.socialPost.create({ data: { titre: it.titre, mediaType: it.type, mediaUrl, captionFacebook: it.fb, captionInstagram: it.ig,
      facebook: it.facebook ?? true, instagram: it.instagram ?? true, scheduledAt: at } });
    console.log(`brouillon : ${p.titre} → ${it.at} (FB ${p.facebook ? "oui" : "non"}, IG ${p.instagram ? "oui" : "non"})`);
  }
  await prisma.$disconnect();
}
main();
