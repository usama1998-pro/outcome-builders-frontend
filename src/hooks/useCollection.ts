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
    article_count?: number;
    notes_count?: number;
    members_count?: number;
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
async function fetchUserCollections(workspaceId?: number | null): Promise<Collections[]> {
    const params: Record<string, any> = {};
    // Only add workspace_id if it's a valid number (not null or undefined)
    if (workspaceId !== null && workspaceId !== undefined && workspaceId > 0) {
        params.workspace_id = workspaceId;
    }
    const { data } = await api.get<CollectionApiResponse>(routes.collection.get.user, { params });
    // backend returns data.collections array
    return data.data.collections.map((c) => ({
        id: c.id,
        title: c.name,
        createdAt: c.created_at ?? "",
        createdBy: String(c.owner_id),
        description: c.description ?? "",
        // Use article_count or notes_count from backend if available, otherwise default to 0
        members: c.article_count ?? c.notes_count ?? 0,
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

export function useUserCollections(workspaceId?: number | null) {
    const tenantId = useAuthStore((state) => state.tenantId);
    const hydrated = useAuthStore((state) => state.hydrated);
    
    const { data, isLoading, isError, error, refetch } = useQuery<Collections[], Error>({
        queryKey: ["userCollections", tenantId, workspaceId ?? null],
        queryFn: () => fetchUserCollections(workspaceId),
        // Only run query if tenantId is available and store is hydrated
        enabled: !!tenantId && !!hydrated,
        // Don't retry on errors to avoid spamming the API
        retry: false,
        // Return empty array as default instead of undefined to avoid issues
        placeholderData: [],
    });

    return { data: data ?? [], isLoading, isError, error, refetch };
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

// ------------------ // Collection Members // ------------------

interface CollectionMember {
    id: number;
    user_id: number;
    email: string;
    full_name: string | null;
    role: string;
}

interface TenantUser {
    id: number;
    email: string;
    full_name: string | null;
    role: string | null;
}

interface AddMemberPayload {
    user_id: number;
    role?: string;
}

async function getCollectionMembers(collectionId: number): Promise<CollectionMember[]> {
    const { data } = await api.get<{ status: boolean; message: string; data: { members: CollectionMember[] } }>(
        routes.collection.members(collectionId)
    );
    return data.data.members;
}

async function getTenantUsers(): Promise<TenantUser[]> {
    const { data } = await api.get<{ status: boolean; message: string; data: { users: TenantUser[] } }>(
        routes.collection.get.users
    );
    return data.data.users;
}

async function addCollectionMember(collectionId: number, payload: AddMemberPayload): Promise<{ status: boolean; message: string }> {
    const { data } = await api.post(routes.collection.addMember(collectionId), payload);
    return data;
}

async function removeCollectionMember(collectionId: number, userId: number): Promise<{ status: boolean; message: string }> {
    const { data } = await api.delete(routes.collection.removeMember(collectionId, userId));
    return data;
}

export function useCollectionMembers(collectionId: number) {
    return useQuery<CollectionMember[], Error>({
        queryKey: ["collectionMembers", collectionId],
        queryFn: () => getCollectionMembers(collectionId),
        enabled: !!collectionId,
    });
}

export function useTenantUsers() {
    return useQuery<TenantUser[], Error>({
        queryKey: ["tenantUsers"],
        queryFn: getTenantUsers,
    });
}

export function useAddCollectionMember() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ collectionId, payload }: { collectionId: number; payload: AddMemberPayload }) =>
            addCollectionMember(collectionId, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["collectionMembers", variables.collectionId] });
        },
    });
}

export function useRemoveCollectionMember() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ collectionId, userId }: { collectionId: number; userId: number }) =>
            removeCollectionMember(collectionId, userId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["collectionMembers", variables.collectionId] });
        },
    });
}