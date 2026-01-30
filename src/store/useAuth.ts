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
  pendingWorkspaceIds: number[] | null;  // Workspace IDs to assign after onboarding
  workspaceJoiningToken: string | null;  // Single token to join all workspaces
  setToken: (token: string) => void;
  setUserId: (userId: number) => void;
  setTenantId: (tenantId: number) => void;
  setOnboardingPath: (path: string) => void;
  setPendingWorkspaceIds: (workspaceIds: number[]) => void;
  setWorkspaceJoiningToken: (token: string) => void;
  completeOnboarding: () => void;
  clearToken: () => void;
  hydrate: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userId: null,
  tenantId: null,
  hydrated: false,
  pendingWorkspaceIds: null,
  workspaceJoiningToken: null,
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

  setPendingWorkspaceIds: (workspaceIds) => {
    localStorage.setItem("pending_workspace_ids", JSON.stringify(workspaceIds));
    set({ pendingWorkspaceIds: workspaceIds });
  },

  setWorkspaceJoiningToken: (token) => {
    localStorage.setItem("workspace_joining_token", token);
    set({ workspaceJoiningToken: token });
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
    localStorage.removeItem("pending_workspace_ids");
    localStorage.removeItem("workspace_joining_token");
    set({
      token: null,
      userId: null,
      tenantId: null,
      pendingWorkspaceIds: null,
      workspaceJoiningToken: null,
      onboarding: { isComplete: true, lastPath: null, lastVisit: null },
    });
  },

  hydrate: async () => {
    const storedToken = localStorage.getItem("access_token");
    const storedUserId = localStorage.getItem("user_id");
    const storedTenantId = localStorage.getItem("tenant_id");
    const storedOnboarding = localStorage.getItem("onboarding_state");
    const storedPendingWorkspaceIds = localStorage.getItem("pending_workspace_ids");
    const storedWorkspaceJoiningToken = localStorage.getItem("workspace_joining_token");

    console.log(
      "[hydrate] storedToken:",
      !!storedToken,
      "storedTenantId:",
      storedTenantId
    );

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

    // Parse pending workspace IDs
    let pendingWorkspaceIds: number[] | null = null;
    if (storedPendingWorkspaceIds) {
      try {
        pendingWorkspaceIds = JSON.parse(storedPendingWorkspaceIds);
      } catch {
        // Invalid JSON, use defaults
      }
    }

    // Get workspace joining token (single string, not JSON)
    const workspaceJoiningToken = storedWorkspaceJoiningToken || null;

    if (!storedToken) {
      set({
        token: null,
        userId: null,
        tenantId: null,
        hydrated: true,
        pendingWorkspaceIds: null,
        workspaceJoiningToken: null,
        onboarding: onboardingState,
      });
      return;
    }

    try {
      // call your FastAPI verify endpoint
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/user/verify`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedToken}`,
          },
        }
      );
      const data = await res.json();

      if (res.ok && data.status === true) {
        console.log(
          "[hydrate] Token valid, setting tenantId:",
          storedTenantId ? Number(storedTenantId) : null
        );
        set({
          token: storedToken,
          userId: storedUserId ? Number(storedUserId) : null,
          tenantId: storedTenantId ? Number(storedTenantId) : null,
          hydrated: true,
          pendingWorkspaceIds: pendingWorkspaceIds,
          workspaceJoiningToken: workspaceJoiningToken,
          onboarding: onboardingState,
        });
      } else {
        console.log("[hydrate] Token invalid, clearing credentials");
        // invalid token → remove it
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_id");
        localStorage.removeItem("tenant_id");
        localStorage.removeItem("onboarding_state");
        localStorage.removeItem("pending_workspace_ids");
        localStorage.removeItem("workspace_joining_token");
        set({
          token: null,
          userId: null,
          tenantId: null,
          hydrated: true,
          pendingWorkspaceIds: null,
          workspaceJoiningToken: null,
          onboarding: { isComplete: true, lastPath: null, lastVisit: null },
        });
      }
    } catch {
      // Token verification failed - clear stored credentials
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_id");
      localStorage.removeItem("tenant_id");
      localStorage.removeItem("onboarding_state");
      localStorage.removeItem("pending_workspace_ids");
      localStorage.removeItem("workspace_joining_token");
      set({
        token: null,
        userId: null,
        tenantId: null,
        hydrated: true,
        pendingWorkspaceIds: null,
        workspaceJoiningToken: null,
        onboarding: { isComplete: true, lastPath: null, lastVisit: null },
      });
    }
  },
}));
