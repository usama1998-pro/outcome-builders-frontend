import { ResourceTypeId, RESOURCE_TYPES } from "./resourceTypes";

export const DATA_CONTEXT_SLUGS = [
  "company-context",
  "customer-context",
  "competitor-context",
  "supplier-context",
  "category-context",
] as const;
export type DataContextSlug = (typeof DATA_CONTEXT_SLUGS)[number];

export const DATA_CONTEXTS: {
  slug: DataContextSlug;
  title: string;
  shortDescription: string;
}[] = [
  {
    slug: "company-context",
    title: "Company Context",
    shortDescription: "Company-level internal data resources",
  },
  {
    slug: "customer-context",
    title: "Customer Context",
    shortDescription: "Customer-related data resources",
  },
  {
    slug: "competitor-context",
    title: "Competitor Context",
    shortDescription: "Competitor and market intelligence data resources",
  },
  {
    slug: "supplier-context",
    title: "Supplier Context",
    shortDescription: "Supplier and partner data resources",
  },
  {
    slug: "category-context",
    title: "Category Context",
    shortDescription: "Categorized business data resources",
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
