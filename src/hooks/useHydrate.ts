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
