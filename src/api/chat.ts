import api from "../lib/axios";
import { getUserFacingApiErrorMessage } from "../lib/apiErrorMessage";
import routes from "../lib/routes";
import {
  ChatTab,
  ChatMessage,
  ChatHistory,
  ChatResourceLink,
  CHAT_TAB_NAME_MIN_LENGTH,
  CHAT_TAB_NAME_MAX_LENGTH,
  isValidChatTabName,
} from "../types/chat";

// Request/Response types
interface CreateChatTabRequest {
  name: string;
}

interface CreateChatMessageRequest {
  question: string;
  chat_tab_id?: string; // UUID as string
  agent_mode?: boolean;
  model?: string; // 'auto' | 'default' | specific model slug
}

interface StreamChatOptions {
  onChunk: (content: string) => void;
  onStart?: (messageId: number, chatTabId: string, streamId: string) => void; // chatTabId is UUID string
  onComplete?: () => void;
  onError?: (error: string) => void;
  onStop?: () => void;
  /** step / node: LangGraph node id in agent mode (e.g. route, retrieve_kb, merge_context, generate). */
  onStatus?: (status: string, step?: string, node?: string) => void;
  /** When the agent creates a brainspace, collection, or article (dashboard link). */
  onResourceCreated?: (link: ChatResourceLink) => void;
}

/**
 * Create a new chat tab
 */
export async function createChatTab(name: string): Promise<ChatTab> {
  const trimmed = name.trim();
  if (!isValidChatTabName(trimmed)) {
    throw new Error(
      `Name must be ${CHAT_TAB_NAME_MIN_LENGTH}–${CHAT_TAB_NAME_MAX_LENGTH} characters, letters, numbers, dashes, and spaces only`,
    );
  }
  const { data } = await api.post(routes.chat.createTab, { name: trimmed });
  return data.data.chat_tab;
}

/**
 * Get all chat tabs for the current user and tenant
 */
export async function getChatTabs(): Promise<ChatTab[]> {
  const { data } = await api.get(routes.chat.tabs);
  return data.data.chat_tabs;
}

/**
 * Search chat tabs by name or message content
 */
export async function searchChatTabs(query: string): Promise<ChatTab[]> {
  const { data } = await api.get(routes.chat.search, {
    params: { q: query },
  });
  return data.data.chat_tabs;
}

/**
 * Get chat history for a chat tab (full thread; no server-side cap unless `limit` is passed).
 */
export async function getChatHistory(
  chatTabId: string, // UUID as string
  limit?: number,
): Promise<ChatHistory> {
  const { data } = await api.get(routes.chat.history(chatTabId), {
    params: limit != null ? { limit } : {},
  });
  const raw = (data.data.messages || []) as Array<
    ChatMessage & { resource_links?: ChatResourceLink[] }
  >;
  return {
    chat_tab: data.data.chat_tab || null,
    messages: raw.map((m) => {
      const { resource_links, ...rest } = m;
      return {
        ...rest,
        resourceLinks: resource_links ?? m.resourceLinks,
      };
    }),
  };
}

/**
 * Stream chat response from LLM
 * Returns an AbortController that can be used to stop the stream
 */
