"use client";

import Image from 'next/image';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { ToggleThemeButton } from '@/components/ToggleThemeButton';
import { z } from "zod";
import { toast } from "sonner";
import { forgotPassword } from "@/src/api/auth";

const ForgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
});

type ForgotPasswordData = z.infer<typeof ForgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState("");
    const [cooldownSeconds, setCooldownSeconds] = useState(0);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordData>({
        resolver: zodResolver(ForgotPasswordSchema),
    });

    // Cooldown timer
    useEffect(() => {
        if (cooldownSeconds > 0) {
            const timer = setTimeout(() => {
                setCooldownSeconds(cooldownSeconds - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldownSeconds]);

    const sendResetEmail = useCallback(async (email: string) => {
        setIsSubmitting(true);
        
        try {
            await forgotPassword({ email });
            setIsSubmitted(true);
            setSubmittedEmail(email);
            setCooldownSeconds(60); // 1 minute cooldown
            toast.success("If an account exists with this email, you will receive a password reset link.");
        } catch (error) {
            // Still show success for security (prevent email enumeration)
            setIsSubmitted(true);
            setSubmittedEmail(email);
            setCooldownSeconds(60);
            toast.success("If an account exists with this email, you will receive a password reset link.");
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    const onSubmit = async (data: ForgotPasswordData) => {
        await sendResetEmail(data.email);
    };

    const handleResend = async () => {
        if (cooldownSeconds > 0 || !submittedEmail) return;
        await sendResetEmail(submittedEmail);
    };

    return (
        <>
            <div className="absolute top-4 right-4">
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
                            {!isSubmitted ? (
                                <>
                                    {/* Icon */}
                                    <div className="flex justify-center mb-6">
                                        <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-violet-500/30">
                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                            </svg>
                                        </div>
                                    </div>

                                    <h1 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">
                                        Forgot Password?
                                    </h1>
                                    <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-8">
                                        No worries! Enter your email and we&apos;ll send you a reset link.
                                    </p>
                                    
                                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                        {/* Email input */}
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                placeholder="you@example.com"
                                                {...register("email")}
                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all duration-200"
                                            />
                                            {errors.email && (
                                                <p className="mt-2 text-sm text-red-500 dark:text-red-400">{errors.email.message}</p>
                                            )}
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
                                                    Sending...
                                                </span>
                                            ) : (
                                                "Send Reset Link"
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
                            ) : (
                                <div className="text-center py-4">
                                    {/* Success Icon */}
                                    <div className="flex justify-center mb-6">
                                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    </div>

                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                                        Check Your Email
                                    </h2>
                                    <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                                        If an account exists with <strong className="text-slate-700 dark:text-slate-300">{submittedEmail}</strong>, you&apos;ll receive a password reset link shortly.
                                    </p>

                                    {/* Info Box */}
                                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4 mb-6">
                                        <div className="flex items-start gap-3">
                                            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <p className="text-sm text-amber-700 dark:text-amber-300 text-left">
                                                The link will expire in <strong>15 minutes</strong>. Don&apos;t forget to check your spam folder!
                                            </p>
                                        </div>
                                    </div>

                                    {/* Resend Button with Cooldown */}
                                    <div className="space-y-4">
                                        <button
                                            onClick={handleResend}
                                            disabled={cooldownSeconds > 0 || isSubmitting}
                                            className={`w-full py-3 rounded-xl font-medium transition-all duration-200 ${
                                                cooldownSeconds > 0
                                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                                    : 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/50'
                                            }`}
                                        >
                                            {isSubmitting ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    Sending...
                                                </span>
                                            ) : cooldownSeconds > 0 ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Resend in {cooldownSeconds}s
                                                </span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                    Resend Email
                                                </span>
                                            )}
                                        </button>

                                        <a 
                                            href="/signin" 
                                            className="inline-flex items-center justify-center gap-2 w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                            </svg>
                                            Return to Sign In
                                        </a>
                                    </div>
                                </div>
                            )}
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
