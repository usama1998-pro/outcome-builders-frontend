"use client";

import { useMutation } from "@tanstack/react-query";
// import { useAuthStore } from "../store/useAuth";
import  { signin } from "../api/auth";
import { AuthResponse, SignupPayload } from "../types/auth";
import { useLogin } from "../hooks/useAuth";


export function useSignin() {
  // const { setToken } = useAuthStore();
  const login = useLogin();

  return useMutation<AuthResponse, Error, SignupPayload>({
    mutationFn: signin,
    onSuccess: (data) => {
      const token = data?.data?.token;
      if (token) {
        login(token); // ✅ delegate to useLogin
      } else {
        console.error("Signin response did not include a token");
      }
    },
  });
}
