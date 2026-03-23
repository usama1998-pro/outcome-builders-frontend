/**
 * Persists assistant mode (Ask vs Operator) across navigations.
 * Legacy: stored boolean under `outcome-builder:chatAgentMode`.
 */

const LEGACY_KEY = "outcome-builder:chatAgentMode";
const STORAGE_KEY = "outcome-builder:chatAssistantMode";

/** Ask → chat pipeline; Operator → LangGraph agent. */
export type ChatAssistantMode = "ask" | "operator";

export function getStoredAssistantMode(): ChatAssistantMode {
    if (typeof window === "undefined") return "ask";
    try {
        const v = localStorage.getItem(STORAGE_KEY);
        if (v === "operator") return "operator";
        if (v === "ask") return "ask";

        const legacy = localStorage.getItem(LEGACY_KEY);
        if (legacy === "true") {
            localStorage.setItem(STORAGE_KEY, "operator");
            return "operator";
        }
        if (legacy === "false") {
            localStorage.setItem(STORAGE_KEY, "ask");
            return "ask";
        }
        return "ask";
    } catch {
        return "ask";
    }
}

export function setStoredAssistantMode(mode: ChatAssistantMode): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(STORAGE_KEY, mode);
        localStorage.setItem(LEGACY_KEY, mode === "operator" ? "true" : "false");
    } catch {
        /* quota / private mode */
    }
}

/** @deprecated Prefer getStoredAssistantMode */
export function getStoredAgentMode(): boolean {
    return getStoredAssistantMode() === "operator";
}

/** @deprecated Prefer setStoredAssistantMode */
export function setStoredAgentMode(value: boolean): void {
    setStoredAssistantMode(value ? "operator" : "ask");
}
