"use client";

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { ToggleThemeButton } from '@/components/ToggleThemeButton';
import { ArrowLeft } from 'lucide-react';
import { z } from 'zod';

const RegisterOrganizationSchema = z.object({
    organizationName: z.string().min(2, "Organization name must be at least 2 characters"),
    industry: z.string().optional(),
    size: z.string().optional(),
});

type RegisterOrganizationPayload = z.infer<typeof RegisterOrganizationSchema>;

export default function RegisterOrganizationPage() {
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterOrganizationPayload>({
        resolver: zodResolver(RegisterOrganizationSchema),
    });

    const onSubmit = (data: RegisterOrganizationPayload) => {
        // TODO: Implement the API call to register organization
        console.log("Registering organization:", data);
        // After successful registration, redirect to dashboard
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

                        <h1 className="text-3xl font-bold mb-2">Register Organization</h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Create your organization and start collaborating with your team
                        </p>

                        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                            {/* Organization Name */}
                            <div>
                                <label htmlFor="organizationName" className="block text-sm font-medium mb-2">
                                    Organization Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="organizationName"
                                    type="text"
                                    placeholder="Enter organization name"
                                    {...register("organizationName")}
                                    className="border p-3 w-full rounded-md dark:bg-gray-800 dark:border-gray-700"
                                />
                                {errors.organizationName && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.organizationName.message}
                                    </p>
                                )}
                            </div>

                            {/* Industry */}
                            <div>
                                <label htmlFor="industry" className="block text-sm font-medium mb-2">
                                    Industry (Optional)
                                </label>
                                <input
                                    id="industry"
                                    type="text"
                                    placeholder="e.g., Technology, Healthcare, Finance"
                                    {...register("industry")}
                                    className="border p-3 w-full rounded-md dark:bg-gray-800 dark:border-gray-700"
                                />
                            </div>

                            {/* Organization Size */}
                            <div>
                                <label htmlFor="size" className="block text-sm font-medium mb-2">
                                    Organization Size (Optional)
                                </label>
                                <select
                                    id="size"
                                    {...register("size")}
                                    className="border p-3 w-full rounded-md dark:bg-gray-800 dark:border-gray-700"
                                >
                                    <option value="">Select size</option>
                                    <option value="1-10">1-10 employees</option>
                                    <option value="11-50">11-50 employees</option>
                                    <option value="51-200">51-200 employees</option>
                                    <option value="201-500">201-500 employees</option>
                                    <option value="500+">500+ employees</option>
                                </select>
                            </div>

                            {/* Submit */}
                            <Button type="submit" className="w-full mt-2" size="lg">
                                Create Organization
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Already have an invitation?{' '}
                                <a
                                    href="/join-workspace"
                                    className="text-blue-500 hover:underline"
                                >
                                    Join workspace
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

