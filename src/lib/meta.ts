import "server-only";

/**
 * Client minimal de l'API Graph de Meta pour publier sur la Page Facebook et
 * le compte Instagram du site, avec le jeton permanent de l'utilisateur
 * système `pevele-publication` (META_SYSTEM_TOKEN, jamais journalisé).
 * Procédures suivies : « Reels publishing » (Page) et « Content publishing »
 * (Instagram, via Facebook Login).
 */

const VERSION = "v23.0";
const GRAPH = `https://graph.facebook.com/${VERSION}`;

/** Identifiants publics (non secrets) de la Page et du compte Instagram. */
export const META_PAGE_ID = process.env.META_PAGE_ID || "1293118360556938";
export const META_IG_ID = process.env.META_IG_ID || "17841415335014315";

export class MetaError extends Error {
  constructor(
    message: string,
    /** Codes Meta (`error.code` / `error.error_subcode`), quand ils sont fournis. */
    readonly code?: number,
    readonly subcode?: number
  ) {
    super(message);
  }

  /**
   * Erreur passagère : à retenter au passage suivant plutôt qu'à marquer en
   * échec. Ex. Instagram « le contenu n'est pas prêt à être publié » (code
   * 9007, sous-code 2207027), limites de débit, indisponibilité temporaire.
   */
  get transient(): boolean {
    return this.code === 9007 || this.subcode === 2207027 || this.code === 4 || this.code === 17 || this.code === 2 || this.code === 1;
  }
}

function systemToken(): string {
  const t = process.env.META_SYSTEM_TOKEN;
  if (!t) throw new MetaError("META_SYSTEM_TOKEN manquant.");
  return t;
}

type Json = Record<string, unknown>;

async function graph(
  path: string,
  { method = "GET", params = {}, token = systemToken() }: { method?: "GET" | "POST"; params?: Record<string, string>; token?: string } = {}
): Promise<Json> {
  const body = new URLSearchParams({ ...params, access_token: token });
  const res =
    method === "GET"
      ? await fetch(`${GRAPH}${path}?${body}`, { cache: "no-store" })
      : await fetch(`${GRAPH}${path}`, { method: "POST", body, cache: "no-store" });
  const json = (await res.json().catch(() => ({}))) as Json;
  const err = json.error as { message?: string; error_user_msg?: string; code?: number; error_subcode?: number } | undefined;
  if (!res.ok || err) {
    throw new MetaError(err?.error_user_msg || err?.message || `Erreur Meta (HTTP ${res.status})`, err?.code, err?.error_subcode);
  }
  return json;
}

/** Jeton de Page, dérivé du jeton système (droits CREATE_CONTENT). */
export async function getPageToken(): Promise<string> {
  const res = await graph("/me/accounts", { params: { fields: "id,access_token" } });
  const page = (res.data as { id: string; access_token: string }[] | undefined)?.find((p) => p.id === META_PAGE_ID);
  if (!page) throw new MetaError("La Page Pévèle Immobilier n'est pas accessible avec ce jeton.");
  return page.access_token;
}

// ─── Facebook ────────────────────────────────────────────────────────────────

/** Démarre un Reel et fait télécharger la vidéo par Meta depuis son URL publique. */
export async function fbStartReel(pageToken: string, videoUrl: string): Promise<string> {
  const start = await graph(`/${META_PAGE_ID}/video_reels`, { method: "POST", params: { upload_phase: "start" }, token: pageToken });
  const videoId = String(start.video_id);
  const res = await fetch(`https://rupload.facebook.com/video-upload/${VERSION}/${videoId}`, {
    method: "POST",
    headers: { Authorization: `OAuth ${pageToken}`, file_url: videoUrl },
  });
  const json = (await res.json().catch(() => ({}))) as Json;
  if (!res.ok || json.success !== true) {
    const err = json.error as { message?: string } | undefined;
    throw new MetaError(err?.message || `Échec du téléchargement de la vidéo par Facebook (HTTP ${res.status}).`);
  }
  return videoId;
}

export type FbVideoState = "ready" | "processing" | "error";

export async function fbVideoState(pageToken: string, videoId: string): Promise<{ state: FbVideoState; detail?: string }> {
  const res = await graph(`/${videoId}`, { params: { fields: "status" }, token: pageToken });
  const status = res.status as { video_status?: string; processing_phase?: { status?: string; error?: { message?: string } }; uploading_phase?: { status?: string; error?: { message?: string } } } | undefined;
  const error = status?.uploading_phase?.error?.message || status?.processing_phase?.error?.message;
  if (error || status?.video_status === "error") return { state: "error", detail: error || "Erreur de traitement Facebook." };
  // Le Reel peut être publié dès que l'envoi est terminé ; Facebook finit le traitement ensuite.
  if (status?.video_status === "ready" || status?.uploading_phase?.status === "complete") return { state: "ready" };
  return { state: "processing" };
}

export async function fbFinishReel(pageToken: string, videoId: string, description: string): Promise<void> {
  await graph(`/${META_PAGE_ID}/video_reels`, {
    method: "POST",
    params: { upload_phase: "finish", video_id: videoId, video_state: "PUBLISHED", description },
    token: pageToken,
  });
}

export async function fbVideoPermalink(pageToken: string, videoId: string): Promise<string | null> {
  try {
    const res = await graph(`/${videoId}`, { params: { fields: "permalink_url" }, token: pageToken });
    const p = res.permalink_url as string | undefined;
    return p ? (p.startsWith("http") ? p : `https://www.facebook.com${p}`) : null;
  } catch {
    return null;
  }
}

export async function fbPublishPhoto(pageToken: string, imageUrl: string, caption: string): Promise<{ postId: string; permalink: string | null }> {
  const res = await graph(`/${META_PAGE_ID}/photos`, { method: "POST", params: { url: imageUrl, caption }, token: pageToken });
  const postId = String(res.post_id ?? res.id);
  let permalink: string | null = null;
  try {
    const p = await graph(`/${postId}`, { params: { fields: "permalink_url" }, token: pageToken });
    permalink = (p.permalink_url as string) ?? null;
  } catch {
    // le lien n'est qu'un confort d'affichage
  }
  return { postId, permalink };
}

// ─── Instagram ───────────────────────────────────────────────────────────────

export async function igCreateContainer(kind: "VIDEO" | "IMAGE", mediaUrl: string, caption: string): Promise<string> {
  const params: Record<string, string> =
    kind === "VIDEO"
      ? { media_type: "REELS", video_url: mediaUrl, caption, share_to_feed: "true" }
      : { image_url: mediaUrl, caption };
  const res = await graph(`/${META_IG_ID}/media`, { method: "POST", params });
  return String(res.id);
}

export type IgContainerStatus = "IN_PROGRESS" | "FINISHED" | "PUBLISHED" | "ERROR" | "EXPIRED";

export async function igContainerStatus(containerId: string): Promise<{ status: IgContainerStatus; detail?: string }> {
  const res = await graph(`/${containerId}`, { params: { fields: "status_code,status" } });
  return { status: res.status_code as IgContainerStatus, detail: res.status as string | undefined };
}

export async function igPublish(containerId: string): Promise<{ mediaId: string; permalink: string | null }> {
  const res = await graph(`/${META_IG_ID}/media_publish`, { method: "POST", params: { creation_id: containerId } });
  const mediaId = String(res.id);
  let permalink: string | null = null;
  try {
    const p = await graph(`/${mediaId}`, { params: { fields: "permalink" } });
    permalink = (p.permalink as string) ?? null;
  } catch {
    // idem
  }
  return { mediaId, permalink };
}
