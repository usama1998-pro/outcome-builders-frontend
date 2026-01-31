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
}

interface PermissionsApiResponse {
  status: boolean;
  message: string;
  data: UserPermissions;
}

async function fetchUserPermissions(tenantId: number): Promise<UserPermissions> {
  const { data } = await api.get<PermissionsApiResponse>(routes.user.myPermissions(tenantId));
  return data.data;
}

export function useUserPermissions() {
  const tenantId = useAuthStore((state) => state.tenantId);
  const userId = useAuthStore((state) => state.userId);
  const hydrated = useAuthStore((state) => state.hydrated);

  const queryEnabled = !!tenantId && !!userId && hydrated;

  const { data, isLoading: queryLoading, isError, error } = useQuery<UserPermissions, Error>({
    // Include userId in query key to prevent caching across different users
    queryKey: ["userPermissions", tenantId, userId],
    queryFn: () => fetchUserPermissions(tenantId!),
    enabled: queryEnabled,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Consider loading if: store not hydrated, tenantId/userId not set, or query is fetching
  // This ensures we don't hide elements prematurely before permissions are loaded
  const isLoading = !hydrated || !tenantId || !userId || queryLoading;

  // Helper functions for checking permissions
  const hasPermission = (permission: string): boolean => {
    if (!data) return false;
    return data.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!data) return false;
    return permissions.some((p) => data.permissions.includes(p));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!data) return false;
    return permissions.every((p) => data.permissions.includes(p));
  };

  const isOwner = data?.is_owner ?? false;
  const isAdmin = data?.is_admin ?? false;
  const isOwnerOrAdmin = isOwner || isAdmin;

  return {
    data,
    isLoading,
    isError,
    error,
    role: data?.role ?? null,
    permissions: data?.permissions ?? [],
    isOwner,
    isAdmin,
    isOwnerOrAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
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

