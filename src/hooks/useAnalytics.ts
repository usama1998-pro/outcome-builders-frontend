import { useQuery } from "@tanstack/react-query";
import api from "../lib/axios";
import routes from "../lib/routes";
import { useAuthStore } from "../store/useAuth";

export interface AnalyticsData {
  total_workspaces: number;
  total_collections: number;
  total_notes: number;
  total_members: number;
  total_trained_notes: number;
}

interface AnalyticsApiResponse {
  status: boolean;
  message: string;
  data: AnalyticsData;
  pagination: number | null;
}

async function fetchAnalytics(): Promise<AnalyticsData> {
  const { data } = await api.get<AnalyticsApiResponse>(routes.tenant.analytics);
  return data.data;
}

export function useAnalytics() {
  const tenantId = useAuthStore((state) => state.tenantId);
  const hydrated = useAuthStore((state) => state.hydrated);

  const { data, isLoading, isError, error, refetch } = useQuery<AnalyticsData, Error>({
    queryKey: ["analytics", tenantId],
    queryFn: fetchAnalytics,
    enabled: !!tenantId && hydrated,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  return { data, isLoading, isError, error, refetch };
}

