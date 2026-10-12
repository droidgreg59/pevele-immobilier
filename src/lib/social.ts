import "server-only";
import { prisma } from "./prisma";
import {
  MetaError,
  getPageToken,
  fbStartReel,
  fbVideoState,
  fbFinishReel,
  fbVideoPermalink,
  fbPublishPhoto,
  igCreateContainer,
  igContainerStatus,
  igPublish,
} from "./meta";
import { isDue, isFullyPublished } from "./social-rules";

/**
 * Publication d'une SocialPost, par étapes reprenables : chaque appel avance
 * autant que possible dans le temps imparti puis rend la main. Les
 * identifiants intermédiaires (vidéo Facebook, conteneur Instagram) sont
 * enregistrés en base, si bien qu'un appel suivant (créneau planifié ou
 * bouton « Actualiser ») reprend là où le précédent s'est arrêté sans jamais
 * publier deux fois.
 */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type ProcessResult = { id: string; statut: string; error?: string };

export async function processSocialPost(id: string, budgetMs = 45_000): Promise<ProcessResult> {
  const deadline = Date.now() + budgetMs;
  // Verrou léger : on ne traite que VALIDEE/EN_COURS, et on passe en EN_COURS.
  const claimed = await prisma.socialPost.updateMany({
    where: { id, statut: { in: ["VALIDEE", "EN_COURS"] } },
    data: { statut: "EN_COURS" },
  });
  if (claimed.count === 0) {
    const p = await prisma.socialPost.findUnique({ where: { id }, select: { statut: true } });
    return { id, statut: p?.statut ?? "INTROUVABLE" };
  }
  let post = await prisma.socialPost.findUniqueOrThrow({ where: { id } });

  try {
    // ── Facebook ──
    if (post.facebook && !post.fbPublishedAt) {
      const pageToken = await getPageToken();
      if (post.mediaType === "IMAGE") {
        const { postId, permalink } = await fbPublishPhoto(pageToken, post.mediaUrl, post.captionFacebook);
        post = await prisma.socialPost.update({ where: { id }, data: { fbPostId: postId, fbPermalink: permalink, fbPublishedAt: new Date(), error: null } });
      } else {
        let videoId = post.fbVideoId;
        if (!videoId) {
          videoId = await fbStartReel(pageToken, post.mediaUrl);
          post = await prisma.socialPost.update({ where: { id }, data: { fbVideoId: videoId } });
        }
        let state = await fbVideoState(pageToken, videoId);
        while (state.state === "processing" && Date.now() < deadline - 5_000) {
          await sleep(4_000);
          state = await fbVideoState(pageToken, videoId);
        }
        if (state.state === "error") throw new MetaError(`Facebook : ${state.detail}`);
        if (state.state === "ready") {
          await fbFinishReel(pageToken, videoId, post.captionFacebook);
          const permalink = await fbVideoPermalink(pageToken, videoId);
          post = await prisma.socialPost.update({ where: { id }, data: { fbPermalink: permalink, fbPublishedAt: new Date(), error: null } });
        }
      }
    }

    // ── Instagram ──
    if (post.instagram && !post.igPublishedAt && Date.now() < deadline) {
      let containerId = post.igContainerId;
      if (!containerId) {
        containerId = await igCreateContainer(post.mediaType, post.mediaUrl, post.captionInstagram);
        post = await prisma.socialPost.update({ where: { id }, data: { igContainerId: containerId } });
      }
      let s = await igContainerStatus(containerId);
      while (s.status === "IN_PROGRESS" && Date.now() < deadline - 5_000) {
        await sleep(5_000);
        s = await igContainerStatus(containerId);
      }
      if (s.status === "ERROR" || s.status === "EXPIRED") {
        // Conteneur inutilisable : on l'oublie pour en recréer un au prochain essai.
        await prisma.socialPost.update({ where: { id }, data: { igContainerId: null } });
        throw new MetaError(`Instagram : ${s.status === "EXPIRED" ? "conteneur expiré" : s.detail || "erreur de traitement de la vidéo"}`);
      }
      if (s.status === "FINISHED") {
        const { mediaId, permalink } = await igPublish(containerId);
        post = await prisma.socialPost.update({ where: { id }, data: { igMediaId: mediaId, igPermalink: permalink, igPublishedAt: new Date(), error: null } });
      }
    }

    const done = isFullyPublished(post);
    const updated = await prisma.socialPost.update({
      where: { id },
      data: { statut: done ? "PUBLIEE" : "EN_COURS" },
    });
    return { id, statut: updated.statut };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await prisma.socialPost.update({ where: { id }, data: { statut: "ECHEC", error: message.slice(0, 1000) } });
    return { id, statut: "ECHEC", error: message };
  }
}

/** Créneau planifié : traite les publications validées dont l'heure est passée. */
export async function runDueSocialPosts(now = new Date()): Promise<ProcessResult[]> {
  const candidates = await prisma.socialPost.findMany({
    where: { statut: { in: ["VALIDEE", "EN_COURS"] }, scheduledAt: { lte: now } },
    orderBy: { scheduledAt: "asc" },
    take: 5,
  });
  const results: ProcessResult[] = [];
  for (const p of candidates.filter((c) => isDue(c, now))) {
    results.push(await processSocialPost(p.id, 40_000));
  }
  return results;
}
