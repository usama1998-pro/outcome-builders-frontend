"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { signin } from "../api/auth";
import { AuthResponse, SignupPayload } from "../types/auth";
import { useLogin } from "../hooks/useAuth";
import { toast } from "sonner";

interface SigninResponseData {
  token?: string | null;
  user_id?: number;
  email?: string;
  requires_2fa?: boolean;
  can_resend_in?: number;
  message?: string;
}

export function useSignin() {
  const login = useLogin();
  const router = useRouter();

  return useMutation<AuthResponse, Error, SignupPayload>({
    mutationFn: signin,
    onSuccess: async (data) => {
      if (!data?.data) {
        toast.error("Sign in failed. No data received from server.");
        return;
      }

      const responseData = data.data as SigninResponseData;

      // Check if 2FA is required
      if (responseData.requires_2fa) {
        toast.info("Verification code sent to your email.");
        // Redirect to 2FA verification page
        const cooldown = responseData.can_resend_in || 60;
        router.push(`/verify-2fa?email=${encodeURIComponent(responseData.email || '')}&cooldown=${cooldown}`);
        return;
      }

      // No 2FA - proceed with normal login
      if (responseData.token) {
        toast.success("Sign in successful! Redirecting...");
        await login(responseData.token, responseData.user_id);
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
