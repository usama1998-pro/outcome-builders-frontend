// "use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios";
import routes from "../lib/routes";
import { WorkSpaceList } from "../types/workspaces";
import { useAuthStore } from "../store/useAuth";
// import { 
//     // ToastContainer, 
//     toast 
// } from 'react-toastify';

interface WorkspaceResponse { 
    status: boolean;
    message: string; 
    data: { 
        id: number; 
        role: string; 
        is_active: boolean; 
        joined_at: string; 
        workspace: { 
            id: number; 
            uuid?: string | null;
            name: string; 
            members_count: number;
            tenant_id: number;
            tenant: {
                id: number;
                company_name: string;
            } | null;
        }; 
    }[]; 
    pagination: number | null; 
} 

interface CreateWorkspaceResponse { 
    status: boolean;
    message: string; 
    data: Map<string, any>; 
    pagination: number | null; 
} 

// ------------------ // Fetch Function // ------------------ 
async function fetchUserWorkspaces(): Promise<WorkSpaceList[]> { 
    const { data } = await api.get<WorkspaceResponse>(routes.workspace.get.user); 
    // Map backend → WorkSpaceList 
    return data.data.map((item) => ({ 
        id: item.workspace.id, 
        uuid: item.workspace.uuid ?? null,
        title: item.workspace.name,
        createdAt: item.joined_at, 
        createdBy: item.role, 
        description: `Workspace owned by ${item.role}`, 
        members: item.workspace.members_count, 
        avatarUrl: "/default-avatar.png",
        tenantId: item.workspace.tenant_id,
        tenant: item.workspace.tenant || { id: item.workspace.tenant_id, company_name: "Unknown" },
    })); 
}

    
async function createUserWorkspace(name: string): Promise<CreateWorkspaceResponse> { 
    const { data } = await api.post<CreateWorkspaceResponse>(routes.workspace.create, {name: name}); 
    // Map backend → WorkSpaceList
    return data;
}

// ------------------ // Hook // ------------------ 
export function useUserWorkspaces() { 
    const hydrated = useAuthStore((state) => state.hydrated);
    const userId = useAuthStore((state) => state.userId);
    
    const { data, isLoading, isError, error, } = useQuery<WorkSpaceList[], Error>({ 
        queryKey: ["userWorkspaces"], 
        queryFn: fetchUserWorkspaces,
        enabled: hydrated && !!userId,
    }); 
    
    return { data, isLoading, isError, error };
}


export function useCreateUserWorkspace() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createUserWorkspace,
    onSuccess: () => {
      // Invalidate and refetch workspaces after successful creation
      queryClient.invalidateQueries({ queryKey: ["userWorkspaces"] });
    },
  });
}

async function deleteUserWorkspace(workspaceId: number): Promise<{ status: boolean; message: string }> {
  const { data } = await api.delete(routes.workspace.delete(workspaceId));
  return data;
}

export function useDeleteUserWorkspace() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteUserWorkspace,
    onSuccess: () => {
      // Invalidate and refetch workspaces after successful deletion
      queryClient.invalidateQueries({ queryKey: ["userWorkspaces"] });
    },
  });
}


// ============ Workspace Assignments ============

interface TenantWorkspace {
  id: number;
  name: string;
  tenant_id: number;
}

interface TenantWorkspacesResponse {
  status: boolean;
  message: string;
  data: { message: TenantWorkspace[] };
}

interface WorkspaceAssignment {
  workspace_id: number;
  workspace_name: string;
  role: string;
  joined_at: string | null;
}

interface WorkspaceAssignmentsResponse {
  status: boolean;
  message: string;
  data: WorkspaceAssignment[];
}

// Fetch all workspaces in a tenant (for admins to select from)
async function fetchTenantWorkspaces(tenantId: number): Promise<TenantWorkspace[]> {
  const { data } = await api.get<TenantWorkspacesResponse>(routes.workspace.get.tenant, {
    headers: { "X-Tenant": tenantId.toString() }
  });
  return data.data.message;
}

export function useTenantWorkspaces(tenantId: number | null) {
  return useQuery<TenantWorkspace[], Error>({
    queryKey: ["tenantWorkspaces", tenantId],
    queryFn: () => fetchTenantWorkspaces(tenantId!),
    enabled: !!tenantId,
  });
}

// Fetch workspace assignments for a specific user
async function fetchUserWorkspaceAssignments(tenantId: number, userId: number): Promise<WorkspaceAssignment[]> {
  const { data } = await api.get<WorkspaceAssignmentsResponse>(routes.workspace.assignments(tenantId, userId));
  return data.data;
}

export function useUserWorkspaceAssignments(tenantId: number | null, userId: number | null) {
  return useQuery<WorkspaceAssignment[], Error>({
    queryKey: ["workspaceAssignments", tenantId, userId],
    queryFn: () => fetchUserWorkspaceAssignments(tenantId!, userId!),
    enabled: !!tenantId && !!userId,
  });
}

// Update workspace assignments for a user
interface UpdateAssignmentsPayload {
  user_id: number;
  workspace_ids: number[];
}

async function updateWorkspaceAssignments(tenantId: number, payload: UpdateAssignmentsPayload): Promise<{ message: string }> {
  const { data } = await api.put(routes.workspace.updateAssignments(tenantId), payload);
  return data.data;
}

export function useUpdateWorkspaceAssignments() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ tenantId, payload }: { tenantId: number; payload: UpdateAssignmentsPayload }) => 
      updateWorkspaceAssignments(tenantId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workspaceAssignments", variables.tenantId, variables.payload.user_id] });
      queryClient.invalidateQueries({ queryKey: ["userWorkspaces"] });
    },
  });
}

// Assign workspaces from invitation (self-assignment)
async function assignWorkspacesFromInvitation(payload: UpdateAssignmentsPayload): Promise<{ message: string; workspace_ids: number[] }> {
  const { data } = await api.post(routes.workspace.assignFromInvitation, payload);
  return data.data;
}

export function useAssignWorkspacesFromInvitation() {
  const queryClient = useQueryClient();
  const tenantId = useAuthStore((s) => s.tenantId);
  
  return useMutation({
    mutationFn: (payload: UpdateAssignmentsPayload) => {
      if (!tenantId) {
        throw new Error("Tenant ID is required to assign workspaces. Please ensure you're part of an organization.");
      }
      return assignWorkspacesFromInvitation(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userWorkspaces"] });
      queryClient.invalidateQueries({ queryKey: ["workspaceAssignments"] });
    },
  });
}

// Join workspace with token
interface JoinWorkspaceWithTokenPayload {
  joining_token: string;
}

async function joinWorkspaceWithToken(payload: JoinWorkspaceWithTokenPayload): Promise<{ message: string; workspace_id: number; workspace_name: string }> {
  const { data } = await api.post(routes.workspace.joinWithToken, payload);
  return data.data;
}

export function useJoinWorkspaceWithToken() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: joinWorkspaceWithToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userWorkspaces"] });
      queryClient.invalidateQueries({ queryKey: ["workspaceAssignments"] });
    },
  });
}