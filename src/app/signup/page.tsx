"use client";

import Image from 'next/image';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button"
import { useSignup } from "../../hooks/useSignup";
import { useState } from "react";
import { SignupFormSchema, SignupFormData } from "../../schemas/signup";
import { ToggleThemeButton } from '@/components/ToggleThemeButton';
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function SignUpForm() {
    const signUp = useSignup();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // setup form with zod validation
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignupFormData>({
        resolver: zodResolver(SignupFormSchema),
    });

    const onSubmit = (data: SignupFormData) => {
        // Only send email and password to API (not confirmPassword)
        signUp.mutate({ email: data.email, password: data.password });
    };

    return (
        <>
            <div className="absolute top-4 right-4">
                <ToggleThemeButton />
            </div>
            <div className="flex items-center justify-center h-screen flex-col">
                <div className="w-full max-w-md flex items-center justify-center flex-col px-4">

                    <Image
                        src="/assets/Primary-Logo-Stacked-Black.png"
                        alt="logo black"
                        className="dark:hidden"
                        width={300}
                        height={300}
                    />
                    <Image
                        src="/assets/Primary-Logo-Stacked-White.png"
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

                        {/* Confirm Password input */}
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm Password"
                                {...register("confirmPassword")}
                                className="border p-2 pr-10 w-full rounded"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            >
                                {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <p className="!text-red-500 dark:!text-red-400 text-sm">{errors.confirmPassword.message}</p>
                        )}

                        {/* Submit */}
                        <Button type="submit" disabled={signUp.isPending}>
                            {signUp.isPending ? "Signing Up..." : "Sign Up"}
                        </Button>

                        <a href="/signin" className="text-sm text-blue-500 hover:underline mt-2">
                            Already have an account? Sign In
                        </a>
                    </form>
                </div>
            </div>
        </>


    );
}