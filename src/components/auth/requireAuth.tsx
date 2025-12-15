"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/useAuth";
import { useVerifyToken } from "../../hooks/useAuth";
import BlocksLoader from "../Loaders/BlocksLoader/BlocksLoader";

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
    if (!hydrated) return (
        <div className="w-full h-screen flex items-center justify-center">
            <BlocksLoader />
        </div>
    );

    // ✅ While verification is running
    if (isLoading) return (
        <div className="w-full h-screen flex items-center justify-center">
            <BlocksLoader />
        </div>
    );

    // ✅ Allow children only if valid session
    if (!token || isError || data?.status === false) {
        return (
            <div className="w-full h-screen flex items-center justify-center">
                <BlocksLoader />
            </div>
        );
    }

    return <>{children}</>;
}
