import axios from "axios";
import { useAuthStore } from "../store/useAuth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token; // read Zustand store directly
  // if (token) {
  config.headers.Authorization = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJvd25lckBhY21lLmNvbSIsImV4cCI6MTc2MDcyNjg4OX0.nPx7VbvzFpzSMctsKJibrsy23jpzYi8UIXk6Vdigy3g";
  // }
  return config;
});

export default api;
