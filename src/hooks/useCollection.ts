import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios";
import routes from "../lib/routes";
import Collections from "../types/collections";
import { useAuthStore } from "../store/useAuth";


interface CollectionApiItem {
    id: number;
    name: string;
    description: string | null;
    visibility: string;
    owner_id: number;
    workspace_id: number;
    workspace_name: string;
    created_at: string | null;
}

interface CollectionApiResponse {
    status: boolean;
    message: string;
    data: {
        collections: CollectionApiItem[];
    };
    pagination: number | null;
}

interface CreateCollectionPayload {
    name: string;
    description?: string | null;
    visibility?: string;
    workspace_id: number;
}

interface UpdateCollectionPayload {
    name?: string;
    description?: string | null;
    visibility?: string;
}

interface CreateCollectionResponse {
    status: boolean;
    message: string;
    data: Record<string, unknown>;
    pagination: number | null;
}


// ------------------ // Collections Fetch/Create // ------------------
async function fetchUserCollections(): Promise<Collections[]> {
    const { data } = await api.get<CollectionApiResponse>(routes.collection.get.user);
    // backend returns data.collections array
    return data.data.collections.map((c) => ({
        id: c.id,
        title: c.name,
        createdAt: c.created_at ?? "",
        createdBy: String(c.owner_id),
        description: c.description ?? "",
        members: 0,
        avatarUrl: "/default-avatar.png",
        workspaceId: c.workspace_id,
        workspaceName: c.workspace_name,
        visibility: c.visibility,
    }));
}

async function createUserCollection(payload: CreateCollectionPayload): Promise<CreateCollectionResponse> {
    const { data } = await api.post<CreateCollectionResponse>(routes.collection.create, payload);
    return data;
}

// ------------------ // Hooks // ------------------ 

export function useUserCollections() {
    const tenantId = useAuthStore((state) => state.tenantId);
    const hydrated = useAuthStore((state) => state.hydrated);
    
    const { data, isLoading, isError, error, refetch } = useQuery<Collections[], Error>({
        queryKey: ["userCollections", tenantId],
        queryFn: fetchUserCollections,
        // Only run query if tenantId is available and store is hydrated
        enabled: !!tenantId && hydrated,
    });

    return { data, isLoading, isError, error, refetch };
}


export function useCreateUserCollection() {
    const queryClient = useQueryClient();
    const tenantId = useAuthStore((state) => state.tenantId);
    
    return useMutation({
        mutationFn: createUserCollection,
        onSuccess: () => {
            // Invalidate and refetch collections after successful creation
            // Include tenantId in the query key to ensure proper invalidation
            queryClient.invalidateQueries({ 
                queryKey: ["userCollections"],
                exact: false // Invalidate all queries starting with "userCollections"
            });
            // Also explicitly refetch to ensure data is fresh
            queryClient.refetchQueries({ 
                queryKey: ["userCollections", tenantId]
            });
        },
    });
}

async function deleteUserCollection(collectionId: number): Promise<{ status: boolean; message: string }> {
    const { data } = await api.delete(routes.collection.delete(collectionId));
    return data;
}

export function useDeleteUserCollection() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: deleteUserCollection,
        onSuccess: () => {
            // Invalidate and refetch collections after successful deletion
            queryClient.invalidateQueries({ queryKey: ["userCollections"] });
        },
    });
}

async function updateUserCollection(collectionId: number, payload: UpdateCollectionPayload): Promise<CreateCollectionResponse> {
    const { data } = await api.put<CreateCollectionResponse>(routes.collection.update(collectionId), payload);
    return data;
}

export function useUpdateUserCollection() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ collectionId, payload }: { collectionId: number; payload: UpdateCollectionPayload }) => 
            updateUserCollection(collectionId, payload),
        onSuccess: () => {
            // Invalidate and refetch collections after successful update
            queryClient.invalidateQueries({ queryKey: ["userCollections"] });
        },
    });
}