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
  config.headers.Authorization = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJvd25lckBhY21lLmNvbSIsImV4cCI6MTc2MDIwODU3N30.nWdAKLFZiVzrjnnDPzkO7wTo2H6xAPjc7YuvT0FaF3M";
  // }
  return config;
});

export default api;
