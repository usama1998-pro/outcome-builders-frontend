/** Persists which chat tab UUID is active on `/chat` (or legacy `/chat/new`) when the path has no tab uuid. */
export const ACTIVE_CHAT_TAB_STORAGE_KEY = "ob:activeChatTabUuid";

/** Fired after a tab is deleted from the sidebar so the chat view can clear (same-route navigation does not remount). */
export const CHAT_TAB_DELETED_EVENT = "ob:chatTabDeleted";

/** Fired when the user picks "New action" while already on `/chat` so the client resets without a navigation remount. */
export const CHAT_NEW_SESSION_EVENT = "ob:chatNewSession";

export type ChatTabDeletedDetail = { chatTabId: string };
