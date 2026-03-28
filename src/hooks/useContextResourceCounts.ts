import { useQuery } from "@tanstack/react-query";
import { fetchContextResourceCounts } from "../api/businessContext";
import { useAuthStore } from "../store/useAuth";
import { DataContextSlug } from "../app/dashboard/data-sources/_components/dataContextConfig";
import { ResourceTypeId } from "../app/dashboard/data-sources/_components/resourceTypes";

export function useContextResourceCounts(contextSlug: DataContextSlug) {
  const tenantId = useAuthStore((state) => state.tenantId);
  const hydrated = useAuthStore((state) => state.hydrated);

  return useQuery<Record<ResourceTypeId, number>, Error>({
    queryKey: ["contextResourceCounts", tenantId, contextSlug],
    queryFn: () => fetchContextResourceCounts(contextSlug),
    enabled: !!tenantId && hydrated,
    staleTime: 1000 * 60 * 2,
  });
}
