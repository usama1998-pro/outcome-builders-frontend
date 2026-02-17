import axios from "axios";
import { useAuthStore } from "../store/useAuth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach token and tenant automatically
api.interceptors.request.use((config) => {
  // Use token from auth store (secure - not exposed in client bundle)
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Add tenant header (required for multi-tenant endpoints)
  // Backend expects X-Tenant header (FastAPI converts x_tenant parameter to X-Tenant)
  const tenantId = useAuthStore.getState().tenantId;

  if (tenantId) {
    config.headers["X-Tenant"] = String(tenantId);
  }

  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle rate limiting (429 Too Many Requests)
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers["retry-after"];
      const waitTime = retryAfter ? parseInt(retryAfter, 10) : 60;

      // Create a more user-friendly error
      error.message = `Too many requests. Please wait ${waitTime} seconds before trying again.`;
      error.isRateLimited = true;
      error.retryAfter = waitTime;
    }

    // Handle authentication failures
    if (error.response && error.response.status === 401) {
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

    // Handle 403 Forbidden - don't sign out, let the UI handle permission errors
    // 403 can be permission-related (not auth-related), so we shouldn't auto-signout
    if (error.response && error.response.status === 403) {
      // Let the UI handle 403 errors (show error message, etc.)
      // Don't automatically sign out for permission errors
    }

    return Promise.reject(error);
  }
);

export default api;
