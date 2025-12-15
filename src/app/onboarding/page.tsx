"use client";

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ToggleThemeButton } from '@/components/ToggleThemeButton';
import { Building2, Users } from 'lucide-react';

export default function OnboardingPage() {
    const router = useRouter();

    const handleRegisterOrganization = () => {
        router.push('/register-company');
    };

    const handleJoinWorkspace = () => {
        router.push('/join-workspace');
    };

    return (
        <>
            <div className="absolute top-4 right-4">
                <ToggleThemeButton />
            </div>
            <div className="flex items-center justify-center min-h-screen flex-col p-4">
                <div className="max-w-4xl w-full flex items-center justify-center flex-col">
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

                    <h1 className="text-3xl font-bold mb-2 text-center">Welcome!</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 text-center">
                        Choose how you want to get started
                    </p>

                    <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl">
                        {/* Register Organization Card */}
                        <div className="border rounded-lg p-8 hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 flex flex-col">
                            <div className="flex items-center justify-center mb-4">
                                <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full">
                                    <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-300" />
                                </div>
                            </div>
                            <h2 className="text-xl font-semibold mb-3 text-center">Register Organization</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6 text-center flex-grow">
                                Create a new organization and invite team members to collaborate
                            </p>
                            <Button
                                onClick={handleRegisterOrganization}
                                className="w-full"
                                size="lg"
                            >
                                Register Organization
                            </Button>
                        </div>

                        {/* Join Workspace Card */}
                        <div className="border rounded-lg p-8 hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 flex flex-col">
                            <div className="flex items-center justify-center mb-4">
                                <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full">
                                    <Users className="w-8 h-8 text-green-600 dark:text-green-300" />
                                </div>
                            </div>
                            <h2 className="text-xl font-semibold mb-3 text-center">Join Workspace</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6 text-center flex-grow">
                                Join an existing workspace using an invitation code
                            </p>
                            <Button
                                onClick={handleJoinWorkspace}
                                variant="outline"
                                className="w-full"
                                size="lg"
                            >
                                Join Workspace
                            </Button>
                        </div>
                    </div>

                    <div className="mt-8">
                        <a href="/signin" className="text-sm text-blue-500 hover:underline">
                            Already set up? Sign In
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}

