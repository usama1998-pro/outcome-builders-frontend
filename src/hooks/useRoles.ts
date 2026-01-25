"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios";
import routes from "../lib/routes";
import { useAuthStore } from "../store/useAuth";

// Types
export interface Permission {
  key: string;
  name: string;
  category: string;
  description: string;
}

export interface CustomRole {
  id: number;
  name: string;
  description: string | null;
  permissions: string[];
  created_at: string | null;
}

interface CreateRolePayload {
  name: string;
  description?: string;
  permissions: string[];
}

interface UpdateRolePayload {
  name?: string;
  description?: string;
  permissions?: string[];
}

interface ApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

// Fetch available permissions
async function fetchPermissions(): Promise<Permission[]> {
  const { data } = await api.get<ApiResponse<Permission[]>>(routes.user.permissions);
  return data.data;
}

// Fetch custom roles for a tenant
async function fetchCustomRoles(tenantId: number): Promise<CustomRole[]> {
  const { data } = await api.get<ApiResponse<CustomRole[]>>(routes.user.customRoles(tenantId));
  return data.data;
}

// Create a custom role
async function createCustomRole(tenantId: number, payload: CreateRolePayload): Promise<CustomRole> {
  const { data } = await api.post<ApiResponse<CustomRole>>(routes.user.customRoles(tenantId), payload);
  return data.data;
}

// Update a custom role
async function updateCustomRole(tenantId: number, roleId: number, payload: UpdateRolePayload): Promise<CustomRole> {
  const { data } = await api.patch<ApiResponse<CustomRole>>(routes.user.customRole(tenantId, roleId), payload);
  return data.data;
}

// Delete a custom role
async function deleteCustomRole(tenantId: number, roleId: number): Promise<{ message: string }> {
  const { data } = await api.delete<ApiResponse<{ message: string }>>(routes.user.customRole(tenantId, roleId));
  return data.data;
}

// Hook: Get available permissions
export function usePermissions() {
  return useQuery<Permission[], Error>({
    queryKey: ["permissions"],
    queryFn: fetchPermissions,
    staleTime: 1000 * 60 * 30, // 30 minutes - permissions rarely change
  });
}

// Hook: Get custom roles for current tenant
export function useCustomRoles() {
  const tenantId = useAuthStore((state) => state.tenantId);
  const hydrated = useAuthStore((state) => state.hydrated);

  return useQuery<CustomRole[], Error>({
    queryKey: ["customRoles", tenantId],
    queryFn: () => fetchCustomRoles(tenantId!),
    enabled: !!tenantId && hydrated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook: Create custom role
export function useCreateCustomRole() {
  const queryClient = useQueryClient();
  const tenantId = useAuthStore((state) => state.tenantId);

  return useMutation({
    mutationFn: (payload: CreateRolePayload) => createCustomRole(tenantId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customRoles", tenantId] });
    },
  });
}

// Hook: Update custom role
export function useUpdateCustomRole() {
  const queryClient = useQueryClient();
  const tenantId = useAuthStore((state) => state.tenantId);

  return useMutation({
    mutationFn: ({ roleId, payload }: { roleId: number; payload: UpdateRolePayload }) =>
      updateCustomRole(tenantId!, roleId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customRoles", tenantId] });
    },
  });
}

// Hook: Delete custom role
export function useDeleteCustomRole() {
  const queryClient = useQueryClient();
  const tenantId = useAuthStore((state) => state.tenantId);

  return useMutation({
    mutationFn: (roleId: number) => deleteCustomRole(tenantId!, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customRoles", tenantId] });
    },
  });
}

// Group permissions by category
export function groupPermissionsByCategory(permissions: Permission[]): Record<string, Permission[]> {
  return permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);
}

