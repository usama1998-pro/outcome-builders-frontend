"use client";

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { ToggleThemeButton } from '@/components/ToggleThemeButton';
import { ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { useTrackOnboarding, useCompleteOnboarding } from '@/src/hooks/useOnboarding';

const JoinWorkspaceSchema = z.object({
    invitationCode: z.string().min(1, "Invitation code is required"),
});

type JoinWorkspacePayload = z.infer<typeof JoinWorkspaceSchema>;

export default function JoinWorkspacePage() {
    const router = useRouter();
    
    // Track that user is on join-workspace page
    useTrackOnboarding();
    const completeOnboarding = useCompleteOnboarding();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<JoinWorkspacePayload>({
        resolver: zodResolver(JoinWorkspaceSchema),
    });

    const onSubmit = (data: JoinWorkspacePayload) => {
        // TODO: Implement the API call to join workspace with invitation code
        console.log("Joining workspace with code:", data.invitationCode);
        // After successful join:
        // 1. Call completeOnboarding() to mark onboarding as complete
        // 2. Redirect to dashboard
        // Example:
        // completeOnboarding();
        // router.push('/dashboard');
    };

    return (
        <>
            <div className="absolute top-4 right-4">
                <ToggleThemeButton />
            </div>
            <div className="flex items-center justify-center min-h-screen flex-col p-4">
                <div className="w-full max-w-md flex items-center justify-center flex-col">
                    <Image
                        src="/assets/Primary-Logo-Stacked-Black.png"
                        alt="logo black"
                        className="dark:hidden mb-8"
                        width={250}
                        height={250}
                    />
                    <Image
                        src="/assets/Primary-Logo-Stacked-White.png"
                        alt="logo white"
                        className="hidden dark:block mb-8"
                        width={250}
                        height={250}
                    />

                    <div className="w-full">
                        <Button
                            variant="ghost"
                            onClick={() => router.back()}
                            className="mb-4"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>

                        <h1 className="text-3xl font-bold mb-2">Join Brainspace</h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Enter the invitation code you received to join a brainspace
                        </p>

                        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                            {/* Invitation Code input */}
                            <div>
                                <label htmlFor="invitationCode" className="block text-sm font-medium mb-2">
                                    Invitation Code
                                </label>
                                <input
                                    id="invitationCode"
                                    type="text"
                                    placeholder="Enter invitation code"
                                    {...register("invitationCode")}
                                    className="border p-3 w-full rounded-md dark:bg-gray-800 dark:border-gray-700"
                                />
                                {errors.invitationCode && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.invitationCode.message}
                                    </p>
                                )}
                            </div>

                            {/* Submit */}
                            <Button type="submit" className="w-full" size="lg">
                                Join Brainspace
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Don't have an invitation code?{' '}
                                <a
                                    href="/register-company"
                                    className="text-blue-500 hover:underline"
                                >
                                    Register your organization
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

