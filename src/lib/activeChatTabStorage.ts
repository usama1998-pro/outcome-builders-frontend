/** Persists which chat tab UUID is active on the new-session route when the path has no uuid (see `CHAT_NEW_SESSION_PATH`). */
export const ACTIVE_CHAT_TAB_STORAGE_KEY = "ob:activeChatTabUuid";

/** Fired after a tab is deleted from the sidebar so the chat view can clear (same-route navigation does not remount). */
export const CHAT_TAB_DELETED_EVENT = "ob:chatTabDeleted";

export type ChatTabDeletedDetail = { chatTabId: string };
