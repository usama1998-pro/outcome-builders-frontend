"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuth"; // adjust path if needed
import { useQuery } from "@tanstack/react-query";
import { verifyToken } from "../api/auth";
import api from "../lib/axios";
import { clearClientCaches } from "../lib/queryClientBridge";
import routes from "../lib/routes";
import {
  //  VerifyPayload,
  AuthResponse,
} from "../types/auth";

// Time threshold in hours - don't redirect if last visit was more than this long ago
const ONBOARDING_EXPIRY_HOURS = 48;

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

// Helper function to get onboarding redirect path
function getOnboardingRedirectPath(): string | null {
  const storedOnboarding = localStorage.getItem("onboarding_state");
  
  if (!storedOnboarding) {
    return null;
  }

  try {
    const onboarding = JSON.parse(storedOnboarding);
    
    // If onboarding is complete, no redirect needed
    if (onboarding.isComplete) {
      return null;
    }

    // Check if last visit is within the expiry threshold
    if (onboarding.lastVisit) {
      const hoursSinceVisit = (Date.now() - onboarding.lastVisit) / (1000 * 60 * 60);
      if (hoursSinceVisit > ONBOARDING_EXPIRY_HOURS) {
        // Too old, don't redirect
        return null;
      }
    }

    // Return the last path or default to /onboarding
    return onboarding.lastPath || "/onboarding";
  } catch {
    return null;
  }
}

// ✅ Login helper (now uses API's `data.token` and fetches tenant)
export function useLogin() {
  const { setToken } = useAuth();
  const setUserId = useAuthStore((s) => s.setUserId);
  const setTenantId = useAuthStore((s) => s.setTenantId);
  const router = useRouter();

  return async (
    token: string,
    userId?: number,
    redirectTo: string = "/dashboard"
  ) => {
    if (token) {
      // Clear any cached data from previous user session
      clearClientCaches();
      
      setToken(token);

      // Set user_id if provided
      if (userId) {
        setUserId(userId);
      }

      // Fetch user's tenants and set the first one
      try {
        const { data } = await api.get<TenantsResponse>(routes.user.tenants);
        if (data.status && data.data && data.data.length > 0) {
          // Set the first tenant as default
          setTenantId(data.data[0].id);
        }
      } catch {
        // Tenant fetch failed - user may not have any tenants yet
      }

      // Check if user has incomplete onboarding
      const onboardingPath = getOnboardingRedirectPath();
      const finalRedirect = onboardingPath || redirectTo;

      router.push(finalRedirect);
    }
  };
}

// ✅ Logout helper
export function useSignOut() {
  const clearToken = useAuthStore((s) => s.clearToken);
  const router = useRouter();

  return () => {
    clearClientCaches();
    clearToken();
    router.push("/signin");
  };
}

export function useVerifyToken() {
  const token = useAuthStore((s) => s.token);
  const clearToken = useAuthStore((s) => s.clearToken);

  return useQuery<AuthResponse, Error>({
    queryKey: ["verifyToken", token],
    queryFn: () => verifyToken(),
    enabled: !!token, // only run if token exists
    retry: false,
    throwOnError() {
      clearClientCaches();
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
