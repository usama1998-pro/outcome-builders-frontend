"use client";

import Image from 'next/image';
import Link from "next/link";
import { useTheme } from "next-themes"
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
    const { theme, setTheme } = useTheme()
    // console.log("theme in navbar", theme);

    return (
        <>
            <nav className="w-full p-4 bg-background border-b border-border">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Logo / Brand */}
                    <Link href="/" className="flex items-center space-x-2" passHref>
                        <Image
                            src="/assets/Primary-Logo-Line-White.png"      // path inside /public
                            alt="outcome builder logo"
                            className="hidden dark:block"
                            width={200}              // required: image width
                            height={200}             // required: image height

                        />

                        <Image
                            src="/assets/Primary-Logo-Line-Black.png"       // path inside /public
                            alt="outcome builder logo"
                            width={200}              // required: image width
                            height={200}             // required: image height
                            className="dark:hidden"
                        />
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
