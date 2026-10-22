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
  igFindPublishedByCaption,
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
      if (s.status === "PUBLISHED") {
        // Déjà publié lors d'une exécution interrompue avant l'enregistrement :
        // on retrouve le média au lieu de republier.
        const found = await igFindPublishedByCaption(post.captionInstagram);
        post = await prisma.socialPost.update({
          where: { id },
          data: { igMediaId: found?.mediaId ?? null, igPermalink: found?.permalink ?? null, igPublishedAt: new Date(), error: null },
        });
      } else if (s.status === "EXPIRED") {
        // Conteneur périmé (24 h) : on l'oublie, le passage suivant en recrée un.
        post = await prisma.socialPost.update({ where: { id }, data: { igContainerId: null } });
      } else if (s.status === "ERROR") {
        await prisma.socialPost.update({ where: { id }, data: { igContainerId: null } });
        throw new MetaError(`Instagram : ${s.detail || "erreur de traitement du média"}`);
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
    // Erreur passagère (contenu Instagram pas encore prêt, limite de débit…) :
    // on reste EN_COURS, le passage suivant (15 min) reprendra là où on en est.
    // Accès bloqué par Meta : la publication reste validée et repartira
    // d'elle-même une fois l'accès rétabli (rien n'a été publié à cette étape
    // si l'API refuse tout appel).
    if (e instanceof MetaError && e.accessBlocked) {
      const p = await prisma.socialPost.findUniqueOrThrow({ where: { id }, select: { fbVideoId: true, fbPublishedAt: true, igContainerId: true } });
      const statut = p.fbVideoId || p.fbPublishedAt || p.igContainerId ? "EN_COURS" : "VALIDEE";
      await prisma.socialPost.update({ where: { id }, data: { statut, error: `Meta : accès API bloqué — en attente de déblocage (${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}).` } });
      return { id, statut, error: "ACCES_BLOQUE" };
    }
    const retry = e instanceof MetaError && e.transient;
    const statut = retry ? "EN_COURS" : "ECHEC";
    await prisma.socialPost.update({ where: { id }, data: { statut, error: message.slice(0, 1000) } });
    return { id, statut, error: message };
  }
}

/** Créneau planifié : traite les publications validées dont l'heure est passée. */
export async function runDueSocialPosts(now = new Date()): Promise<ProcessResult[]> {
  const candidates = await prisma.socialPost.findMany({
    where: { statut: { in: ["VALIDEE", "EN_COURS"] }, scheduledAt: { lte: now } },
    orderBy: { scheduledAt: "asc" },
    take: 5,
  });
  // Budget partagé sur l'exécution (maxDuration 60 s) : ne jamais être coupé
  // entre une publication et son enregistrement en base.
  const deadline = Date.now() + 48_000;
  const results: ProcessResult[] = [];
  for (const p of candidates.filter((c) => isDue(c, now))) {
    const left = deadline - Date.now();
    if (left < 15_000) break;
    const r = await processSocialPost(p.id, Math.min(40_000, left));
    results.push(r);
    // Accès bloqué : inutile d'insister sur les publications suivantes.
    if (r.error === "ACCES_BLOQUE") break;
  }
  return results;
}
