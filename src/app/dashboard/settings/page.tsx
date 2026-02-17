"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield, ShieldCheck, Moon, Sun, Palette } from "lucide-react";
import { use2FAStatus, useToggle2FA } from "@/src/hooks/use2FA";
import { useTheme } from "next-themes";
import RequireAuth from "@/src/components/auth/requireAuth";
import { useEffect, useState } from "react";

export default function SettingsPage() {
    const { data: twoFAData, isLoading: twoFALoading } = use2FAStatus();
    const { mutate: toggle2FA, isPending: isToggling2FA } = useToggle2FA();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Handle theme mounting
    useEffect(() => {
        setMounted(true);
    }, []);

    const is2FAEnabled = twoFAData?.data?.two_fa_enabled || false;
    const isDarkMode = theme === "dark";

    const handle2FAToggle = (enabled: boolean) => {
        toggle2FA({ enable: enabled });
    };

    const handleThemeToggle = (darkMode: boolean) => {
        setTheme(darkMode ? "dark" : "light");
    };

    return (
        <RequireAuth>
            <div className="w-full h-full flex flex-col items-center p-6 gap-6">
                {/* Header */}
                <div className="w-full border-b-2 border-dashed pb-4">
                    <h1 className="text-3xl font-bold">Settings</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your account settings and preferences
                    </p>
                </div>

                <div className="w-full max-w-4xl space-y-6">
                    {/* Security Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Security Settings
                            </CardTitle>
                            <CardDescription>
                                Manage your account security and authentication preferences
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Two-Factor Authentication */}
                            <div className="flex items-center justify-between">
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="2fa-toggle" className="text-base font-semibold cursor-pointer">
                                            Two-Factor Authentication
                                        </Label>
                                        {is2FAEnabled ? (
                                            <ShieldCheck className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Shield className="h-4 w-4 text-gray-400" />
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {is2FAEnabled
                                            ? "Your account is protected with two-factor authentication. You'll need to enter a verification code when signing in."
                                            : "Add an extra layer of security to your account by enabling two-factor authentication."}
                                    </p>
                                </div>
                                <Switch
                                    id="2fa-toggle"
                                    checked={is2FAEnabled}
                                    onCheckedChange={handle2FAToggle}
                                    disabled={twoFALoading || isToggling2FA}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Appearance Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="h-5 w-5" />
                                Appearance
                            </CardTitle>
                            <CardDescription>
                                Customize the look and feel of your application
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Dark Mode Toggle */}
                            <div className="flex items-center justify-between">
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="theme-toggle" className="text-base font-semibold cursor-pointer">
                                            Dark Mode
                                        </Label>
                                        {mounted && (
                                            isDarkMode ? (
                                                <Moon className="h-4 w-4 text-blue-500" />
                                            ) : (
                                                <Sun className="h-4 w-4 text-yellow-500" />
                                            )
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {mounted && (
                                            isDarkMode
                                                ? "Dark mode is currently enabled. Switch to light mode for a brighter interface."
                                                : "Light mode is currently enabled. Switch to dark mode for a darker interface."
                                        )}
                                    </p>
                                </div>
                                {mounted ? (
                                    <Switch
                                        id="theme-toggle"
                                        checked={isDarkMode}
                                        onCheckedChange={handleThemeToggle}
                                    />
                                ) : (
                                    <Switch
                                        id="theme-toggle"
                                        disabled
                                    />
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </RequireAuth>
    );
}

