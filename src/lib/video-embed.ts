/**
 * Turns a YouTube or Vimeo watch URL into an embeddable player URL, restricted
 * to those two hosts so we never embed an arbitrary third-party iframe.
 */
export function getVideoEmbedUrl(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtube.com" || host === "m.youtube.com") {
    const id = url.pathname.startsWith("/shorts/")
      ? url.pathname.split("/")[2]
      : url.searchParams.get("v");
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  if (host === "youtu.be") {
    const id = url.pathname.slice(1);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  if (host === "vimeo.com") {
    const id = url.pathname.slice(1).split("/")[0];
    return /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
  }

  return null;
}
