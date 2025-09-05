"use client";

import { useEffect } from "react";
import { useAuthStore } from "../store/useAuth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";


export default function Providers({ children }: { children: React.ReactNode }) {
  // ✅ ensures only one QueryClient is created per app
  const [queryClient] = useState(() => new QueryClient());
  const { setToken } = useAuthStore();

  useEffect(() => {
    const savedToken = localStorage.getItem("access_token");
    if (savedToken) setToken(savedToken);
  }, [setToken]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
