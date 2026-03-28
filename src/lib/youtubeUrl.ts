/**
 * Extract YouTube video id from common watch / embed / shorts / youtu.be URLs.
 */
export function extractYoutubeVideoId(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;

  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return isLikelyYoutubeId(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "www.youtube.com") {
      const path = u.pathname;
      if (path.startsWith("/shorts/")) {
        const id = path.split("/")[2];
        return isLikelyYoutubeId(id) ? id : null;
      }
      if (path.startsWith("/embed/")) {
        const id = path.split("/")[2];
        return isLikelyYoutubeId(id) ? id : null;
      }
      if (path === "/watch" || path.startsWith("/watch")) {
        const v = u.searchParams.get("v");
        return v && isLikelyYoutubeId(v) ? v : null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function isLikelyYoutubeId(id: string | undefined): id is string {
  if (!id) return false;
  return /^[\w-]{11}$/.test(id);
}
