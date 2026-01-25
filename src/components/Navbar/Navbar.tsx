"use client";

import Image from 'next/image';
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
} from "@/components/ui/navigation-menu";
import { ToggleThemeButton } from "../../../components/ToggleThemeButton";
import { useAuthStore } from "../../store/useAuth";

export default function Navbar() {
    const token = useAuthStore((s) => s.token);

    return (
        <>
            <nav className="w-full p-4 bg-background border-b border-border">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Logo / Brand */}
                    <Link href="/" className="flex items-center space-x-2" passHref>
                        <Image
                            src="/assets/Primary-Logo-Line-White.png"
                            alt="outcome builder logo"
                            className="hidden dark:block"
                            width={200}
                            height={200}
                        />

                        <Image
                            src="/assets/Primary-Logo-Line-Black.png"
                            alt="outcome builder logo"
                            width={200}
                            height={200}
                            className="dark:hidden"
                        />
                    </Link>

                    {/* Navigation Links */}
                    <NavigationMenu>
                        <NavigationMenuList>
                            {token ? (
                                <NavigationMenuItem>
                                    <Link href="/dashboard" className={cn("px-3 py-2 hover:underline")} passHref>
                                        Dashboard
                                    </Link>
                                </NavigationMenuItem>
                            ) : (
                                <>
                                    <NavigationMenuItem>
                                        <Link href="/signin" className={cn("px-3 py-2 hover:underline")} passHref>
                                            Sign In
                                        </Link>
                                    </NavigationMenuItem>

                                    <NavigationMenuItem>
                                        <Link href="/signup" className={cn("px-3 py-2 hover:underline")} passHref>
                                            Sign Up
                                        </Link>
                                    </NavigationMenuItem>
                                </>
                            )}
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
