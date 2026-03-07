"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserSettings, updateUserSettings, UserSettingsUpdatePayload } from "../api/settings";
import { UserSettingsResponse } from "../api/settings";
import { toast } from "sonner";

// ------------------ // Fetch Function // ------------------
async function fetchUserSettings(): Promise<UserSettingsResponse> {
  const data = await getUserSettings();
  return data;
}

// ------------------ // Hooks // ------------------
export function useGetUserSettings() {
  const { data, isLoading, isError, error } = useQuery<UserSettingsResponse, Error>({
    queryKey: ["userSettings"],
    queryFn: fetchUserSettings,
  });

  return { data, isLoading, isError, error };
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UserSettingsUpdatePayload) => updateUserSettings(payload),
    onSuccess: (data) => {
      // Invalidate and refetch settings
      queryClient.invalidateQueries({ queryKey: ["userSettings"] });
      const message = data?.message || "Settings updated successfully!";
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

      let errorMessage = "Failed to update settings. Please try again.";

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