export function streamChat(
  question: string,
  chatTabId: string | undefined, // UUID as string
  agentMode: boolean,
  context?:
    | {
        type: "collection" | "workspace" | "article" | "text";
        id?: number;
        text?: string;
      }
    | undefined,
  options?: StreamChatOptions,
  model?: string, // 'auto' | 'default' | specific model slug
): AbortController {
  const abortController = new AbortController();
  let streamId: string | null = null;

  const streamRequest = async () => {
    try {
      // Get token and tenant from auth store
      const token = localStorage.getItem("access_token");
      const tenantId = localStorage.getItem("tenant_id");

      // Build headers
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      if (tenantId) {
        headers["X-Tenant"] = tenantId;
      }

      // Construct the full URL
      // axios baseURL should be like http://localhost:8000/api/v1
      // But if it's just http://localhost:8000, we need to add /api/v1
      const baseURL = process.env.NEXT_PUBLIC_API_URL || "";
      // Remove trailing slash if present
      let cleanBaseURL = baseURL.replace(/\/$/, "");
      // If baseURL doesn't end with /api/v1, add it
      if (!cleanBaseURL.endsWith("/api/v1")) {
        cleanBaseURL = `${cleanBaseURL}/api/v1`;
      }
      // routes.chat.stream is "/chat/stream", so full URL is baseURL + route
      const fullUrl = `${cleanBaseURL}${routes.chat.stream}`;

      const trimmedTabId =
        typeof chatTabId === "string" && chatTabId.trim().length > 0
          ? chatTabId.trim()
          : undefined;
      const body: Record<string, unknown> = {
        question,
        agent_mode: agentMode,
      };
      if (trimmedTabId) {
        body.chat_tab_id = trimmedTabId;
      }
      if (model) {
        body.model = model;
      }
      if (context) {
        body.context = {
          type: context.type,
          id: context.id,
          text: context.text,
        };
      }

      const response = await fetch(fullUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: abortController.signal,
        // Hint for Chromium: keep chat stream ahead of background metadata requests.
        priority: "high",
      });

      if (!response.ok) {
        const fallback = `HTTP error! status: ${response.status}`;
        let errorMessage = fallback;
        try {
          const errorText = await response.text();
          let parsed: unknown = errorText;
          if (errorText) {
            try {
              parsed = JSON.parse(errorText);
            } catch {
              parsed = errorText;
            }
          }
          errorMessage = getUserFacingApiErrorMessage(parsed, fallback);
        } catch {
          /* keep default */
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No reader available");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event: any = JSON.parse(line.slice(6));

              switch (event.type) {
                case "start":
                  streamId = event.stream_id;
                  if (
                    options?.onStart &&
                    event.message_id &&
                    event.chat_tab_id
                  ) {
                    options.onStart(
                      event.message_id,
                      event.chat_tab_id,
                      event.stream_id,
                    );
                  }
                  break;

                case "chunk":
                  if (event.content && options?.onChunk) {
                    options.onChunk(event.content);
                  }
                  break;

                case "complete":
                  if (options?.onComplete) {
                    options.onComplete();
                  }
                  return;

                case "stop":
                  if (options?.onStop) {
                    options.onStop();
                  }
                  return;

                case "status":
                  if (options?.onStatus && event.status) {
                    options.onStatus(
                      event.status,
                      event.step,
                      event.node ?? event.step,
                    );
                  }
                  break;

                case "resource_created":
                  if (
                    options?.onResourceCreated &&
                    event.kind &&
                    event.href &&
                    typeof event.title === "string"
                  ) {
                    const k = event.kind as ChatResourceLink["kind"];
                    if (
                      k === "brainspace" ||
                      k === "collection" ||
                      k === "article"
                    ) {
                      options.onResourceCreated({
                        kind: k,
                        title: event.title,
                        href: event.href,
                      });
                    }
                  }
                  break;

                case "error":
                  if (options?.onError) {
                    options.onError(
                      getUserFacingApiErrorMessage(
                        event.error ?? "Unknown error",
                        "Unknown error",
                      ),
                    );
                  }
                  return;
              }
            } catch (e) {
              console.error("Error parsing SSE event:", e);
            }
          }
        }
      }

      if (options?.onComplete) {
        options.onComplete();
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        // Stream was aborted, try to stop on server
        if (streamId) {
          try {
            await api.post(routes.chat.stop, { stream_id: streamId });
          } catch (e) {
            console.error("Error stopping stream on server:", e);
          }
        }
        if (options?.onStop) {
          options.onStop();
        }
      } else {
        if (options?.onError) {
          options.onError(
            getUserFacingApiErrorMessage(error, "Stream error"),
          );
        }
      }
    }
  };

  streamRequest();

  return abortController;
}

/**
 * Stop an active chat stream
 */
export async function stopChatStream(streamId: string): Promise<void> {
  await api.post(routes.chat.stop, { stream_id: streamId });
}

/**
 * Delete a chat tab and all its messages
 */
export async function deleteChatTab(chatTabId: string): Promise<void> {
  // UUID as string
  await api.delete(routes.chat.delete(chatTabId));
}

/**
 * Update the name of a chat tab
 */
export async function updateChatTabName(
  chatTabId: string,
  name: string,
): Promise<ChatTab> {
  const trimmed = name.trim();
  if (!isValidChatTabName(trimmed)) {
    throw new Error(
      `Name must be ${CHAT_TAB_NAME_MIN_LENGTH}–${CHAT_TAB_NAME_MAX_LENGTH} characters, letters, numbers, dashes, and spaces only`,
    );
  }
  const { data } = await api.patch(routes.chat.updateTab(chatTabId), {
    name: trimmed,
  });
  return data.data.chat_tab;
}
