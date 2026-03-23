/** Min length for chat tab titles (API + UI). */
export const CHAT_TAB_NAME_MIN_LENGTH = 5;

/** Max length for chat tab titles; matches API and DB `chat_tabs.name` (varchar 255). */
export const CHAT_TAB_NAME_MAX_LENGTH = 255;

/** ASCII letters, digits, hyphen `-`, and spaces (hyphen last in class to avoid range ambiguity). */
export const CHAT_TAB_NAME_PATTERN = /^[a-zA-Z0-9 -]+$/;

/** For controlled rename input: keep only allowed characters. */
export function filterChatTabNameInput(
  value: string,
  maxLen: number = CHAT_TAB_NAME_MAX_LENGTH,
): string {
  return value.replace(/[^a-zA-Z0-9 -]/g, "").slice(0, maxLen);
}

/** Default label for new tabs (API min length 5; must match backend default for new tabs). */
export const DEFAULT_CHAT_TAB_DISPLAY_NAME = "New Action";

/**
 * True if the tab title is still a system placeholder (auto-rename should be allowed).
 * Includes legacy numeric timestamp tabs and old `chat-*` fallbacks.
 */
export function isPlaceholderChatTabName(name: string): boolean {
  const n = name.trim();
  if (n.length === 0) return true;
  if (/^\d+$/.test(n)) return true;
  if (/^chat-[a-z0-9]+$/i.test(n)) return true;
  const lower = n.toLowerCase();
  if (lower === "new action" || lower === "new chat") return true;
  return false;
}

/**
 * Default tab title from the first user message (first line, sanitized).
 * Short or empty lines use a readable fallback (no random numeric suffix).
 */
export function deriveAutomaticChatTabTitle(firstQuestion: string): string {
  const line =
    firstQuestion.replace(/\r\n/g, "\n").split("\n")[0]?.trim() ?? "";
  let t = line
    .replace(/[^a-zA-Z0-9 -]+/g, " ")
    .replace(/ +/g, " ")
    .trim()
    .slice(0, CHAT_TAB_NAME_MAX_LENGTH);
  if (t.length >= CHAT_TAB_NAME_MIN_LENGTH) return t;
  if (!t) return DEFAULT_CHAT_TAB_DISPLAY_NAME;
  const padded = `${t} action`.replace(/ +/g, " ").trim().slice(0, CHAT_TAB_NAME_MAX_LENGTH);
  if (padded.length >= CHAT_TAB_NAME_MIN_LENGTH) return padded;
  return DEFAULT_CHAT_TAB_DISPLAY_NAME;
}

export function isValidChatTabName(name: string): boolean {
  const t = name.trim();
  return (
    t.length >= CHAT_TAB_NAME_MIN_LENGTH &&
    t.length <= CHAT_TAB_NAME_MAX_LENGTH &&
    CHAT_TAB_NAME_PATTERN.test(t)
  );
}

export interface ChatTab {
  id: string; // UUID as string
  name: string;
  tenant_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
}

/** Shown after agent creates a brainspace, collection, or article (from SSE `resource_created`). */
export interface ChatResourceLink {
  kind: "brainspace" | "collection" | "article";
  title: string;
  href: string;
}

export interface ChatMessage {
  id: number;
  chat_tab_id: string; // UUID as string
  question: string;
  answer: string | null;
  created_at: string;
  updated_at: string;
  /** Open-in-dashboard links for this assistant reply (persisted as `resource_links` on the API). */
  resourceLinks?: ChatResourceLink[];
}

export interface ChatHistory {
  chat_tab: ChatTab;
  messages: ChatMessage[];
}

export interface StreamEvent {
  type:
    | "start"
    | "chunk"
    | "complete"
    | "stop"
    | "error"
    | "status"
    | "resource_created";
  content?: string;
  message_id?: number;
  chat_tab_id?: string; // UUID as string
  stream_id?: string;
  error?: string;
  status?: string; // Status message like "Searching knowledge base..."
  step?: string; // Step identifier like "searching_kb", "generating", etc.
}
