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
  config.headers.Authorization = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJvd25lckBhY21lLmNvbSIsImV4cCI6MTc2MDM5MDczNH0.rjU5RnTyxyknJN4BOlNioSJQSQXdPd72fqaMiF9qpw0";
  // }
  return config;
});

export default api;
