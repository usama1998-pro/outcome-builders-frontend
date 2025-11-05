import { create } from "zustand";

type AuthState = {
  token: string | null;
  tenantId: number | null;
  hydrated: boolean;
  setToken: (token: string) => void;
  setTenantId: (tenantId: number) => void;
  clearToken: () => void;
  hydrate: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  tenantId: null,
  hydrated: false,

  setToken: (token) => {
    localStorage.setItem("access_token", token);
    set({ token });
  },

  setTenantId: (tenantId) => {
    localStorage.setItem("tenant_id", String(tenantId));
    set({ tenantId });
  },

  clearToken: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("tenant_id");
    set({ token: null, tenantId: null });
  },

  hydrate: async () => {
    const storedToken = localStorage.getItem("access_token");
    const storedTenantId = localStorage.getItem("tenant_id");
    
    if (!storedToken) {
      set({ token: null, tenantId: null, hydrated: true });
      return;
    }

    try {
      // call your FastAPI verify endpoint
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: storedToken }), // adjust payload to your API
      });
      const data = await res.json();

      if (res.ok && data.status === true) {
        set({ 
          token: storedToken, 
          tenantId: storedTenantId ? Number(storedTenantId) : null,
          hydrated: true 
        });
      } else {
        // invalid token → remove it
        localStorage.removeItem("access_token");
        localStorage.removeItem("tenant_id");
        set({ token: null, tenantId: null, hydrated: true });
      }
    } catch (err) {
      console.log("Error verifying token:", err);
      localStorage.removeItem("access_token");
      localStorage.removeItem("tenant_id");
      set({ token: null, tenantId: null, hydrated: true });
    }
  },
}));
