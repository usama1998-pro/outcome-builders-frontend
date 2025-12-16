"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "../store/useAuth";

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
 */
export function useCompleteOnboarding() {
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  return completeOnboarding;
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

