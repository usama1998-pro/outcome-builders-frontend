"use client";

import React from "react";
import ChatSidePanel from "@/src/components/SidePanel/ChatSidePanel";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ToggleThemeButton } from "@/components/ToggleThemeButton";
import { useUserTenants } from "@/src/hooks/useAuth";
import { useAuthStore } from "@/src/store/useAuth";
import RequireAuth from "@/src/components/auth/requireAuth";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Building } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useOrganizationDetails } from "@/src/hooks/useOrganization";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
    const { data: tenants, isLoading: tenantsLoading } = useUserTenants();
    const currentTenantId = useAuthStore((s) => s.tenantId);
    const setTenantId = useAuthStore((s) => s.setTenantId);
    const queryClient = useQueryClient();
    const { data: organization } = useOrganizationDetails(currentTenantId || 0);

    const currentTenant = tenants?.find((t) => t.id === currentTenantId);


    // Set default tenant if none is selected and user has tenants
    React.useEffect(() => {
        if (!currentTenantId && tenants && tenants.length > 0) {
            setTenantId(tenants[0].id);
        }
    }, [tenants, currentTenantId, setTenantId]);

    const handleOrganizationChange = (value: string) => {
        const newTenantId = Number(value);
        if (newTenantId && newTenantId !== currentTenantId) {
            setTenantId(newTenantId);
            // Clear query cache to refetch data for the new organization
            queryClient.clear();
        }
    };

    return (
        <RequireAuth>
            <SidebarProvider>
                {/* Gradient Background */}
                <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-muted/30 -z-10" />
                <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-500/8 via-transparent to-transparent pointer-events-none -z-10" />
                <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent pointer-events-none -z-10" />

                {/* Theme Toggle */}
                <div className="fixed top-4 right-4 z-50">
                    <ToggleThemeButton />
                </div>

                <div className="flex flex-row w-screen h-screen p-0 m-0">
                    {/* Sidebar */}
                    <ChatSidePanel />

                    {/* Main content area */}
                    <div className="flex flex-col flex-1 relative">

                        {/* Organization Switcher - Above chat content only */}
                        <div className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
                            <div className="flex items-center justify-between px-4 py-3 relative z-10">
                                {/* Organization Switcher */}
                                <div className="flex items-center gap-3">
                                    {tenants && tenants.length > 0 && (
                                        <Select
                                            value={currentTenantId ? String(currentTenantId) : undefined}
                                            onValueChange={handleOrganizationChange}
                                            disabled={tenantsLoading || tenants.length === 0}
                                        >
                                            <SelectTrigger className="w-[200px] sm:w-[240px] bg-background/80 backdrop-blur-sm border shadow-sm">
                                                <Building className="h-4 w-4 text-muted-foreground" />
                                                <SelectValue placeholder="Select organization" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {tenants.map((tenant) => (
                                                    <SelectItem key={tenant.id} value={String(tenant.id)}>
                                                        <div className="flex items-center gap-2">
                                                            <Building className="h-3.5 w-3.5 text-muted-foreground" />
                                                            <span>{tenant.company_name}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Trigger pinned at the top */}
                        <div className="absolute top-4 left-4 z-40">
                            <SidebarTrigger className="bg-background/80 backdrop-blur-sm border shadow-sm rounded-lg p-2 hover:bg-accent transition-colors" />
                        </div>

                        <main className="m-0 p-0 flex-1 flex flex-col overflow-hidden relative z-10">
                            {children}
                        </main>
                    </div>
                </div>
            </SidebarProvider>
        </RequireAuth>
    );
}
