import api from "../lib/axios";
import routes from "../lib/routes";
import { ChatTab, ChatMessage, ChatHistory } from "../types/chat";

// Request/Response types
interface CreateChatTabRequest {
  name: string;
}

interface CreateChatMessageRequest {
  question: string;
  chat_tab_id?: number;
  agent_mode?: boolean;
}

interface StreamChatOptions {
  onChunk: (content: string) => void;
  onStart?: (messageId: number, chatTabId: number, streamId: string) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
  onStop?: () => void;
  onStatus?: (status: string, step?: string) => void;
}

/**
 * Create a new chat tab
 */
export async function createChatTab(name: string): Promise<ChatTab> {
  const { data } = await api.post(routes.chat.createTab, { name });
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
 * Get chat history for a chat tab (last N messages)
 */
export async function getChatHistory(
  chatTabId: number,
  limit: number = 10
): Promise<ChatHistory> {
  const { data } = await api.get(routes.chat.history(chatTabId), {
    params: { limit },
  });
  return {
    chat_tab: data.data.chat_tab || null,
    messages: data.data.messages || [],
  };
}

/**
 * Stream chat response from LLM
 * Returns an AbortController that can be used to stop the stream
 */
export function streamChat(
  question: string,
  chatTabId: number | undefined,
  agentMode: boolean,
  context?: { type: 'collection' | 'workspace' | 'article' | 'text'; id?: number; text?: string } | undefined,
  options?: StreamChatOptions
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
      
      const response = await fetch(
        fullUrl,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            question,
            chat_tab_id: chatTabId,
            agent_mode: agentMode,
            context: context ? {
              type: context.type,
              id: context.id,
              text: context.text
            } : undefined,
          }),
          signal: abortController.signal,
        }
      );

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorText = await response.text();
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.detail || errorData.message || errorMessage;
          } catch {
            // If not JSON, use the text
            if (errorText) errorMessage = errorText;
          }
        } catch {
          // If we can't read response, use default message
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
                  if (options.onStart && event.message_id && event.chat_tab_id) {
                    options.onStart(
                      event.message_id,
                      event.chat_tab_id,
                      event.stream_id
                    );
                  }
                  break;

                case "chunk":
                  if (event.content) {
                    options.onChunk(event.content);
                  }
                  break;

                case "complete":
                  if (options.onComplete) {
                    options.onComplete();
                  }
                  return;

                case "stop":
                  if (options.onStop) {
                    options.onStop();
                  }
                  return;

                case "status":
                  if (options.onStatus && event.status) {
                    options.onStatus(event.status, event.step);
                  }
                  break;

                case "error":
                  if (options.onError) {
                    options.onError(event.error || "Unknown error");
                  }
                  return;
              }
            } catch (e) {
              console.error("Error parsing SSE event:", e);
            }
          }
        }
      }

      if (options.onComplete) {
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
        if (options.onStop) {
          options.onStop();
        }
      } else {
        if (options.onError) {
          options.onError(error.message || "Stream error");
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
export async function deleteChatTab(chatTabId: number): Promise<void> {
  await api.delete(routes.chat.delete(chatTabId));
}

/**
 * Clear all messages from a chat tab (but keep the tab)
 */
export async function clearChatTab(chatTabId: number): Promise<void> {
  await api.post(routes.chat.clear(chatTabId));
}

