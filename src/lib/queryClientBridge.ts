import type { QueryClient } from "@tanstack/react-query";
import { ACTIVE_CHAT_TAB_STORAGE_KEY } from "./activeChatTabStorage";

let client: QueryClient | null = null;

/** Called once from `Providers` so non-React code (e.g. axios 401) can clear the same cache as sign-out. */
export function registerQueryClient(c: QueryClient) {
  client = c;
}

function clearTanStackQueryCache() {
  if (!client) return;
  void client.cancelQueries();
  client.clear();
}

function clearSessionStorageForAuthChange() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(ACTIVE_CHAT_TAB_STORAGE_KEY);
    sessionStorage.removeItem("pendingChatQuestion");
    sessionStorage.removeItem("pendingChatAssistantMode");
    sessionStorage.removeItem("pendingChatAgentMode");
    sessionStorage.removeItem("pendingContent");
  } catch {
    /* ignore */
  }
}

/** TanStack Query + session keys that must not leak across users on the same browser. */
export function clearClientCaches() {
  clearTanStackQueryCache();
  clearSessionStorageForAuthChange();
}
