"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/useAuth";

export function useAuth() {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const setToken = useAuthStore((s) => s.setToken);
  const clearToken = useAuthStore((s) => s.clearToken);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Listen for storage changes to sync auth state across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "access_token" || e.key === "user_id" || e.key === "tenant_id") {
        // Re-hydrate when auth-related storage changes
        hydrate();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [hydrate]);

  return { token, setToken, clearToken, hydrated };
}

export function useRequireAuth(redirectTo: string = "/signin") {
  const { token, hydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !token) {
      router.push(redirectTo);
    }
  }, [hydrated, token, router, redirectTo]);

  return { token, hydrated };
}
