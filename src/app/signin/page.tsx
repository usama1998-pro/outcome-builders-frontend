"use client";

import Image from 'next/image';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button"
// import styles from "./page.module.css";
import { useSignin } from "../../hooks/useSignin";
import { useState, useEffect } from "react";
import { ToggleThemeButton } from '@/components/ToggleThemeButton';
import { SigninPayloadSchema, SigninPayload } from "../../schemas/signin";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useHydrate";
import { useAuthStore } from "../../store/useAuth";

export default function SignInForm() {
    const signIn = useSignin();
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);

    // Use useAuth hook to ensure hydration happens
    const { token, hydrated } = useAuth();
    const tenantId = useAuthStore((state) => state.tenantId);

    // Redirect authenticated users to dashboard
    useEffect(() => {
        if (hydrated && token) {
            // User is authenticated, redirect to dashboard
            if (tenantId) {
                router.push(`/dashboard/organization`);
            } else {
                router.push(`/dashboard`);
            }
        }
    }, [hydrated, token, tenantId, router]);

    // setup form with zod validation
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SigninPayload>({
        resolver: zodResolver(SigninPayloadSchema),
    });

    const onSubmit = (data: SigninPayload) => {
        signIn.mutate(data); // email + password are already validated here
    };

    // Show loading while checking auth state
    if (!hydrated) {
        return (
            <div className="flex items-center justify-center h-screen">
                <svg className="animate-spin h-8 w-8 text-violet-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            </div>
        );
    }

    // Don't render form if user is authenticated (will redirect)
    if (token) {
        return null;
    }

    return (
        <>
            <div className="absolute top-4 right-4">
                <ToggleThemeButton />
            </div>
            <div className="flex items-center justify-center h-screen">
                <div className="w-full max-w-md flex items-center justify-center flex-col px-4">
                    <Image
                        src="/assets/P-L-B.png"
                        alt="logo black"
                        className="dark:hidden"
                        width={300}
                        height={300}
                    />
                    <Image
                        src="/assets/P-L-W.png"
                        alt="logo white"
                        className="hidden dark:block"
                        width={300}
                        height={300}
                    />

                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-6 w-full">
                        {/* Email input */}
                        <input
                            type="email"
                            placeholder="Email"
                            {...register("email")}
                            className="border p-2 w-full rounded"
                        />
                        {errors.email && (
                            <p className="!text-red-500 dark:!text-red-400 text-sm">{errors.email.message}</p>
                        )}

                        {/* Password input */}
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                {...register("password")}
                                className="border p-2 pr-10 w-full rounded"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="!text-red-500 dark:!text-red-400 text-sm">{errors.password.message}</p>
                        )}

                        {/* Forgot Password Link */}
                        <div className="text-right">
                            <a href="/forgot-password" className="text-sm text-red-500 hover:underline">
                                Forgot Password?
                            </a>
                        </div>

                        {/* Submit */}
                        <Button type="submit" disabled={signIn.isPending}>
                            {signIn.isPending ? "Signing In..." : "Sign In"}
                        </Button>

                        <a href="/signup" className="text-sm text-red-500 hover:underline mt-2 text-center">
                            {"Don't have an account? Sign Up"}
                        </a>
                    </form>
                </div>
            </div>

        </>

    );
}
