import "server-only";
import { S3Client } from "@aws-sdk/client-s3";

/**
 * Stockage objet (Cloudflare R2, API compatible S3) pour les photos
 * d'annonces et les logos — remplace le disque local, incompatible avec le
 * filesystem éphémère de Vercel. Voir src/lib/photo-upload.ts.
 */

export const r2Bucket = process.env.R2_BUCKET!;
export const r2PublicUrl = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
