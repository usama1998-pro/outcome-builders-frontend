import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios";
import routes from "../lib/routes";
import Notes from "../types/notes";
import { useAuthStore } from "../store/useAuth";

interface NoteApiItem {
  id: number;
  title: string;
  content: string;
  collection_id: number;
  created_at: string | null;
  created_by: number;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  has_file: boolean;
  is_trained: boolean;
  is_pinned: boolean;
  visibility?: "private" | "public" | "shared";
  user_id?: number;
  is_owner?: boolean;
}

interface NotesApiResponse {
  status: boolean;
  message: string;
  data: {
    notes: NoteApiItem[];
  };
  pagination: number | null;
}

interface CreateNotePayload {
  title: string;
  content: string;
  collection_id: number;
  visibility?: "private" | "public" | "shared";
  file?: File | null;
}

interface CreateNoteResponse {
  status: boolean;
  message: string;
  data: Record<string, unknown>;
  pagination: number | null;
}

interface DeleteNotePayload {
  note_id: number;
}

interface UpdateNotePayload {
  note_id: number;
  title: string;
  content: string;
  visibility?: "private" | "public" | "shared";
  file?: File | null;
}

interface SingleNoteApiItem {
  id: number;
  title: string;
  content: string;
  collection_id: number;
  user_id: number;
  created_at: string | null;
  is_pinned: boolean;
  is_trained: boolean;
  visibility?: "private" | "public" | "shared";
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  has_file: boolean;
  is_owner: boolean;
  shared_members?: Array<{
    id: number;
    user_id: number;
    note_id: number;
    role: string;
    user_email?: string;
    user_name?: string;
  }>;
}

interface SingleNoteResponse {
  status: boolean;
  message: string;
  data: {
    note: SingleNoteApiItem;
  };
}

// ------------------ // Notes Fetch/Create/Delete // ------------------

async function fetchCollectionNotes(collectionId: number): Promise<Notes[]> {
  const { data } = await api.get<NotesApiResponse>(routes.notes.get, {
    params: { collection_id: collectionId },
  });
  // backend returns data.notes array
  return data.data.notes.map((n) => ({
    id: n.id,
    title: n.title,
    createdAt: n.created_at ?? "",
    createdBy: String(n.created_by || n.user_id || ""),
    fileName: n.file_name,
    fileSize: n.file_size,
    fileType: n.file_type,
    hasFile: n.has_file,
    is_trained: n.is_trained,
    is_pinned: n.is_pinned,
    visibility: n.visibility,
    user_id: n.user_id,
    is_owner: n.is_owner,
  }));
}

async function createNote(
  payload: CreateNotePayload
): Promise<CreateNoteResponse> {
  // Use FormData for file upload support
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("content", payload.content);
  formData.append("collection_id", String(payload.collection_id));
  formData.append("visibility", payload.visibility || "private");

  if (payload.file) {
    formData.append("file", payload.file);
  }

  const { data } = await api.post<CreateNoteResponse>(
    routes.notes.create,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return data;
}

async function fetchNoteById(noteId: number): Promise<SingleNoteApiItem> {
  const { data } = await api.get<SingleNoteResponse>(
    routes.notes.getById(noteId)
  );
  return data.data.note;
}

async function updateNote(
  payload: UpdateNotePayload
): Promise<CreateNoteResponse> {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("content", payload.content);

  if (payload.visibility) {
    formData.append("visibility", payload.visibility);
  }

  if (payload.file) {
    formData.append("file", payload.file);
  }

  const { data } = await api.patch<CreateNoteResponse>(
    routes.notes.update(payload.note_id),
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return data;
}

async function deleteNote(
  payload: DeleteNotePayload
): Promise<{ status: boolean; message: string }> {
  const { data } = await api.delete(routes.notes.delete(payload.note_id));
  return data;
}

// ------------------ // Hooks // ------------------

export function useCollectionNotes(collectionId: number) {
  const tenantId = useAuthStore((state) => state.tenantId);
  const hydrated = useAuthStore((state) => state.hydrated);

  const { data, isLoading, isError, error, refetch } = useQuery<Notes[], Error>(
    {
      queryKey: ["collectionNotes", collectionId, tenantId],
      queryFn: () => fetchCollectionNotes(collectionId),
      // Only run query if collectionId AND tenantId are available and store is hydrated
      enabled: !!collectionId && !!tenantId && hydrated,
    }
  );

  return { data, isLoading, isError, error, refetch };
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createNote,
    onSuccess: (_, variables) => {
      // Invalidate and refetch notes for the specific collection after successful creation
      queryClient.invalidateQueries({
        queryKey: ["collectionNotes", variables.collection_id],
      });
      // Also invalidate and refetch all collectionNotes queries to update article count in side menu
      queryClient.invalidateQueries({
        queryKey: ["collectionNotes"],
      });
      // Force refetch all collectionNotes queries to ensure side menu updates immediately
      queryClient.refetchQueries({
        queryKey: ["collectionNotes"],
      });
      // Also invalidate collections to update article count
      queryClient.invalidateQueries({
        queryKey: ["userCollections"],
      });
    },
  });
}

