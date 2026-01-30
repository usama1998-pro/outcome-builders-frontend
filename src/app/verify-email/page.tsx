"use client";

import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { useState, useEffect, Suspense } from "react";
import { ToggleThemeButton } from '@/components/ToggleThemeButton';
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyEmail, resendVerificationEmail } from "@/src/api/auth";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "@/src/hooks/useAuth";

const ResendVerificationSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
});

type ResendVerificationData = z.infer<typeof ResendVerificationSchema>;

function VerifyEmailContent() {
    const [isVerifying, setIsVerifying] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isError, setIsError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [isResending, setIsResending] = useState(false);
    const [showResendForm, setShowResendForm] = useState(false);
    
    const searchParams = useSearchParams();
    const router = useRouter();
    const login = useLogin();
    const token = searchParams.get("token");

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResendVerificationData>({
        resolver: zodResolver(ResendVerificationSchema),
    });

    useEffect(() => {
        if (!token) {
            setIsError(true);
            setErrorMessage("Invalid verification link. Please check your email and try again.");
            setIsVerifying(false);
            return;
        }

        // Automatically verify on mount
        handleVerify();
    }, [token]);

    const handleVerify = async () => {
        if (!token) return;

        setIsVerifying(true);
        setIsError(false);
        
        try {
            const response = await verifyEmail({ token });
            setIsSuccess(true);
            toast.success(response.message || "Email verified successfully!");
            
            // Check if response contains token for automatic login
            const responseData = response.data as { token?: string; user_id?: number; tenant_id?: number };
            if (responseData.token && responseData.user_id) {
                // Check if user was invited (has tenant_id) - redirect to dashboard for members
                // Otherwise redirect to onboarding for regular signups
                const redirectPath = responseData.tenant_id ? "/dashboard" : "/onboarding";
                // Automatically log in the user and redirect
                await login(responseData.token, responseData.user_id, redirectPath);
            } else {
                // Fallback: redirect to signin if no token provided
                setTimeout(() => {
                    router.push("/signin");
                }, 3000);
            }
        } catch (error: unknown) {
            setIsError(true);
            const axiosError = error as {
                response?: {
                    data?: {
                        detail?: string;
                        message?: string;
                    };
                };
            };
            
            const errorMsg = axiosError.response?.data?.detail || 
                           axiosError.response?.data?.message || 
                           "Failed to verify email. The link may have expired.";
            setErrorMessage(errorMsg);
            toast.error(errorMsg);
        } finally {
            setIsVerifying(false);
        }
    };

    const onResendSubmit = async (data: ResendVerificationData) => {
        setIsResending(true);
        
        try {
            await resendVerificationEmail({ email: data.email });
            toast.success("Verification email sent! Please check your inbox.");
            setShowResendForm(false);
        } catch (error: unknown) {
            const axiosError = error as {
                response?: {
                    data?: {
                        detail?: string;
                        message?: string;
                    };
                };
            };
            
            const errorMsg = axiosError.response?.data?.detail || 
                           axiosError.response?.data?.message || 
                           "Failed to resend verification email. Please try again.";
            toast.error(errorMsg);
        } finally {
            setIsResending(false);
        }
    };

    // Verifying state
    if (isVerifying) {
        return (
            <div className="text-center py-8">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-violet-500/30">
                        <svg className="w-10 h-10 text-white animate-spin" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                    Verifying Your Email
                </h2>
                <p className="text-slate-500 dark:text-slate-400">
                    Please wait while we verify your email address...
                </p>
            </div>
        );
    }

    // Success state
    if (isSuccess) {
        return (
            <div className="text-center py-8">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                    Email Verified!
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                    Your email address has been successfully verified. You&apos;ll be redirected shortly.
                </p>

                <div className="flex items-center justify-center gap-2 text-sm text-slate-400 dark:text-slate-500 mb-6">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Redirecting...
                </div>
            </div>
        );
    }

    // Error state
    if (isError) {
        return (
            <div className="text-center py-8">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                    Verification Failed
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                    {errorMessage}
                </p>

                {!showResendForm ? (
                    <>
                        <Button
                            onClick={() => setShowResendForm(true)}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium rounded-xl shadow-lg shadow-violet-500/30 hover:from-violet-700 hover:to-purple-700 transition-all duration-200 mb-4"
                        >
                            Resend Verification Email
                        </Button>
                        <div>
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
                    </>
                ) : (
                    <form onSubmit={handleSubmit(onResendSubmit)} className="space-y-4 max-w-sm mx-auto">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                placeholder="Enter your email"
                                {...register("email")}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all duration-200"
                            />
                            {errors.email && (
                                <p className="mt-2 text-sm text-red-500 dark:text-red-400">{errors.email.message}</p>
                            )}
                        </div>
                        <Button 
                            type="submit" 
                            disabled={isResending} 
                            className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg shadow-violet-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isResending ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Sending...
                                </span>
                            ) : (
                                "Resend Verification Email"
                            )}
                        </Button>
                        <button
                            type="button"
                            onClick={() => setShowResendForm(false)}
                            className="w-full text-sm text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                        >
                            Cancel
                        </button>
                    </form>
                )}
            </div>
        );
    }

    return null;
}

export default function VerifyEmailPage() {
    return (
        <>
            <div className="absolute top-4 right-4 z-10">
                <ToggleThemeButton />
            </div>
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
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
                                <VerifyEmailContent />
                            </Suspense>
                        </div>
                    </div>

                    <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-6">
                        © 2026 Outcome Builder. All rights reserved.
                    </p>
                </div>
            </div>
        </>
    );
}

