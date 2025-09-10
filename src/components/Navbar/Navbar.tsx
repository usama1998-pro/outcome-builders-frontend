"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
    // NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { ToggleThemeButton } from "../../../components/ToggleThemeButton";
import { use } from "react";
import { useAuthStore } from "../../store/useAuth";

export default function Navbar() {
    const token = useAuthStore((s) => s.token);

    console.log("Token in Navbar:", token);

    return (
        <>
            <nav className="w-full p-4 bg-background border-b border-border">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Logo / Brand */}
                    <Link href="/" className="text-2xl font-bold">
                        Outcome Builders
                    </Link>

                    {/* Navigation Links */}
                    <NavigationMenu>
                        <NavigationMenuList>
                            {
                                token && <NavigationMenuItem>
                                    <Link href="/dashboard" className={cn("px-3 py-2 hover:underline")} passHref>
                                        Dashboard
                                    </Link>
                                </NavigationMenuItem>

                            }


                            <NavigationMenuItem>
                                <Link href="/signup" className={cn("px-3 py-2 hover:underline")} passHref>
                                    Signup
                                </Link>
                            </NavigationMenuItem>

                            <NavigationMenuItem>
                                <Link href="/signin" className={cn("px-3 py-2 hover:underline")} passHref>
                                    Signin
                                </Link>
                            </NavigationMenuItem>

                        </NavigationMenuList>
                    </NavigationMenu>

                    <div className="absolute top-4 right-4">
                        <ToggleThemeButton />
                    </div>
                </div>
            </nav>

        </>




    );
}
