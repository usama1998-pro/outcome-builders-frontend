/**
 * Chat URL model:
 * - `CHAT_ENTRY_PATH` — new chat and landing (`app/chat/page.tsx` → `ChatClient` with `chatId === "new"`).
 * - `CHAT_NEW_SESSION_PATH` — legacy; prefer `CHAT_ENTRY_PATH`. Kept for redirects and deep links.
 */
export const CHAT_ENTRY_PATH = "/chat";
export const CHAT_NEW_SESSION_PATH = "/chat/new";
