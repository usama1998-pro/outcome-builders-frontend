import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios";
import routes from "../lib/routes";
import Notes from "../types/notes";


interface NoteApiItem {
    id: number;
    title: string;
    content: string;
    collection_id: number;
    created_at: string | null;
    created_by: number;
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


// ------------------ // Notes Fetch/Create/Delete // ------------------

async function fetchCollectionNotes(collectionId: number): Promise<Notes[]> {
    const { data } = await api.get<NotesApiResponse>(routes.notes.get, {
        params: { collection_id: collectionId }
    });
    // backend returns data.notes array
    return data.data.notes.map((n) => ({
        id: n.id,
        title: n.title,
        createdAt: n.created_at ?? "",
        createdBy: String(n.created_by),
    }));
}

async function createNote(payload: CreateNotePayload): Promise<CreateNoteResponse> {
    const { data } = await api.post<CreateNoteResponse>(routes.notes.create, payload);
    return data;
}

async function deleteNote(payload: DeleteNotePayload): Promise<{ status: boolean; message: string }> {
    const { data } = await api.delete(routes.notes.delete, {
        data: payload
    });
    return data;
}

// ------------------ // Hooks // ------------------ 

export function useCollectionNotes(collectionId: number) {
    const { data, isLoading, isError, error, refetch } = useQuery<Notes[], Error>({
        queryKey: ["collectionNotes", collectionId],
        queryFn: () => fetchCollectionNotes(collectionId),
        enabled: !!collectionId, // Only run query if collectionId is provided
    });

    return { data, isLoading, isError, error, refetch };
}


export function useCreateNote() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: createNote,
        onSuccess: (_, variables) => {
            // Invalidate and refetch notes for the specific collection after successful creation
            queryClient.invalidateQueries({ queryKey: ["collectionNotes", variables.collection_id] });
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
        },
    });
}

