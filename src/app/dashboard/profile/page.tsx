"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { ToggleThemeButton } from "../../../../components/ToggleThemeButton";
import { use, useEffect } from "react";
import { useUserProfile } from "@/src/hooks/useProfile";
import { formatDate } from "@/src/utils/dateTimeFormat";
import { FaGithub, FaInstagram, FaLinkedin, FaTwitch } from "react-icons/fa";

export default function DashboardWorkspace() {
    const { data, isLoading, isError, error } = useUserProfile();

    // useEffect(() => {
    //     console.log(data);
    // }, [data])


    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 gap-3">
            <div className="w-full border-b-2 border-dashed pb-4 mb-4">
                <p className="text-3xl font-bold">Profile</p>
                <div className="absolute top-4 right-4">
                    <ToggleThemeButton />
                </div>

            </div>

            <div className="w-full h-full flex flex-row justify-between space-y-6 gap-3">

                <div className="w-[50%] h-full border-2 rounded pb-4 flex flex-col items-center justify-center p-6 gap-5">
                    <div className="w-full flex items-center justify-center flex-col">
                        <h1 className="font-bold">{data?.data.full_name}</h1>
                        <p>{data?.data.email}</p>
                        <p className="text-emerald-700">Premium</p>
                    </div>

                    <Avatar className="w-50 h-50 mb-4 border-gray-700 border-10">
                        <AvatarImage src="" alt="Profile Picture" />
                        <AvatarFallback>
                            <User className="w-20 h-20" />
                        </AvatarFallback>
                    </Avatar>
                    <div className="w-full flex flex-col items-center justify-center">
                        <p className="font-bold">Joined On</p>
                        <p>{formatDate(data?.data.created_at || "")}</p>
                    </div>

                </div>

                <div className="w-full border-2 rounded pb-1 flex flex-col items-start justify-start p-6 gap-5">
                    <p className="text-2xl font-bold">Bio</p>
                    <textarea defaultValue={data?.data.description} className="w-full h-[35vh] border-2 rounded p-4"></textarea>
                </div>
            </div>

            <div className="w-full flex flex-col justify-start items-start border-2 rounded pb-4 p-6 gap-5">
                <p className="text-2xl font-bold">Social Media Links</p>
                <div className="w-full flex flex-row gap-3">
                    <FaInstagram></FaInstagram>
                    <FaLinkedin></FaLinkedin>
                    <FaTwitch></FaTwitch>
                    <FaGithub></FaGithub>
                </div>
            </div>

            <div></div>
        </div>
    );
}
