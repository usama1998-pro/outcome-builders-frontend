"use client";

import { useMutation } from "@tanstack/react-query";
// import { useAuthStore } from "../store/useAuth";
import  { signin } from "../api/auth";
import { AuthResponse, SignupPayload } from "../types/auth";
import { useLogin } from "../hooks/useAuth";
// import { da } from "zod/v4/locales";


export function useSignin() {
  // const { setToken } = useAuthStore();
  const login = useLogin();

  return useMutation<AuthResponse, Error, SignupPayload>({
    mutationFn: signin,
    onSuccess: (data) => {

      if(!data?.data){
        console.error("No data in signin response");
        return;
      }

      const tokenData = data?.data as { token: string } | undefined;
      if (tokenData && tokenData.token) {
        login(tokenData.token); // ✅ delegate to useLogin
      } else {
        console.error("Signin response did not include a token");
      }
    },
  });
}
