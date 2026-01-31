"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get2FAStatus, toggle2FA, TwoFATogglePayload } from "../api/auth";
import { AuthResponse, TwoFAToggleResponseData } from "../types/auth";
import { toast } from "sonner";

type TwoFAStatusResponse = AuthResponse<TwoFAToggleResponseData>;

// ------------------ // Fetch Function // ------------------
async function fetch2FAStatus(): Promise<TwoFAStatusResponse> {
  const data = await get2FAStatus();
  return data as TwoFAStatusResponse;
}

// ------------------ // Hooks // ------------------
export function use2FAStatus() {
  const { data, isLoading, isError, error } = useQuery<TwoFAStatusResponse, Error>({
    queryKey: ["2faStatus"],
    queryFn: fetch2FAStatus,
  });

  return { data, isLoading, isError, error };
}

export function useToggle2FA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TwoFATogglePayload) => toggle2FA(payload),
    onSuccess: (data) => {
      // Invalidate and refetch 2FA status
      queryClient.invalidateQueries({ queryKey: ["2faStatus"] });
      const message = data?.data?.message || data?.message || 
        (data?.data?.two_fa_enabled ? "Two-factor authentication enabled successfully!" : "Two-factor authentication disabled successfully!");
      toast.success(message);
    },
    onError: (error: unknown) => {
      const axiosError = error as {
        response?: {
          data?: {
            detail?: string;
            message?: string;
          };
        };
        message?: string;
      };

      let errorMessage = "Failed to update 2FA settings. Please try again.";

      if (axiosError.response?.data?.detail) {
        errorMessage = axiosError.response.data.detail;
      } else if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message;
      } else if (axiosError.message) {
        errorMessage = axiosError.message;
      }

      toast.error(errorMessage);
    },
  });
}

