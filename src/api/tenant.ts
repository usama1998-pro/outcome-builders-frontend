import routes from "../lib/routes";
import api from "../lib/axios";
import {
  RegisterOrganizationPayload,
  RegisterOrganizationResponse,
} from "../types/tenant";

export async function registerOrganization(
  payload: RegisterOrganizationPayload
): Promise<RegisterOrganizationResponse> {
  const { data } = await api.post(routes.tenant.create, payload);
  return data.data; // Extract data from SuccessResponse wrapper
}
