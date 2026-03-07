"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield, ShieldCheck, Moon, Sun, Palette, Bot, Save } from "lucide-react";
import { use2FAStatus, useToggle2FA } from "@/src/hooks/use2FA";
import { useGetUserSettings, useUpdateUserSettings } from "@/src/hooks/useUserSettings";
import { useTheme } from "next-themes";
import RequireAuth from "@/src/components/auth/requireAuth";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function SettingsPage() {
    const { data: twoFAData, isLoading: twoFALoading } = use2FAStatus();
    const { mutate: toggle2FA, isPending: isToggling2FA } = useToggle2FA();
    const { data: settingsData, isLoading: settingsLoading } = useGetUserSettings();
    const { mutate: updateSettings, isPending: isUpdatingSettings } = useUpdateUserSettings();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [customInstructions, setCustomInstructions] = useState("");

    // Handle theme mounting
    useEffect(() => {
        setMounted(true);
    }, []);

    // Load settings when data is available
    useEffect(() => {
        if (settingsData?.data) {
            setCustomInstructions(settingsData.data.custom_instructions || "");
        }
    }, [settingsData]);

    const handleSaveSettings = () => {
        updateSettings({ custom_instructions: customInstructions.trim() || null });
    };

    const maxLength = 2000;
    const remainingChars = maxLength - customInstructions.length;

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

                    {/* AI Chat Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bot className="h-5 w-5" />
                                AI Chat Settings
                            </CardTitle>
                            <CardDescription>
                                Customize how the AI assistant responds to you by providing personalized instructions
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="custom-instructions" className="text-base font-semibold">
                                    Custom Instructions
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Provide specific instructions or preferences for how the AI should respond to your questions. 
                                    These instructions will be included in every chat conversation.
                                </p>
                                <Textarea
                                    id="custom-instructions"
                                    placeholder="e.g., Always respond in a professional tone, use bullet points when listing items, focus on practical solutions..."
                                    value={customInstructions}
                                    onChange={(e) => setCustomInstructions(e.target.value)}
                                    maxLength={maxLength}
                                    rows={6}
                                    className="resize-none"
                                    disabled={settingsLoading || isUpdatingSettings}
                                />
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground">
                                        {remainingChars >= 0 
                                            ? `${remainingChars} characters remaining`
                                            : `${Math.abs(remainingChars)} characters over limit`
                                        }
                                    </p>
                                    <Button
                                        onClick={handleSaveSettings}
                                        disabled={settingsLoading || isUpdatingSettings || remainingChars < 0}
                                        className="flex items-center gap-2"
                                    >
                                        <Save className="h-4 w-4" />
                                        {isUpdatingSettings ? "Saving..." : "Save Settings"}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </RequireAuth>
    );
}

