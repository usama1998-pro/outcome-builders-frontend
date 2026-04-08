"use client";

import { useQuery } from "@tanstack/react-query";
import api from "../lib/axios";
import routes from "../lib/routes";
import { useAuthStore } from "../store/useAuth";

export interface UserPermissions {
  role: string;
  permissions: string[];
  is_owner: boolean;
  is_admin: boolean;
  is_superuser?: boolean;
}

interface PermissionsApiResponse {
  status: boolean;
  message: string;
  data: UserPermissions;
}

async function fetchUserPermissions(tenantId: number): Promise<UserPermissions> {
  const { data } = await api.get<PermissionsApiResponse>(routes.user.myPermissions(tenantId));
  // Debug: Log the API response to see what we're getting
  console.log("=== Permissions API Response ===");
  console.log("Full Response:", data);
  console.log("Response Data:", data.data);
  console.log("Permissions Array:", data.data?.permissions);
  return data.data;
}

export function useUserPermissions() {
  const tenantId = useAuthStore((state) => state.tenantId);
  const userId = useAuthStore((state) => state.userId);
  const hydrated = useAuthStore((state) => state.hydrated);
  const storeIsSuperuser = useAuthStore((state) => state.isSuperuser);

  const queryEnabled = !!tenantId && !!userId && hydrated;

  const { data, isLoading: queryLoading, isError, error, refetch } = useQuery<UserPermissions, Error>({
    // Include userId in query key to prevent caching across different users
    queryKey: ["userPermissions", tenantId, userId],
    queryFn: () => fetchUserPermissions(tenantId!),
    enabled: queryEnabled,
    staleTime: 0, // No cache - always fetch fresh permissions to reflect role changes immediately
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Always refetch on mount
    gcTime: 0, // Don't keep in cache after unmount
  });

  // Consider loading if: store not hydrated, tenantId/userId not set, or query is fetching
  // This ensures we don't hide elements prematurely before permissions are loaded
  const isLoading = !hydrated || !tenantId || !userId || queryLoading;

  // Helper functions for checking permissions
  const isSuperuser = storeIsSuperuser || data?.is_superuser === true;

  const hasPermission = (permission: string): boolean => {
    if (isSuperuser) return true;
    if (!data) return false;
    return data.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (isSuperuser) return true;
    if (!data || !data.permissions || !Array.isArray(data.permissions)) return false;
    return permissions.some((p) => data.permissions.includes(p));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (isSuperuser) return true;
    if (!data) return false;
    return permissions.every((p) => data.permissions.includes(p));
  };

  const isOwner = data?.is_owner ?? false;
  const isAdmin = data?.is_admin ?? false;
  const isOwnerOrAdmin = isOwner || isAdmin || isSuperuser;

  return {
    data,
    isLoading,
    isError,
    error,
    role: data?.role ?? null,
    permissions: data?.permissions ?? [],
    isOwner,
    isAdmin,
    isSuperuser,
    isOwnerOrAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refetch, // Expose refetch function to manually refresh permissions
  };
}

// Permission constants for easy reference
export const PERMISSIONS = {
  // Brainspace
  BRAINSPACE_CREATE: "brainspace.create",
  BRAINSPACE_EDIT: "brainspace.edit",
  BRAINSPACE_DELETE: "brainspace.delete",
  BRAINSPACE_VIEW: "brainspace.view",
  // Collection
  COLLECTION_CREATE: "collection.create",
  COLLECTION_CREATE_PRIVATE: "collection.create.private",
  COLLECTION_EDIT: "collection.edit",
  COLLECTION_DELETE: "collection.delete",
  COLLECTION_VIEW: "collection.view",
  // Note
  NOTE_CREATE: "note.create",
  NOTE_EDIT: "note.edit",
  NOTE_DELETE: "note.delete",
  NOTE_VIEW: "note.view",
  NOTE_TRAIN: "note.train",
  // Administration
  ADMIN_MANAGE: "admin.manage",
  ROLE_MANAGE: "role.manage",
  USER_INVITE: "user.invite",
  ORGANIZATION_EDIT: "organization.edit",
  // Analytics
  ANALYTICS_VIEW: "analytics.view",
  // AI
  CHAT_ACCESS: "chat.access",
} as const;

