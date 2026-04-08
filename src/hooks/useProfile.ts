"use client";

import { useQuery } from "@tanstack/react-query";
import api from "../lib/axios";
import routes from "../lib/routes";

interface UserProfile {
  status: boolean;
  message: string;
  data: {
    id: number;
    email: string;
    is_superuser?: boolean;
    full_name: string;
    description: string;
    profile_picture?: string;
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    github?: string;
    twitch?: string;
    youtube?: string;
    created_at: string;
  };
  pagination: number | null;
}

// ------------------ // Fetch Function // ------------------
async function fetchUserProfile(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>(routes.user.account);
  // Map backend → WorkSpaceList
  return data;
}

// ------------------ // Hook // ------------------
export function useUserProfile() {
  const { data, isLoading, isError, error } = useQuery<UserProfile, Error>({
    queryKey: ["userProfile"],
    queryFn: fetchUserProfile,
  });

  return { data, isLoading, isError, error };
}
