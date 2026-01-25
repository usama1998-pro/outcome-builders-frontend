"use client";

import Image from 'next/image';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button"
// import styles from "./page.module.css";
import { useSignin } from "../../hooks/useSignin";
import { useState } from "react";
import { ToggleThemeButton } from '@/components/ToggleThemeButton';
import { SigninPayloadSchema, SigninPayload } from "../../schemas/signin";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function SignInForm() {
    const signIn = useSignin();
    const [showPassword, setShowPassword] = useState(false);

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

    return (
        <>
            <div className="absolute top-4 right-4">
                <ToggleThemeButton />
            </div>
            <div className="flex items-center justify-center h-screen">
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

                        {/* Forgot Password Link */}
                        <div className="text-right">
                            <a href="/forgot-password" className="text-sm text-blue-500 hover:underline">
                                Forgot Password?
                            </a>
                        </div>

                        {/* Submit */}
                        <Button type="submit" disabled={signIn.isPending}>
                            {signIn.isPending ? "Signing In..." : "Sign In"}
                        </Button>

                        <a href="/signup" className="text-sm text-blue-500 hover:underline mt-2 text-center">
                            {"Don't have an account? Sign Up"}
                        </a>
                    </form>
                </div>
            </div>

        </>

    );
}
