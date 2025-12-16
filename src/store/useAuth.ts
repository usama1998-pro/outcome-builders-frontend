import { create } from "zustand";

type OnboardingState = {
  isComplete: boolean;
  lastPath: string | null;
  lastVisit: number | null;
};

type AuthState = {
  token: string | null;
  userId: number | null;
  tenantId: number | null;
  hydrated: boolean;
  onboarding: OnboardingState;
  setToken: (token: string) => void;
  setUserId: (userId: number) => void;
  setTenantId: (tenantId: number) => void;
  setOnboardingPath: (path: string) => void;
  completeOnboarding: () => void;
  clearToken: () => void;
  hydrate: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userId: null,
  tenantId: null,
  hydrated: false,
  onboarding: {
    isComplete: true, // Default to true for existing users
    lastPath: null,
    lastVisit: null,
  },

  setToken: (token) => {
    localStorage.setItem("access_token", token);
    set({ token });
  },

  setUserId: (userId) => {
    localStorage.setItem("user_id", String(userId));
    set({ userId });
  },

  setTenantId: (tenantId) => {
    localStorage.setItem("tenant_id", String(tenantId));
    set({ tenantId });
  },

  setOnboardingPath: (path) => {
    const onboardingState = {
      isComplete: false,
      lastPath: path,
      lastVisit: Date.now(),
    };
    localStorage.setItem("onboarding_state", JSON.stringify(onboardingState));
    set({ onboarding: onboardingState });
  },

  completeOnboarding: () => {
    const onboardingState = {
      isComplete: true,
      lastPath: null,
      lastVisit: null,
    };
    localStorage.setItem("onboarding_state", JSON.stringify(onboardingState));
    set({ onboarding: onboardingState });
  },

  clearToken: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("tenant_id");
    localStorage.removeItem("onboarding_state");
    set({
      token: null,
      userId: null,
      tenantId: null,
      onboarding: { isComplete: true, lastPath: null, lastVisit: null },
    });
  },

  hydrate: async () => {
    const storedToken = localStorage.getItem("access_token");
    const storedUserId = localStorage.getItem("user_id");
    const storedTenantId = localStorage.getItem("tenant_id");
    const storedOnboarding = localStorage.getItem("onboarding_state");

    // Parse onboarding state
    let onboardingState: OnboardingState = {
      isComplete: true,
      lastPath: null,
      lastVisit: null,
    };

    if (storedOnboarding) {
      try {
        onboardingState = JSON.parse(storedOnboarding);
      } catch {
        // Invalid JSON, use defaults
      }
    }

    if (!storedToken) {
      set({
        token: null,
        userId: null,
        tenantId: null,
        hydrated: true,
        onboarding: onboardingState,
      });
      return;
    }

    try {
      // call your FastAPI verify endpoint
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/user/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: storedToken }), // adjust payload to your API
        }
      );
      const data = await res.json();

      if (res.ok && data.status === true) {
        set({
          token: storedToken,
          userId: storedUserId ? Number(storedUserId) : null,
          tenantId: storedTenantId ? Number(storedTenantId) : null,
          hydrated: true,
          onboarding: onboardingState,
        });
      } else {
        // invalid token → remove it
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_id");
        localStorage.removeItem("tenant_id");
        localStorage.removeItem("onboarding_state");
        set({
          token: null,
          userId: null,
          tenantId: null,
          hydrated: true,
          onboarding: { isComplete: true, lastPath: null, lastVisit: null },
        });
      }
    } catch (err) {
      console.log("Error verifying token:", err);
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_id");
      localStorage.removeItem("tenant_id");
      localStorage.removeItem("onboarding_state");
      set({
        token: null,
        userId: null,
        tenantId: null,
        hydrated: true,
        onboarding: { isComplete: true, lastPath: null, lastVisit: null },
      });
    }
  },
}));
