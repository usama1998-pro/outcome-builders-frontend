"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuth"; // adjust path if needed
import { useQuery } from "@tanstack/react-query";
import { verifyToken } from "../api/auth";
import { 
//  VerifyPayload, 
  AuthResponse 
} from "../types/auth";
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

// ✅ Login helper (now uses API's `data.token`)
export function useLogin() {
  const { setToken } = useAuth();
  const router = useRouter();

  return (token: string , redirectTo: string = "/dashboard") => {
    if (token) {
      setToken(token);
      router.push(redirectTo);
      console.log("Login successful, token set.", redirectTo);
    } else {
      console.error("No token found in API response");
    }
  };
}

// ✅ Logout helper
export function useSignOut() {
  const { setToken } = useAuth();
  const router = useRouter();

  return () => {
    setToken("");
    router.push("/signin");
  };
}

export function useVerifyToken() {
  const token = useAuthStore((s) => s.token);
  const clearToken = useAuthStore((s) => s.clearToken);

  return useQuery<AuthResponse, Error>({
    queryKey: ["verifyToken", token],
    queryFn: () => verifyToken({token: token! as string}),
    enabled: !!token, // only run if token exists
    retry: false,
    throwOnError(error) {
        console.error("Token verification failed:", error.message);
        clearToken();
        return true; // re-throw to set isError
    },
  });
}