"use client";

import { useMutation } from "@tanstack/react-query";
// import { useAuthStore } from "../store/useAuth";
import  { signup } from "../api/auth";
import { AuthResponse, SignupPayload } from "../types/auth";
import { useRouter } from "next/navigation";


export function useSignup() {
  const router = useRouter();

  return useMutation<AuthResponse, Error, SignupPayload>({
    mutationFn:  (payload) => {
      console.log("🚀 useSignup calling signup()", payload);
      return signup(payload);
    },
    onSuccess: (data) => {
      router.push("/signin");
      console.log("Signup successful, please sign in.");
    },
    onError: (error) => {
      console.error("Signup failed:", error.message);
    },
  });
}
