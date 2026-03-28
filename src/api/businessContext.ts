import api from "../lib/axios";
import routes from "../lib/routes";
import { DataContextSlug } from "../app/dashboard/data-sources/_components/dataContextConfig";
import { ResourceTypeId, RESOURCE_TYPES } from "../app/dashboard/data-sources/_components/resourceTypes";

type MediaResourceType = Exclude<ResourceTypeId, "notes">;

export async function createBusinessContextNote(payload: {
  title: string;
  description?: string;
  content: string;
  context_slug: DataContextSlug;
}) {
  const { data } = await api.post(routes.businessContext.createNote, payload);
  return data?.data;
}

export async function createBusinessContextMediaSource(payload: {
  title: string;
  description?: string;
  context_slug: DataContextSlug;
  resource_type: MediaResourceType;
  source_url?: string;
  text_content?: string;
  file?: File;
}) {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("context_slug", payload.context_slug);
  formData.append("resource_type", payload.resource_type);
  if (payload.description) formData.append("description", payload.description);
  if (payload.source_url) formData.append("source_url", payload.source_url);
  if (payload.text_content) formData.append("text_content", payload.text_content);
  if (payload.file) formData.append("file", payload.file);

  const { data } = await api.post(routes.businessContext.createMediaSource, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data?.data;
}

export type BusinessContextNoteListItem = {
  id: number;
  uuid: string;
  title: string;
  description?: string | null;
  context_slug: string;
  created_at: string | null;
};

export type BusinessContextMediaListItem = {
  id: number;
  uuid: string;
  title: string;
  description?: string | null;
  context_slug: string;
  resource_type: string;
  source_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  file_type?: string | null;
  /** Populated for audio uploads when duration is detected server-side. */
  duration_seconds?: number | null;
  created_at: string | null;
};

export type PaginatedList<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
};

export async function listBusinessContextNotes(
  context_slug: DataContextSlug,
  opts?: { q?: string; page?: number; page_size?: number },
): Promise<PaginatedList<BusinessContextNoteListItem>> {
  const params: Record<string, string | number> = { context_slug };
  const q = opts?.q?.trim();
  if (q) params.q = q;
  params.page = opts?.page ?? 1;
  params.page_size = opts?.page_size ?? 20;
  const { data } = await api.get<{
    data: {
      items: BusinessContextNoteListItem[];
      total: number;
      page: number;
      page_size: number;
    };
  }>(routes.businessContext.listNotes, { params });
  const d = data?.data;
  return {
    items: d?.items ?? [],
    total: d?.total ?? 0,
    page: d?.page ?? 1,
    page_size: d?.page_size ?? 20,
  };
}

export async function listBusinessContextMediaSources(
  context_slug: DataContextSlug,
  resource_type: MediaResourceType,
  opts?: {
    q?: string;
    page?: number;
    page_size?: number;
    kind?: string;
    audio_type?: string;
  },
): Promise<PaginatedList<BusinessContextMediaListItem>> {
  const params: Record<string, string | number> = { context_slug, resource_type };
  const q = opts?.q?.trim();
  if (q) params.q = q;
  params.page = opts?.page ?? 1;
  params.page_size = opts?.page_size ?? 20;
  const kind = opts?.kind?.trim();
  if (kind && kind !== "all") params.kind = kind;
  const audioType = opts?.audio_type?.trim();
  if (audioType && audioType !== "all") params.audio_type = audioType;
  const { data } = await api.get<{
    data: {
      items: BusinessContextMediaListItem[];
      total: number;
      page: number;
      page_size: number;
    };
  }>(routes.businessContext.listMediaSources, { params });
  const d = data?.data;
  return {
    items: d?.items ?? [],
    total: d?.total ?? 0,
    page: d?.page ?? 1,
    page_size: d?.page_size ?? 20,
  };
}

export async function updateBusinessContextNoteTitle(noteId: number, payload: { title: string }) {
  const { data } = await api.patch(routes.businessContext.updateNote(noteId), payload);
  return data?.data;
}

export async function updateBusinessContextMediaSourceTitle(mediaId: number, payload: { title: string }) {
  const { data } = await api.patch(routes.businessContext.updateMediaSource(mediaId), payload);
  return data?.data;
}

export async function trainBusinessContextNote(noteId: number) {
  const { data } = await api.post(routes.businessContext.trainNote(noteId));
  return data?.data;
}

export async function trainBusinessContextMediaSource(mediaId: number) {
  const { data } = await api.post(routes.businessContext.trainMediaSource(mediaId));
  return data?.data;
}

export async function deleteBusinessContextNote(noteId: number) {
  await api.delete(routes.businessContext.deleteNote(noteId));
}

export async function deleteBusinessContextNotesBulk(noteIds: number[]) {
  const ids = Array.from(new Set(noteIds)).filter((id) => Number.isFinite(id) && id > 0);
  const { data } = await api.delete<{ data?: { removed_ids?: number[]; removed_count?: number } }>(
    routes.businessContext.deleteNotesBulk,
    { data: { note_ids: ids } },
  );
  return data?.data;
}

export async function deleteBusinessContextMediaSource(mediaId: number) {
  await api.delete(routes.businessContext.deleteMediaSource(mediaId));
}

export async function deleteBusinessContextMediaSourcesBulk(mediaIds: number[]) {
  const ids = Array.from(new Set(mediaIds)).filter((id) => Number.isFinite(id) && id > 0);
  const { data } = await api.delete<{ data?: { removed_ids?: number[]; removed_count?: number } }>(
    routes.businessContext.deleteMediaSourcesBulk,
    { data: { media_ids: ids } },
  );
  return data?.data;
}

/** One lightweight request per resource type; uses each list endpoint’s `total`. */
export async function fetchContextResourceCounts(
  context_slug: DataContextSlug,
): Promise<Record<ResourceTypeId, number>> {
  const entries = await Promise.all(
    RESOURCE_TYPES.map(async ({ id }) => {
      if (id === "notes") {
        const r = await listBusinessContextNotes(context_slug, { page: 1, page_size: 1 });
        return [id, r.total] as const;
      }
      const r = await listBusinessContextMediaSources(context_slug, id, {
        page: 1,
        page_size: 1,
      });
      return [id, r.total] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<ResourceTypeId, number>;
}
