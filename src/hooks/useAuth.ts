"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuth"; // adjust path if needed
import { useQuery } from "@tanstack/react-query";
import { verifyToken } from "../api/auth";
import api from "../lib/axios";
import routes from "../lib/routes";
import {
  //  VerifyPayload,
  AuthResponse,
} from "../types/auth";

// ------------------
//  Types for Tenant
// ------------------
interface UserTenant {
  id: number;
  company_name: string;
  schema_name: string;
  role: string;
}

interface TenantsResponse {
  status: boolean;
  message: string;
  data: UserTenant[];
  pagination: null;
}

// ------------------
//  Custom Hooks
// ------------------

// ✅ Get token + setToken
export function useAuth() {
  const token = useAuthStore((s) => s.token);
  const setToken = useAuthStore((s) => s.setToken);
  return { token, setToken };
}

// ✅ Redirect user if not authenticated
export function useRequireAuth(redirectTo: string = "/signin") {
  const { token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.push(redirectTo);
    }
  }, [token, router, redirectTo]);

  return { token };
}

// export function useSignup() {
//   return; // placeholder to avoid TS error
// }

// ✅ Login helper (now uses API's `data.token` and fetches tenant)
export function useLogin() {
  const { setToken } = useAuth();
  const setTenantId = useAuthStore((s) => s.setTenantId);
  const router = useRouter();

  return async (token: string, redirectTo: string = "/dashboard") => {
    if (token) {
      setToken(token);

      // Fetch user's tenants and set the first one
      try {
        const { data } = await api.get<TenantsResponse>(routes.user.tenants);
        if (data.status && data.data && data.data.length > 0) {
          // Set the first tenant as default
          setTenantId(data.data[0].id);
          console.log("Tenant set:", data.data[0].id);
        } else {
          console.warn("No tenants found for user");
        }
      } catch (error) {
        console.error("Failed to fetch tenants:", error);
      }

      router.push(redirectTo);
      console.log("Login successful, token set.", redirectTo);
    } else {
      console.error("No token found in API response");
    }
  };
}

// ✅ Logout helper
export function useSignOut() {
  const clearToken = useAuthStore((s) => s.clearToken);
  const router = useRouter();

  return () => {
    clearToken();
    router.push("/signin");
  };
}

export function useVerifyToken() {
  const token = useAuthStore((s) => s.token);
  const clearToken = useAuthStore((s) => s.clearToken);

  return useQuery<AuthResponse, Error>({
    queryKey: ["verifyToken", token],
    queryFn: () => verifyToken({ token: token! as string }),
    enabled: !!token, // only run if token exists
    retry: false,
    throwOnError(error) {
      console.error("Token verification failed:", error.message);
      clearToken();
      return true; // re-throw to set isError
    },
  });
}

// ✅ Fetch user tenants
export function useUserTenants() {
  const token = useAuthStore((s) => s.token);

  return useQuery<UserTenant[], Error>({
    queryKey: ["userTenants"],
    queryFn: async () => {
      const { data } = await api.get<TenantsResponse>(routes.user.tenants);
      return data.data || [];
    },
    enabled: !!token, // only fetch if user is logged in
    retry: false,
  });
}
