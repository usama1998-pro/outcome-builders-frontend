import axios from "axios";
import { useAuthStore } from "../store/useAuth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach token and tenant automatically
api.interceptors.request.use((config) => {
  // Priority: 1. Static token from env (for development/testing)
  //           2. Dynamic token from auth store (for production)
  const staticToken = process.env.NEXT_PUBLIC_STATIC_TOKEN;
  const dynamicToken = useAuthStore.getState().token;
  
  const token = staticToken || dynamicToken;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Add tenant header (required for multi-tenant endpoints)
  const staticTenantId = process.env.NEXT_PUBLIC_STATIC_TENANT_ID;
  const dynamicTenantId = useAuthStore.getState().tenantId;
  
  const tenantId = staticTenantId || dynamicTenantId;
  
  if (tenantId) {
    config.headers['x-tenant'] = String(tenantId);
  }
  
  return config;
});

export default api;
