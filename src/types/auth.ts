export interface SigninPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  email: string;
  password: string;
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

