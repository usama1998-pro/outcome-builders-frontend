"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button"
import styles from "./page.module.css";
import { useSignin } from "../../hooks/useSignin";
import { useState } from "react";
import { SigninPayloadSchema, SigninPayload } from "../../schemas/signin";

export default function SignInForm() {
    const signIn = useSignin();

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
            <div className="flex items-center justify-center h-screen">
                <div className="w-64 h-64 flex items-center justify-center flex-col">
                    <h1 className="font-bold text-6xl">O.B</h1>
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
                        {signIn.isError && (
                            <p className="text-red-500 text-sm">
                                {(signIn.error as any)?.response?.data?.detail ||
                                    signIn.error.message ||
                                    "Something went wrong"}
                            </p>
                        )}

                        {/* Submit */}
                        <Button type="submit" disabled={signIn.isPending}>
                            {signIn.isPending ? "Signing Up..." : "Sign Up"}
                        </Button>

                        <a href="/signup" className="text-sm text-blue-500 hover:underline mt-2">
                            {"Don't have an account? Sign Up"}
                        </a>
                    </form>
                </div>
            </div>

        </>

    );
}
