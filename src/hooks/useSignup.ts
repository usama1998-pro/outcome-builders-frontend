"use client";

import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../store/useAuth";
import { signup } from "../api/auth";
import { AuthResponse, SignupPayload } from "../types/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useStartOnboarding } from "./useOnboarding";
import { useLogin } from "./useAuth";

export function useSignup() {
  const router = useRouter();
  const setToken = useAuthStore((state) => state.setToken);
  const setUserId = useAuthStore((state) => state.setUserId);
  const setTenantId = useAuthStore((state) => state.setTenantId);
  const setPendingWorkspaceIds = useAuthStore((state) => state.setPendingWorkspaceIds);
  const setWorkspaceJoiningToken = useAuthStore((state) => state.setWorkspaceJoiningToken);
  const startOnboarding = useStartOnboarding();
  const login = useLogin();

  return useMutation<AuthResponse, Error, SignupPayload>({
    mutationFn: signup,
    onSuccess: async (response, variables) => {
      // Check if email verification is required
      const data = response.data as { 
        token?: string; 
        user_id?: number; 
        email_verified?: boolean;
        email?: string;
        message?: string;
        tenant_id?: number;
        role?: string;
        workspace_ids?: number[];
        workspace_joining_token?: string;  // Single token to join all workspaces
      };

      // If signed up via invitation (member), redirect to email verification first
      if (variables.invitation_token && data.user_id) {
        if (data.tenant_id) {
          setTenantId(data.tenant_id);
        }
        // Store pending workspace IDs and joining tokens for later use
        if (data.workspace_ids && data.workspace_ids.length > 0) {
          setPendingWorkspaceIds(data.workspace_ids);
        }
        if (data.workspace_joining_token) {
          setWorkspaceJoiningToken(data.workspace_joining_token);
        }
        // Don't set token yet - wait for email verification
        // Redirect to email verification page
        const email = data.email || variables.email;
        toast.success("Account created! Please verify your email to continue.");
        router.push(`/check-email?email=${encodeURIComponent(email)}`);
        return;
      }

      if (data.email_verified === false) {
        // Start onboarding even though email isn't verified yet
        // This ensures user can continue onboarding after they verify and sign in
        startOnboarding();
        
        // Redirect to check-email page with email address
        const email = data.email || variables.email;
        router.push(`/check-email?email=${encodeURIComponent(email)}`);
        // Don't store token until email is verified
      } else {
        // Email already verified (shouldn't happen on signup, but handle it)
        if (data.token) {
          setToken(data.token);
        }
        if (data.user_id) {
          setUserId(data.user_id);
        }
        startOnboarding();
        toast.success("Account created successfully! Redirecting...");
        router.push("/onboarding");
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
