import { ResourceTypeId, RESOURCE_TYPES } from "./resourceTypes";

export const DATA_CONTEXT_SLUGS = ["customer-context", "supplier-context", "process-context"] as const;
export type DataContextSlug = (typeof DATA_CONTEXT_SLUGS)[number];

export const DATA_CONTEXTS: { slug: DataContextSlug; title: string; shortDescription: string }[] = [
  {
    slug: "customer-context",
    title: "Customer Context",
    shortDescription: "Customer-related data resources",
  },
  {
    slug: "supplier-context",
    title: "Supplier Context",
    shortDescription: "Supplier and partner data resources",
  },
  {
    slug: "process-context",
    title: "Process Context",
    shortDescription: "Process and operations data resources",
  },
];

export function isDataContextSlug(s: string): s is DataContextSlug {
  return (DATA_CONTEXT_SLUGS as readonly string[]).includes(s);
}

export function isResourceTypeId(s: string): s is ResourceTypeId {
  return RESOURCE_TYPES.some((t) => t.id === s);
}

export function getDataContext(slug: string) {
  return DATA_CONTEXTS.find((c) => c.slug === slug);
}
