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
    config.headers["x-tenant"] = String(tenantId);
  }

  return config;
});

// Handle authentication failures
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if the error is due to authentication failure
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      // Get the request URL to check if it's an auth endpoint
      const requestUrl = error.config?.url || "";

      // Don't redirect if the error is from authentication endpoints
      // (signin, signup, verify) - let the UI handle these errors
      const isAuthEndpoint =
        requestUrl.includes("/user/signin") ||
        requestUrl.includes("/user/signup") ||
        requestUrl.includes("/user/verify");

      if (!isAuthEndpoint) {
        // Clear auth tokens
        useAuthStore.getState().clearToken();

        // Redirect to signin page if we're in a browser environment
        if (typeof window !== "undefined") {
          window.location.href = "/signin";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
