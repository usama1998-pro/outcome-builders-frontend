"use client";

import Image from 'next/image';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ToggleThemeButton } from '@/components/ToggleThemeButton';
import { z } from "zod";
import { toast } from "sonner";

const ForgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
});

type ForgotPasswordData = z.infer<typeof ForgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordData>({
        resolver: zodResolver(ForgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordData) => {
        setIsSubmitting(true);
        
        // TODO: Implement forgot password API call when backend endpoint is ready
        // For now, simulate the request
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setIsSubmitting(false);
        setIsSubmitted(true);
        toast.success("If an account exists with this email, you will receive a password reset link.");
    };

    return (
        <>
            <div className="absolute top-4 right-4">
                <ToggleThemeButton />
            </div>
            <div className="flex items-center justify-center h-screen">
                <div className="w-80 flex items-center justify-center flex-col">
                    <Image
                        src="/assets/Primary-Logo-Stacked-Black.png"
                        alt="logo black"
                        className="dark:hidden"
                        width={200}
                        height={200}
                    />
                    <Image
                        src="/assets/Primary-Logo-Stacked-White.png"
                        alt="logo white"
                        className="hidden dark:block"
                        width={200}
                        height={200}
                    />

                    <h1 className="text-2xl font-bold mt-4 mb-2">Forgot Password</h1>
                    
                    {!isSubmitted ? (
                        <>
                            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                                Enter your email address and we&apos;ll send you a link to reset your password.
                            </p>
                            
                            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 w-full px-6">
                                {/* Email input */}
                                <input
                                    type="email"
                                    placeholder="Email"
                                    {...register("email")}
                                    className="border p-2 w-full rounded"
                                />
                                {errors.email && (
                                    <p className="text-red-500 text-sm">{errors.email.message}</p>
                                )}

                                {/* Submit */}
                                <Button type="submit" disabled={isSubmitting} className="w-full">
                                    {isSubmitting ? "Sending..." : "Send Reset Link"}
                                </Button>

                                <a href="/signin" className="text-sm text-blue-500 hover:underline text-center">
                                    Back to Sign In
                                </a>
                            </form>
                        </>
                    ) : (
                        <div className="text-center px-6">
                            <div className="text-green-600 dark:text-green-400 mb-4">
                                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                If an account exists with this email, you will receive a password reset link shortly.
                            </p>
                            <a href="/signin" className="text-sm text-blue-500 hover:underline">
                                Return to Sign In
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

