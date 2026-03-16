import routes from "../lib/routes";
import api from "../lib/axios";

export interface UserSettings {
  id: number;
  user_id: number;
  custom_instructions: string | null;
  preferred_chat_model: string | null;
  enabled_tones: string[] | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserSettingsResponse {
  message: string;
  data: UserSettings;
}

export interface UserSettingsUpdatePayload {
  custom_instructions?: string | null;
  preferred_chat_model?: string | null;
  enabled_tones?: string[] | null;
}

export async function getUserSettings(): Promise<UserSettingsResponse> {
  const { data } = await api.get(routes.user.settings);
  return data;
}

export async function updateUserSettings(
  payload: UserSettingsUpdatePayload,
): Promise<UserSettingsResponse> {
  const { data } = await api.put(routes.user.updateSettings, payload);
  return data;
}
