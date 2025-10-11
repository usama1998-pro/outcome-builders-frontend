"use client";

import { useQuery } from "@tanstack/react-query";
import api from "../lib/axios";
import routes from "../lib/routes";
import { WorkSpaceList } from "../types/workspaces";

interface UserProfile { 
    status: boolean;
    message: string; 
    data: { 
        id: 1,
        email: string,
        full_name: string,
        description: string,
        created_at: string
    }; 
    pagination: number | null; 
} 

// ------------------ // Fetch Function // ------------------ 
async function fetchUserProfile(): Promise<WorkSpaceList[]> { 
    const { data } = await api.get<WorkspaceResponse>(routes.workspace.get.user); 
    // Map backend → WorkSpaceList 
    return data.data.map((item) => ({ 
        id: item.workspace.id, 
        title: item.workspace.name,
        createdAt: item.joined_at, 
        createdBy: item.role, 
        description: `Workspace owned by ${item.role}`, 
        members: item.workspace.members_count, avatarUrl: "/default-avatar.png", 
        // placeholder (update if backend returns one) 
    })); }
    
// ------------------ // Hook // ------------------ 
export function useUserProfile() { 
    const { data, isLoading, isError, error, } = useQuery<WorkSpaceList[], Error>({ 
        queryKey: ["userUserProfile"], 
        queryFn: fetchUserWorkspaces, 
    }); 
    
    return { data, isLoading, isError, error };
}