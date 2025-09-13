"use client";

import Image from 'next/image';
import { useTheme } from "next-themes"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button"
import styles from "./page.module.css";
import { useSignup } from "../../hooks/useSignup";
import { useState } from "react";
import { SignupPayloadSchema, SignupPayload } from "../../schemas/signup";
import { ToggleThemeButton } from '@/components/ToggleThemeButton';

export default function SignUpForm() {
    const signUp = useSignup();
    const { theme, setTheme } = useTheme()

    // setup form with zod validation
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignupPayload>({
        resolver: zodResolver(SignupPayloadSchema),
    });

    const onSubmit = (data: SignupPayload) => {
        signUp.mutate(data); // email + password are already validated here
    };

    return (
        <>
            <div className="absolute top-4 right-4">
                <ToggleThemeButton />
            </div>
            <div className="flex items-center justify-center h-screen flex-col">
                <div className="w-64 h-64 flex items-center justify-center flex-col">

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

                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-6">
                        {/* Email input */}
                        <input
                            type="email"
                            placeholder="Email"
                            {...register("email")}
                            className="border p-2"
                        />
                        {errors.email && (
                            <p className="text-red-500 text-sm">{errors.email.message}</p>
                        )}

                        {/* Password input */}
                        <input
                            type="password"
                            placeholder="Password"
                            {...register("password")}
                            className="border p-2"
                        />
                        {errors.password && (
                            <p className="text-red-500 text-sm">{errors.password.message}</p>
                        )}

                        {/* Mutation error (server validation or network issues) */}
                        {signUp.isError && (
                            <p className="text-red-500 text-sm">
                                {(signUp.error as any)?.response?.data?.detail ||
                                    signUp.error.message ||
                                    "Something went wrong"}
                            </p>
                        )}

                        {/* Submit */}
                        <Button type="submit" disabled={signUp.isPending}>
                            {signUp.isPending ? "Signing in..." : "Sign In"}
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