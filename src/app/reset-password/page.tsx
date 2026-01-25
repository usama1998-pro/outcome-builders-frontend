"use client";

import Image from 'next/image';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { useState, useEffect, Suspense } from "react";
import { ToggleThemeButton } from '@/components/ToggleThemeButton';
import { z } from "zod";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import { resetPassword } from "@/src/api/auth";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const ResetPasswordSchema = z.object({
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password must be at most 128 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/\d/, "Password must contain at least one digit"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type ResetPasswordData = z.infer<typeof ResetPasswordSchema>;

function ResetPasswordContent() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [tokenError, setTokenError] = useState(false);
    
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    useEffect(() => {
        if (!token) {
            setTokenError(true);
        }
    }, [token]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordData>({
        resolver: zodResolver(ResetPasswordSchema),
    });

    const onSubmit = async (data: ResetPasswordData) => {
        if (!token) {
            toast.error("Invalid reset link. Please request a new password reset.");
            return;
        }

        setIsSubmitting(true);
        
        try {
            await resetPassword({ 
                token: token, 
                new_password: data.password 
            });
            setIsSuccess(true);
            toast.success("Password reset successfully!");
            
            // Redirect to signin after 3 seconds
            setTimeout(() => {
                router.push("/signin");
            }, 3000);
        } catch (error: unknown) {
            const axiosError = error as {
                response?: {
                    data?: {
                        detail?: string;
                    };
                };
            };
            
            const errorMessage = axiosError.response?.data?.detail || "Failed to reset password. The link may have expired.";
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Token error state
    if (tokenError) {
        return (
            <div className="text-center py-8">
                {/* Error Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                    Invalid Reset Link
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                    This password reset link is invalid or has expired. Please request a new one.
                </p>

                <a 
                    href="/forgot-password" 
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium rounded-xl shadow-lg shadow-violet-500/30 hover:from-violet-700 hover:to-purple-700 transition-all duration-200"
                >
                    Request New Link
                </a>
            </div>
        );
    }

    // Success state
    if (isSuccess) {
        return (
            <div className="text-center py-8">
                {/* Success Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                    Password Reset Complete!
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                    Your password has been successfully reset. You&apos;ll be redirected to sign in shortly.
                </p>

                {/* Redirect countdown */}
                <div className="flex items-center justify-center gap-2 text-sm text-slate-400 dark:text-slate-500">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Redirecting to sign in...
                </div>

                <a 
                    href="/signin" 
                    className="inline-flex items-center justify-center gap-2 mt-6 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200"
                >
                    Go to Sign In Now
                </a>
            </div>
        );
    }

    return (
        <>
            {/* Icon */}
            <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
            </div>

            <h1 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">
                Create New Password
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-8">
                Your new password must be different from previous used passwords.
            </p>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* New Password */}
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        New Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            placeholder="Enter new password"
                            {...register("password")}
                            className="w-full px-4 py-3 pr-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all duration-200"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="mt-2 text-sm text-red-500 dark:text-red-400">{errors.password.message}</p>
                    )}
                </div>

                {/* Confirm Password */}
                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Confirm Password
                    </label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            id="confirmPassword"
                            placeholder="Confirm new password"
                            {...register("confirmPassword")}
                            className="w-full px-4 py-3 pr-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all duration-200"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                            {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                    </div>
                    {errors.confirmPassword && (
                        <p className="mt-2 text-sm text-red-500 dark:text-red-400">{errors.confirmPassword.message}</p>
                    )}
                </div>

                {/* Password Requirements */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-3">Password must contain:</p>
                    <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-500">
                        <li className="flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 text-violet-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            At least 8 characters
                        </li>
                        <li className="flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 text-violet-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            One uppercase letter (A-Z)
                        </li>
                        <li className="flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 text-violet-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            One lowercase letter (a-z)
                        </li>
                        <li className="flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 text-violet-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            One number (0-9)
                        </li>
                    </ul>
                </div>

                {/* Submit */}
                <Button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg shadow-violet-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Resetting Password...
                        </span>
                    ) : (
                        "Reset Password"
                    )}
                </Button>

                <div className="text-center pt-4">
                    <a 
                        href="/signin" 
                        className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Sign In
                    </a>
                </div>
            </form>
        </>
    );
}

export default function ResetPasswordPage() {
    return (
        <>
            <div className="absolute top-4 right-4 z-10">
                <ToggleThemeButton />
            </div>
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
                <div className="w-full max-w-md">
                    {/* Card Container */}
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
                        {/* Header with gradient */}
                        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 px-8 py-10 text-center">
                            <Image
                                src="/assets/Primary-Logo-Stacked-White.png"
                                alt="Outcome Builder"
                                className="mx-auto"
                                width={180}
                                height={180}
                            />
                        </div>

                        <div className="p-8">
                            <Suspense fallback={
                                <div className="flex items-center justify-center py-8">
                                    <svg className="animate-spin h-8 w-8 text-violet-500" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                </div>
                            }>
                                <ResetPasswordContent />
                            </Suspense>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-6">
                        © 2026 Outcome Builder. All rights reserved.
                    </p>
                </div>
            </div>
        </>
    );
}

