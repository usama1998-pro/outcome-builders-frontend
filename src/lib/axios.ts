import axios from "axios";
import { useAuthStore } from "../store/useAuth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
  headers: { "Content-Type": "application/json" },
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token; // read Zustand store directly
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
