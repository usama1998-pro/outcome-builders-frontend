"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "../store/useAuth";
import { useAssignWorkspacesFromInvitation } from "./useWorkspace";
import api from "../lib/axios";
import routes from "../lib/routes";

// Time threshold in hours - don't redirect if last visit was more than this long ago
const ONBOARDING_EXPIRY_HOURS = 48;

// Onboarding routes that should be tracked
const ONBOARDING_ROUTES = ["/onboarding", "/register-company", "/join-workspace"];

/**
 * Hook to track onboarding progress
 * Call this on onboarding pages to save the current path
 */
export function useTrackOnboarding() {
  const pathname = usePathname();
  const setOnboardingPath = useAuthStore((s) => s.setOnboardingPath);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    // Only track if user is authenticated and on an onboarding route
    if (token && ONBOARDING_ROUTES.includes(pathname)) {
      setOnboardingPath(pathname);
    }
  }, [pathname, token, setOnboardingPath]);
}

/**
 * Hook to check if user should be redirected back to onboarding
 * Returns the path to redirect to, or null if no redirect needed
 */
export function useOnboardingRedirect() {
  const onboarding = useAuthStore((s) => s.onboarding);
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);

  // Not authenticated or not hydrated yet
  if (!token || !hydrated) {
    return null;
  }

  // Onboarding is complete
  if (onboarding.isComplete) {
    return null;
  }

  // Check if last visit is within the expiry threshold
  if (onboarding.lastVisit) {
    const hoursSinceVisit = (Date.now() - onboarding.lastVisit) / (1000 * 60 * 60);
    if (hoursSinceVisit > ONBOARDING_EXPIRY_HOURS) {
      // Too old, don't redirect - they should start fresh or go to dashboard
      return null;
    }
  }

  // Return the last path or default to /onboarding
  return onboarding.lastPath || "/onboarding";
}

/**
 * Hook to handle automatic redirect after sign in
 * Use this in the sign in flow to redirect to onboarding if needed
 */
export function useHandlePostAuthRedirect() {
  const router = useRouter();
  const onboardingPath = useOnboardingRedirect();

  const redirect = (defaultPath: string = "/dashboard") => {
    if (onboardingPath) {
      router.push(onboardingPath);
      return onboardingPath;
    }
    router.push(defaultPath);
    return defaultPath;
  };

  return { redirect, onboardingPath };
}

/**
 * Hook to mark onboarding as complete
 * Call this when user finishes onboarding (e.g., after registering org or joining workspace)
 * This will also assign any pending workspaces from invitation and redirect appropriately
 */
export function useCompleteOnboarding() {
  const router = useRouter();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const pendingWorkspaceIds = useAuthStore((s) => s.pendingWorkspaceIds);
  const setPendingWorkspaceIds = useAuthStore((s) => s.setPendingWorkspaceIds);
  const userId = useAuthStore((s) => s.userId);
  const tenantId = useAuthStore((s) => s.tenantId);
  const { mutate: assignWorkspaces } = useAssignWorkspacesFromInvitation();

  const completeOnboardingWithWorkspaceAssignment = async (redirectPath?: string) => {
    // Assign workspaces from invitation if any
    if (pendingWorkspaceIds && pendingWorkspaceIds.length > 0 && userId && tenantId) {
      assignWorkspaces(
        {
          user_id: userId,
          workspace_ids: pendingWorkspaceIds
        },
        {
          onSuccess: (result) => {
            // Clear pending workspace IDs
            setPendingWorkspaceIds([]);
            localStorage.removeItem("pending_workspace_ids");
            
            // Mark onboarding as complete
            completeOnboarding();
            
            // Redirect to first workspace or provided path or dashboard
            if (result.workspace_ids && result.workspace_ids.length > 0) {
              router.push(redirectPath || `/dashboard?workspace=${result.workspace_ids[0]}`);
            } else {
              router.push(redirectPath || "/dashboard");
            }
          },
          onError: (error) => {
            console.error("Failed to assign workspaces:", error);
            // Mark onboarding as complete anyway
            completeOnboarding();
            // Redirect to provided path or dashboard even if workspace assignment fails
            router.push(redirectPath || "/dashboard");
          }
        }
      );
    } else {
      // No pending workspaces, just complete onboarding
      completeOnboarding();
      // Always redirect to dashboard if no redirect path provided
      router.push(redirectPath || "/dashboard");
    }
  };

  return completeOnboardingWithWorkspaceAssignment;
}

/**
 * Hook to start onboarding for a new user
 * Call this after successful signup
 */
export function useStartOnboarding() {
  const setOnboardingPath = useAuthStore((s) => s.setOnboardingPath);
  
  const startOnboarding = () => {
    setOnboardingPath("/onboarding");
  };

  return startOnboarding;
}

