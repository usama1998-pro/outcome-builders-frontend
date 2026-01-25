"use client";

import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, Suspense } from "react";
import { ToggleThemeButton } from '@/components/ToggleThemeButton';
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import { verify2FA, resend2FACode } from "@/src/api/auth";
import { useLogin } from "@/src/hooks/useAuth";

function TwoFAVerificationContent() {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cooldownSeconds, setCooldownSeconds] = useState(0);
    const [isResending, setIsResending] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    
    const searchParams = useSearchParams();
    const router = useRouter();
    const login = useLogin();
    
    const email = searchParams.get("email");
    const initialCooldown = searchParams.get("cooldown");

    useEffect(() => {
        if (!email) {
            router.push("/signin");
        }
        
        // Set initial cooldown from query param
        if (initialCooldown) {
            setCooldownSeconds(parseInt(initialCooldown, 10));
        }
    }, [email, initialCooldown, router]);

    // Cooldown timer
    useEffect(() => {
        if (cooldownSeconds > 0) {
            const timer = setTimeout(() => {
                setCooldownSeconds(cooldownSeconds - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldownSeconds]);

    // Focus first input on mount
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handleChange = (index: number, value: string) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all digits entered
        if (value && index === 5 && newCode.every(d => d !== '')) {
            handleSubmit(newCode.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pastedData.length === 6) {
            const newCode = pastedData.split('');
            setCode(newCode);
            inputRefs.current[5]?.focus();
            handleSubmit(pastedData);
        }
    };

    const handleSubmit = async (codeStr?: string) => {
        const fullCode = codeStr || code.join('');
        
        if (fullCode.length !== 6 || !email) {
            toast.error("Please enter a valid 6-digit code");
            return;
        }

        setIsSubmitting(true);
        
        try {
            const response = await verify2FA({ email, code: fullCode });
            
            if (response?.data?.token) {
                toast.success("Verification successful!");
                await login(response.data.token, response.data.user_id);
            } else {
                toast.error("Verification failed. Please try again.");
            }
        } catch (error: unknown) {
            const axiosError = error as {
                response?: {
                    data?: {
                        detail?: string;
                    };
                };
            };
            
            const errorMessage = axiosError.response?.data?.detail || "Invalid verification code. Please try again.";
            toast.error(errorMessage);
            
            // Clear the code on error
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResend = async () => {
        if (cooldownSeconds > 0 || !email) return;
        
        setIsResending(true);
        
        try {
            const response = await resend2FACode({ email });
            setCooldownSeconds(response?.data?.can_resend_in || 60);
            toast.success("Verification code sent to your email.");
        } catch (error: unknown) {
            const axiosError = error as {
                response?: {
                    data?: {
                        detail?: string;
                        can_resend_in?: number;
                    };
                };
            };
            
            if (axiosError.response?.data?.can_resend_in) {
                setCooldownSeconds(axiosError.response.data.can_resend_in);
            }
            
            const errorMessage = axiosError.response?.data?.detail || "Failed to resend code. Please try again.";
            toast.error(errorMessage);
        } finally {
            setIsResending(false);
        }
    };

    if (!email) {
        return (
            <div className="flex items-center justify-center py-8">
                <svg className="animate-spin h-8 w-8 text-violet-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            </div>
        );
    }

    return (
        <>
            {/* Icon */}
            <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                </div>
            </div>

            <h1 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">
                Two-Factor Authentication
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-2">
                Enter the 6-digit code sent to
            </p>
            <p className="text-violet-600 dark:text-violet-400 text-center font-medium mb-8">
                {email}
            </p>

            {/* Code Input */}
            <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
                {code.map((digit, index) => (
                    <input
                        key={index}
                        ref={(el) => { inputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-12 h-14 text-center text-2xl font-bold bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all duration-200"
                        disabled={isSubmitting}
                    />
                ))}
            </div>

            {/* Expiry Notice */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-blue-700 dark:text-blue-300 text-left">
                        This code expires in <strong>10 minutes</strong>. Check your spam folder if you don&apos;t see the email.
                    </p>
                </div>
            </div>

            {/* Submit Button */}
            <Button 
                onClick={() => handleSubmit()}
                disabled={isSubmitting || code.some(d => d === '')} 
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
                {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Verifying...
                    </span>
                ) : (
                    "Verify Code"
                )}
            </Button>

            {/* Resend Button */}
            <button
                onClick={handleResend}
                disabled={cooldownSeconds > 0 || isResending}
                className={`w-full py-3 rounded-xl font-medium transition-all duration-200 ${
                    cooldownSeconds > 0
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                        : 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/50'
                }`}
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
                    <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Resend code in {cooldownSeconds}s
                    </span>
                ) : (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Resend Code
                    </span>
                )}
            </button>

            <div className="text-center pt-6">
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
    );
}

export default function TwoFAVerificationPage() {
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
                                <TwoFAVerificationContent />
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

