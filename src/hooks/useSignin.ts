"use client";

import { useMutation } from "@tanstack/react-query";
// import { useAuthStore } from "../store/useAuth";
import { signin } from "../api/auth";
import { AuthResponse, SignupPayload } from "../types/auth";
import { useLogin } from "../hooks/useAuth";
import { toast } from "sonner";
// import { da } from "zod/v4/locales";

export function useSignin() {
  // const { setToken } = useAuthStore();
  const login = useLogin();

  return useMutation<AuthResponse, Error, SignupPayload>({
    mutationFn: signin,
    onSuccess: async (data) => {
      if (!data?.data) {
        toast.error("Sign in failed. No data received from server.");
        return;
      }

      const tokenData = data?.data as
        | { token: string; user_id?: number }
        | undefined;
      if (tokenData && tokenData.token) {
        toast.success("Sign in successful! Redirecting...");
        await login(tokenData.token, tokenData.user_id);
      } else {
        toast.error("Sign in failed. No token received from server.");
      }
    },
    onError: (error: unknown) => {
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
      let errorMessage = "Invalid credentials. Please try again.";

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
