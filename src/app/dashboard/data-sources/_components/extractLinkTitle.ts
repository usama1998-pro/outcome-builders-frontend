/**
 * Resolve a display title from a video or web URL (oEmbed where CORS allows, else path/hostname).
 */

function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/** Fallback when oEmbed is unavailable (e.g. generic links). */
export function deriveTitleFromUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    const path = u.pathname.replace(/\/+$/, "");
    const segments = path.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    if (last) {
      const base = safeDecode(last).replace(/[-_+]/g, " ").replace(/\.(html?|php|aspx?)$/i, "");
      const cleaned = base.replace(/\s+/g, " ").trim();
      if (cleaned.length > 0) {
        return cleaned.length > 120 ? `${cleaned.slice(0, 117)}…` : cleaned;
      }
    }
    return u.hostname.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

/** YouTube / Vimeo oEmbed (browser CORS). Returns null on failure. */
export async function fetchEmbedTitle(url: string): Promise<string | null> {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase();

    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      const oembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(trimmed)}&format=json`;
      const res = await fetch(oembed);
      if (!res.ok) return null;
      const data = (await res.json()) as { title?: string };
      const t = data.title?.trim();
      return t || null;
    }

    if (host.includes("vimeo.com")) {
      const oembed = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(trimmed)}`;
      const res = await fetch(oembed);
      if (!res.ok) return null;
      const data = (await res.json()) as { title?: string };
      const t = data.title?.trim();
      return t || null;
    }

    if (host.includes("dailymotion.com") || host.includes("dai.ly")) {
      const oembed = `https://www.dailymotion.com/services/oembed?url=${encodeURIComponent(trimmed)}`;
      const res = await fetch(oembed);
      if (!res.ok) return null;
      const data = (await res.json()) as { title?: string };
      const t = data.title?.trim();
      return t || null;
    }
  } catch {
    return null;
  }
  return null;
}

/** Prefer embed title, then path/hostname heuristic. */
export async function resolveTitleFromUrl(url: string): Promise<string | null> {
  const embed = await fetchEmbedTitle(url);
  if (embed) return embed;
  return deriveTitleFromUrl(url);
}

/** Title from uploaded file name (strip extension, humanize). */
export function titleFromFileName(file: File): string | null {
  const base = file.name.replace(/\.[^.]+$/, "").replace(/[-_+]/g, " ").trim();
  return base.length > 0 ? base : null;
}
