"use client";

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Mail, User, Phone, Save } from "lucide-react";
import { ToggleThemeButton } from "../../../../components/ToggleThemeButton";

export default function DashboardWorkspace() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 gap-3">
            <div className="w-full border-b-2 border-dashed pb-4 mb-4">
                <p className="text-3xl font-bold">Profile</p>
                <div className="absolute top-4 right-4">
                    <ToggleThemeButton />
                </div>

            </div>

            <div className="w-full h-full flex flex-row justify-between space-y-6 gap-3">

                <div className="w-[50%] h-full border-2 rounded pb-4 flex flex-col items-center p-6 gap-5">
                    <div className="w-full flex items-center justify-center flex-col">
                        <h1 className="font-bold">Muhammad Usama</h1>
                        <p className="text-emerald-700">Premium</p>
                    </div>

                    <Avatar className="w-50 h-50 mb-4 border-gray-700 border-10">
                        <AvatarImage src="" alt="Profile Picture" />
                        <AvatarFallback>
                            <User className="w-20 h-20" />
                        </AvatarFallback>
                    </Avatar>


                </div>

                <div className="w-full border-2 rounded pb-4 flex flex-col items-start justify-start p-6 gap-5">
                    <p className="text-2xl font-bold">Bio</p>
                </div>
            </div>

            <div className="w-full flex flex-col justify-start items-start border-2 rounded pb-4 p-6 gap-5">
                <p className="text-2xl font-bold">Your Workspaces</p>
            </div>

            <div className="w-full flex flex-col justify-start items-start border-2 rounded pb-4 p-6 gap-5">
                <p className="text-2xl font-bold">Joined Workspaces</p>
            </div>



            <div></div>
        </div>
    );
}
