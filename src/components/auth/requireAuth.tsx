"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/useAuth";
import { useVerifyToken } from "../../hooks/useAuth";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
    const token = useAuthStore((s) => s.token);
    const hydrated = useAuthStore((s) => s.hydrated);
    const hydrate = useAuthStore((s) => s.hydrate);
    const { data, isLoading, isError } = useVerifyToken();
    const router = useRouter();

    // ✅ Hydrate store from localStorage once on mount
    useEffect(() => {
        hydrate();
    }, [hydrate]);

    // ✅ Redirect after hydration & verification
    useEffect(() => {
        if (hydrated) {
            if (!token || isError || data?.status === false) {
                router.push("/signin");
            }
        }
    }, [hydrated, token, isError, data?.status, router]);

    // ✅ Prevent rendering until hydrated
    if (!hydrated) return <p>Loading session...</p>;

    // ✅ While verification is running
    if (isLoading) return <p>Verifying session...</p>;

    // ✅ Allow children only if valid session
    if (!token || isError || data?.status === false) {
        return <p>Redirecting...</p>;
    }

    return <>{children}</>;
}