export function useNote(noteId: number | null | undefined) {
  const tenantId = useAuthStore((state) => state.tenantId);
  const hydrated = useAuthStore((state) => state.hydrated);

  // Ensure noteId is a valid number (not NaN, null, or undefined)
  const validNoteId = noteId != null && !isNaN(noteId) ? noteId : null;

  const isEnabled = !!validNoteId && !!tenantId && hydrated;

  // Debug logging
  console.log(
    "[useNote] noteId:",
    noteId,
    "validNoteId:",
    validNoteId,
    "tenantId:",
    tenantId,
    "hydrated:",
    hydrated,
    "enabled:",
    isEnabled
  );

  const queryResult = useQuery<SingleNoteApiItem, Error>({
    queryKey: ["note", validNoteId, tenantId],
    queryFn: () => fetchNoteById(validNoteId!),
    enabled: isEnabled,
    // Ensure fresh data on every mount
    staleTime: 0,
    refetchOnMount: true,
  });

  return {
    data: queryResult.data,
    isLoading: queryResult.isLoading || !hydrated, // Consider loading while not hydrated
    isError: queryResult.isError,
    error: queryResult.error,
    refetch: queryResult.refetch,
    isFetching: queryResult.isFetching,
    isEnabled, // Expose this for debugging
  };
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateNote,
    onSuccess: (_, variables) => {
      // Invalidate the specific note and collection notes
      queryClient.invalidateQueries({ queryKey: ["note", variables.note_id] });
      queryClient.invalidateQueries({ queryKey: ["collectionNotes"] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      // Invalidate all collection notes queries after successful deletion
      queryClient.invalidateQueries({ queryKey: ["collectionNotes"] });
      // Force refetch all collectionNotes queries to ensure side menu updates immediately
      queryClient.refetchQueries({ queryKey: ["collectionNotes"] });
      // Also invalidate collections to update article count
      queryClient.invalidateQueries({ queryKey: ["userCollections"] });
    },
  });
}

interface TrainNoteResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    is_trained: boolean;
    message: string;
  };
}

async function toggleTrainNote(noteId: number): Promise<TrainNoteResponse> {
  const { data } = await api.post<TrainNoteResponse>(routes.notes.train(noteId));
  return data;
}

export function useToggleTrainNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleTrainNote,
    onSuccess: (_, noteId) => {
      // Invalidate the specific note and collection notes
      queryClient.invalidateQueries({ queryKey: ["note", noteId] });
      queryClient.invalidateQueries({ queryKey: ["collectionNotes"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

interface ShareNotePayload {
  user_ids?: number[];
  collection_ids?: number[];
}

interface ShareNoteResponse {
  status: boolean;
  message: string;
  data: {
    message: string;
    shared_members: Array<{
      id: number;
      user_id: number;
      note_id: number;
      role: string;
      user_email?: string;
      user_name?: string;
    }>;
  };
}

async function shareNote(
  noteId: number,
  payload: ShareNotePayload
): Promise<ShareNoteResponse> {
  const { data } = await api.post<ShareNoteResponse>(
    routes.notes.share(noteId),
    payload
  );
  return data;
}

async function unshareNote(
  noteId: number,
  userId?: number
): Promise<{ status: boolean; message: string }> {
  const params = userId ? { user_id: userId } : {};
  const { data } = await api.delete(routes.notes.unshare(noteId), {
    params,
  });
  return data;
}

export function useShareNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId, payload }: { noteId: number; payload: ShareNotePayload }) =>
      shareNote(noteId, payload),
    onSuccess: (_, variables) => {
      // Invalidate the specific note and collection notes
      queryClient.invalidateQueries({ queryKey: ["note", variables.noteId] });
      queryClient.invalidateQueries({ queryKey: ["collectionNotes"] });
    },
  });
}

export function useUnshareNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId, userId }: { noteId: number; userId?: number }) =>
      unshareNote(noteId, userId),
    onSuccess: (_, variables) => {
      // Invalidate the specific note and collection notes
      queryClient.invalidateQueries({ queryKey: ["note", variables.noteId] });
      queryClient.invalidateQueries({ queryKey: ["collectionNotes"] });
    },
  });
}

// ------------------ // Move Note // ------------------

interface MoveNotePayload {
  collection_id: number;
}

interface MoveNoteResponse {
  status: boolean;
  message: string;
  data: {
    message: string;
    note: {
      id: number;
      title: string;
      collection_id: number;
    };
  };
}

async function moveNote(
  noteId: number,
  payload: MoveNotePayload
): Promise<MoveNoteResponse> {
  const { data } = await api.post<MoveNoteResponse>(
    routes.notes.move(noteId),
    payload
  );
  return data;
}

export function useMoveNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId, payload }: { noteId: number; payload: MoveNotePayload }) =>
      moveNote(noteId, payload),
    onSuccess: (_, variables) => {
      // Invalidate the specific note and all collection notes
      queryClient.invalidateQueries({ queryKey: ["note", variables.noteId] });
      queryClient.invalidateQueries({ queryKey: ["collectionNotes"] });
    },
  });
}