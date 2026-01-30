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
import { useJoinWorkspaceWithToken } from '@/src/hooks/useWorkspace';
import { toast } from 'sonner';

const JoinWorkspaceSchema = z.object({
    invitationCode: z.string().min(1, "Invitation code is required"),
});

type JoinWorkspacePayload = z.infer<typeof JoinWorkspaceSchema>;

export default function JoinWorkspacePage() {
    const router = useRouter();
    
    // Track that user is on join-workspace page
    useTrackOnboarding();
    const completeOnboarding = useCompleteOnboarding();
    const { mutate: joinWorkspace, isPending } = useJoinWorkspaceWithToken();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<JoinWorkspacePayload>({
        resolver: zodResolver(JoinWorkspaceSchema),
    });

    // Note: Workspace joining tokens are stored but not auto-joined
    // User must manually enter tokens to join workspaces

    const onSubmit = (data: JoinWorkspacePayload) => {
        joinWorkspace(
            { joining_token: data.invitationCode },
            {
                onSuccess: (result) => {
                    toast.success(`Successfully joined ${result.workspace_name}`);
                    completeOnboarding(`/dashboard?workspace=${result.workspace_id}`);
                },
                onError: (error: any) => {
                    const errorMessage = error?.response?.data?.detail || error?.message || "Failed to join workspace";
                    toast.error(errorMessage);
                }
            }
        );
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
                            Enter the workspace joining token you received in your invitation email to join a brainspace
                        </p>

                        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                            {/* Workspace Joining Token input */}
                            <div>
                                <label htmlFor="invitationCode" className="block text-sm font-medium mb-2">
                                    Workspace Joining Token
                                </label>
                                <input
                                    id="invitationCode"
                                    type="text"
                                    placeholder="Paste workspace joining token from your invitation email"
                                    {...register("invitationCode")}
                                    className="border p-3 w-full rounded-md dark:bg-gray-800 dark:border-gray-700"
                                    disabled={isPending}
                                />
                                {errors.invitationCode && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.invitationCode.message}
                                    </p>
                                )}
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    You can find this token in the invitation email you received
                                </p>
                            </div>

                            {/* Submit */}
                            <Button 
                                type="submit" 
                                className="w-full" 
                                size="lg"
                                    disabled={isPending}
                            >
                                {isPending ? "Joining..." : "Join Brainspace"}
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

