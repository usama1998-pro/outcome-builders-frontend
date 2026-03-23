/**
 * Chat URL model:
 * - `CHAT_ENTRY_PATH` — landing + sidebar “New Action” (`app/chat/page.tsx`).
 * - `CHAT_NEW_SESSION_PATH` — same app shell as existing chats, but `chatId === "new"` for
 *   streaming (`app/chat/[chatId]/page.tsx`). Used when sending from the landing (pending
 *   question) so the composer + messages live in one route.
 */
export const CHAT_ENTRY_PATH = "/chat";
export const CHAT_NEW_SESSION_PATH = "/chat/new";
