/**
 * Turn assistant lines like `Title — https://…` or `- Title — https://…` into markdown links
 * so ReactMarkdown emits <a> and chat can render YouTube / link cards.
 *
 * Handles em dash —, en dash –, and ASCII hyphen - before the URL.
 */

/** Optional list prefix, greedy title, separator, URL to end of line */
const LINE_WITH_TITLE_AND_URL =
  /^(\s*(?:[-*]|\d+\.)\s+)?(.+)\s+[—–\-]\s*(https?:\/\/\S+)\s*$/i;

const BARE_URL_LINE = /^(\s*(?:[-*]|\d+\.)\s+)?(https?:\/\/\S+)\s*$/i;

function safeMarkdownLinkText(title: string): string {
  return title
    .trim()
    .replace(/\\/g, "\\\\")
    .replace(/\[/g, "⦋")
    .replace(/\]/g, "⦌")
    .replace(/\n/g, " ");
}

/**
 * Preprocess bot message markdown before passing to ReactMarkdown.
 */
export function preprocessAssistantMarkdownForLinkCards(text: string): string {
  if (!text || !text.includes("http")) return text;

  const lines = text.split("\n");
  const out: string[] = [];
  let inFence = false;

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inFence = !inFence;
      out.push(line);
      continue;
    }
    if (inFence) {
      out.push(line);
      continue;
    }

    const t = line.trimEnd();
    const titleUrl = t.match(LINE_WITH_TITLE_AND_URL);
    if (titleUrl && titleUrl[2] && titleUrl[3]) {
      const prefix = titleUrl[1] ?? "";
      const title = safeMarkdownLinkText(titleUrl[2]);
      const url = titleUrl[3].trim();
      out.push(`${prefix}[${title}](${url})`);
      continue;
    }

    const bare = t.match(BARE_URL_LINE);
    if (bare && bare[2]) {
      const prefix = bare[1] ?? "";
      const url = bare[2].trim();
      const lower = url.toLowerCase();
      const label =
        lower.includes("youtube.com") || lower.includes("youtu.be")
          ? "Watch on YouTube"
          : "Open link";
      out.push(`${prefix}[${label}](${url})`);
      continue;
    }

    out.push(line);
  }

  return out.join("\n");
}
