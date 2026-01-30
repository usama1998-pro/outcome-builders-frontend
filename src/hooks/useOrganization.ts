import { useQuery, useMutation } from "@tanstack/react-query";
import api from "../lib/axios";
import routes from "../lib/routes";
import {
  OrganizationDetails,
  RegisterOrganizationPayload,
  RegisterOrganizationResponse,
} from "../types/tenant";
import { registerOrganization } from "../api/tenant";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/useAuth";
import { useCompleteOnboarding } from "./useOnboarding";
import { useAssignWorkspacesFromInvitation } from "./useWorkspace";

// ------------------
//  Types
// ------------------
interface OrganizationDetailsResponse {
  status: boolean;
  message: string;
  data: OrganizationDetails;
  pagination: null;
}

// ------------------
//  API Functions
// ------------------
async function fetchOrganizationDetails(
  tenantId: number
): Promise<OrganizationDetails> {
  const { data } = await api.get<OrganizationDetailsResponse>(
    routes.tenant.details(tenantId)
  );
  return data.data;
}

// ------------------
//  Hooks
// ------------------
export function useOrganizationDetails(tenantId: number) {
  return useQuery<OrganizationDetails, Error>({
    queryKey: ["organizationDetails", tenantId],
    queryFn: () => fetchOrganizationDetails(tenantId),
    enabled: !!tenantId, // Only run query if tenantId is provided
    retry: false,
  });
}

export function useRegisterOrganization() {
  const router = useRouter();
  const setTenantId = useAuthStore((s) => s.setTenantId);
  const completeOnboarding = useCompleteOnboarding();
  const tenantId = useAuthStore((s) => s.tenantId);

  return useMutation<
    RegisterOrganizationResponse,
    Error,
    RegisterOrganizationPayload
  >({
    mutationFn: registerOrganization,
    onSuccess: async (data) => {
      toast.success("Organization registered successfully! Redirecting...");

      // Store the tenant_id
      const finalTenantId = data.tenant_id || tenantId;
      if (finalTenantId) {
        setTenantId(finalTenantId);
      }

      // Complete onboarding (this will handle workspace assignment if needed)
      await completeOnboarding();
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
      let errorMessage = "Organization registration failed. Please try again.";

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
