"use client";

import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { useState, useEffect, Suspense } from "react";
import { ToggleThemeButton } from '@/components/ToggleThemeButton';
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import { resendVerificationEmail } from "@/src/api/auth";

function CheckEmailContent() {
    const [isResending, setIsResending] = useState(false);
    const [cooldownSeconds, setCooldownSeconds] = useState(0);
    const [emailSent, setEmailSent] = useState(false);
    
    const searchParams = useSearchParams();
    const router = useRouter();
    const email = searchParams.get("email");

    // Cooldown timer
    useEffect(() => {
        if (cooldownSeconds > 0) {
            const timer = setTimeout(() => {
                setCooldownSeconds(cooldownSeconds - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldownSeconds]);

    useEffect(() => {
        if (email) {
            setEmailSent(true);
        }
    }, [email]);

    const handleResend = async () => {
        if (cooldownSeconds > 0 || !email) return;

        setIsResending(true);
        
        try {
            await resendVerificationEmail({ email });
            setCooldownSeconds(60); // 1 minute cooldown
            toast.success("Verification email sent! Please check your inbox.");
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

    if (!email) {
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
                    Invalid Request
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                    No email address provided. Please sign up again.
                </p>
                <a 
                    href="/signup" 
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium rounded-xl shadow-lg shadow-violet-500/30 hover:from-violet-700 hover:to-purple-700 transition-all duration-200"
                >
                    Go to Sign Up
                </a>
            </div>
        );
    }

    return (
        <div className="text-center py-8">
            {/* Email Icon */}
            <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
            </div>

            <h1 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">
                Check Your Email
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-6">
                We&apos;ve sent a verification link to
            </p>
            
            {/* Email Display */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-6">
                <p className="text-slate-900 dark:text-white font-medium break-all">
                    {email}
                </p>
            </div>

            <p className="text-slate-600 dark:text-slate-400 text-sm mb-8 leading-relaxed">
                Click the link in the email to verify your account and complete your registration. 
                The link will expire in 24 hours.
            </p>

            {/* Resend Button */}
            <div className="space-y-4">
                <Button
                    onClick={handleResend}
                    disabled={isResending || cooldownSeconds > 0}
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
                    ) : cooldownSeconds > 0 ? (
                        `Resend in ${cooldownSeconds}s`
                    ) : (
                        "Resend Verification Email"
                    )}
                </Button>

                {/* Help Text */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-left">
                    <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
                        <strong>Didn&apos;t receive the email?</strong>
                    </p>
                    <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                        <li>Check your spam or junk folder</li>
                        <li>Make sure you entered the correct email address</li>
                        <li>Wait a few minutes and try resending</li>
                    </ul>
                </div>

                {/* Navigation Links */}
                <div className="flex flex-col gap-3 pt-4">
                    <a 
                        href="/signin" 
                        className="inline-flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Sign In
                    </a>
                    <a 
                        href="/signup" 
                        className="inline-flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                    >
                        Create a different account
                    </a>
                </div>
            </div>
        </div>
    );
}

export default function CheckEmailPage() {
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
                                <CheckEmailContent />
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

