/**
 * Chat model options for the model selector.
 * Slugs match backend ALLOWED_CHAT_MODELS; "auto" triggers per-request model selection.
 */
export const CHAT_MODEL_CATEGORIES = ["AUTO", "ANTHROPIC"] as const;

export interface ChatModelOption {
  slug: string;
  label: string;
  category: (typeof CHAT_MODEL_CATEGORIES)[number];
  description?: string;
}

export const CHAT_MODEL_OPTIONS: ChatModelOption[] = [
  { slug: "auto", label: "Auto", category: "AUTO", description: "System picks a model per message to balance cost and quality." },
  { slug: "default", label: "Default", category: "AUTO", description: "Use the default model (Claude Sonnet) for every message." },
  { slug: "claude-haiku-4-5", label: "Claude Haiku 4.5", category: "ANTHROPIC" },
  { slug: "claude-sonnet-4-5", label: "Claude Sonnet 4.5", category: "ANTHROPIC" },
  { slug: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", category: "ANTHROPIC" },
  { slug: "claude-opus-4-6", label: "Claude Opus 4.6", category: "ANTHROPIC" },
];

export function getModelDisplayLabel(slug: string): string {
  const opt = CHAT_MODEL_OPTIONS.find((o) => o.slug === slug);
  return opt?.label ?? slug;
}
