import routes from "../lib/routes";
import api from "../lib/axios";
import { SignupPayload, SigninPayload, AuthResponse } from "../types/auth";

export async function signup(payload: SignupPayload): Promise<AuthResponse> {
  const { data } = await api.post(routes.auth.signup, payload);
  return data;
}

export async function signin(payload: SigninPayload): Promise<AuthResponse> {
  const { data } = await api.post(routes.auth.signin, payload);
  return data;
}

export async function verifyToken(): Promise<AuthResponse> {
  const { data } = await api.get(routes.auth.verify);
  return data;
}
