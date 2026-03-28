import axios from "axios";

function extractDetailFromPayload(data: unknown): string | undefined {
    if (data == null) return undefined;
    if (typeof data === "string") {
        const t = data.trim();
        if (t.startsWith("{")) {
            try {
                return extractDetailFromPayload(JSON.parse(t) as Record<string, unknown>);
            } catch {
                return t;
            }
        }
        return t;
    }
    if (typeof data === "object") {
        const o = data as { detail?: unknown; message?: unknown };
        const d = o.detail;
        if (typeof d === "string") return d;
        if (Array.isArray(d) && d.length > 0) {
            const first = d[0];
            if (first && typeof first === "object" && "msg" in first) {
                return String((first as { msg: unknown }).msg);
            }
            return d.map(String).join("; ");
        }
        if (typeof o.message === "string") return o.message;
    }
    return undefined;
}

function normalizeJsonWrappedMessage(s: string): string {
    const t = s.trim();
    if (!t.startsWith("{")) return t;
    try {
        const extracted = extractDetailFromPayload(JSON.parse(t) as Record<string, unknown>);
        return extracted ?? t;
    } catch {
        return t;
    }
}

function humanizeKnownApiText(s: string): string {
    const lower = s.toLowerCase();
    if (
        (lower.includes("invalid") && lower.includes("token")) ||
        (lower.includes("expired") && lower.includes("token"))
    ) {
        return "Your session has expired. Please sign in again.";
    }
    if (
        lower === "not authenticated" ||
        lower.includes("could not validate credentials")
    ) {
        return "Your session has expired. Please sign in again.";
    }
    return s;
}

/**
 * User-facing copy for API failures: FastAPI `detail`, JSON strings, axios errors, and `Error` messages.
 */
export function getUserFacingApiErrorMessage(
    input: unknown,
    fallback = "Something went wrong. Please try again.",
): string {
    if (axios.isAxiosError(input)) {
        const fromData = extractDetailFromPayload(input.response?.data);
        if (fromData) return humanizeKnownApiText(fromData);
        if (input.message) {
            const m = normalizeJsonWrappedMessage(input.message);
            return humanizeKnownApiText(m) || fallback;
        }
    }
    if (input instanceof Error) {
        const m = normalizeJsonWrappedMessage(input.message);
        return humanizeKnownApiText(m) || fallback;
    }
    if (typeof input === "string") {
        const m = normalizeJsonWrappedMessage(input);
        return humanizeKnownApiText(m) || fallback;
    }
    if (input && typeof input === "object") {
        const fromData = extractDetailFromPayload(input);
        if (fromData) return humanizeKnownApiText(fromData);
    }
    return fallback;
}
