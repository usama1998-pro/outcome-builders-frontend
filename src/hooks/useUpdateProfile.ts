import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios";
import routes from "../lib/routes";
import { toast } from "sonner";

interface UpdateProfilePayload {
  full_name?: string;
  description?: string;
  profile_picture?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  github?: string;
  twitch?: string;
  youtube?: string;
}

interface UpdateProfileResponse {
  status: boolean;
  message: string;
  data: {
    message: string;
    profile_id: number;
  };
}

async function updateProfile(
  payload: UpdateProfilePayload
): Promise<UpdateProfileResponse> {
  const { data } = await api.patch<UpdateProfileResponse>(
    routes.user.updateProfile,
    payload
  );
  return data;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      // Invalidate and refetch user profile
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      toast.success("Profile updated successfully!");
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

      let errorMessage = "Failed to update profile. Please try again.";

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
