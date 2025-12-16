"use client";

import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../store/useAuth";
import { signup } from "../api/auth";
import { AuthResponse, SignupPayload } from "../types/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useStartOnboarding } from "./useOnboarding";

export function useSignup() {
  const router = useRouter();
  const setToken = useAuthStore((state) => state.setToken);
  const setUserId = useAuthStore((state) => state.setUserId);
  const startOnboarding = useStartOnboarding();

  return useMutation<AuthResponse, Error, SignupPayload>({
    mutationFn: (payload) => {
      console.log("🚀 useSignup calling signup()", payload);
      return signup(payload);
    },
    onSuccess: (response) => {
      // Store token and user_id
      if (
        response.data &&
        typeof response.data === "object" &&
        "token" in response.data
      ) {
        const data = response.data as { token: string; user_id?: number };
        setToken(data.token);
        if (data.user_id) {
          setUserId(data.user_id);
        }
      }

      // Start onboarding tracking for new users
      startOnboarding();

      toast.success("Account created successfully! Redirecting...");
      router.push("/onboarding");
      console.log("Signup successful, redirecting to onboarding.");
    },
    onError: (error: unknown) => {
      console.error("Signup failed:", error);

      // Handle error response from API
      const axiosError = error as {
        response?: {
          data?: {
            detail?: string;
            message?: string;
          };
          status?: number;
        };
        message?: string;
      };

      // Extract error message
      let errorMessage = "Signup failed. Please try again.";

      if (axiosError.response?.data?.detail) {
        errorMessage = axiosError.response.data.detail;
      } else if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message;
      } else if (axiosError.message) {
        errorMessage = axiosError.message;
      }

      // Show error toast
      toast.error(errorMessage);
    },
  });
}
