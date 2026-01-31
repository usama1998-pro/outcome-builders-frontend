import routes from "../lib/routes";
import api from "../lib/axios";
import { SignupPayload, SigninPayload, AuthResponse, TwoFAVerifyResponseData, TwoFAResendResponseData, TwoFAToggleResponseData } from "../types/auth";

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

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  new_password: string;
}

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<AuthResponse> {
  const { data } = await api.post(routes.auth.forgotPassword, payload);
  return data;
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<AuthResponse> {
  const { data } = await api.post(routes.auth.resetPassword, payload);
  return data;
}

// Two-Factor Authentication
export interface TwoFAVerifyPayload {
  email: string;
  code: string;
}

export interface TwoFATogglePayload {
  enable: boolean;
}

export interface TwoFAResendPayload {
  email: string;
}

export async function verify2FA(payload: TwoFAVerifyPayload): Promise<AuthResponse<TwoFAVerifyResponseData>> {
  const { data } = await api.post(routes.auth.twoFAVerify, payload);
  return data;
}

export async function toggle2FA(payload: TwoFATogglePayload): Promise<AuthResponse<TwoFAToggleResponseData>> {
  const { data } = await api.post(routes.auth.twoFAToggle, payload);
  return data;
}

export async function get2FAStatus(): Promise<AuthResponse<TwoFAToggleResponseData>> {
  const { data } = await api.get(routes.auth.twoFAStatus);
  return data;
}

export async function resend2FACode(payload: TwoFAResendPayload): Promise<AuthResponse<TwoFAResendResponseData>> {
  const { data } = await api.post(routes.auth.twoFAResend, payload);
  return data;
}

// Email Verification
export interface VerifyEmailPayload {
  token: string;
}

export interface ResendVerificationPayload {
  email: string;
}

export async function verifyEmail(payload: VerifyEmailPayload): Promise<AuthResponse> {
  const { data } = await api.post(routes.auth.verifyEmail, payload);
  return data;
}

export async function resendVerificationEmail(payload: ResendVerificationPayload): Promise<AuthResponse> {
  const { data } = await api.post(routes.auth.resendVerification, payload);
  return data;
}