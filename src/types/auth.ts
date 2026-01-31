export interface SigninPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  email: string;
  password: string;
  invitation_token?: string;
}


export interface VerifyPayload {
  token: string | null;
}

export interface AuthResponse<T = unknown> {
  status: boolean;
  message: string;
  data: T | null;
  pagination: null | Record<string, unknown>; // can extend later if API adds pagination
}

export interface TwoFAVerifyResponseData {
  user_id: number;
  email: string;
  token: string;
  message: string;
}

export interface TwoFAResendResponseData {
  success: boolean;
  message: string;
  can_resend_in: number;
}

export interface TwoFAToggleResponseData {
  two_fa_enabled: boolean;
  message: string;
}

