// "use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios";
import routes from "../lib/routes";
import { WorkSpaceList } from "../types/workspaces";
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
    const { data, isLoading, isError, error, } = useQuery<WorkSpaceList[], Error>({ 
        queryKey: ["userWorkspaces"], 
        queryFn: fetchUserWorkspaces, 
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