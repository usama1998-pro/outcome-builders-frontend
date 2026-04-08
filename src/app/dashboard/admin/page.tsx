"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Shield,
    Building2,
    Building,
    Users,
    UserPlus,
    KeyRound,
    ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RequireAuth from "@/src/components/auth/requireAuth";
import BlocksLoader from "@/src/components/Loaders/BlocksLoader/BlocksLoader";
import { useUserPermissions, PERMISSIONS } from "@/src/hooks/useUserPermissions";

type AdminTile = {
    title: string;
    description: string;
    href: string;
    icon: ReactNode;
    visible: boolean;
};

export default function AdminHubPage() {
    const router = useRouter();
    const { hasPermission, isOwnerOrAdmin, isSuperuser, role, isLoading: permissionsLoading } = useUserPermissions();

    const canAccessPage =
        isSuperuser || role?.toLowerCase() === "superuser";

    const canInviteUsers = hasPermission(PERMISSIONS.USER_INVITE) || isOwnerOrAdmin;
    const canManageRoles = hasPermission(PERMISSIONS.ROLE_MANAGE) || isOwnerOrAdmin;

    useEffect(() => {
        if (!permissionsLoading && !canAccessPage) {
            toast.error("You don't have permission to access this page");
            router.push("/dashboard");
        }
    }, [permissionsLoading, canAccessPage, router]);

    if (permissionsLoading) {
        return (
            <RequireAuth>
                <div className="w-full h-full flex items-center justify-center p-5">
                    <BlocksLoader />
                </div>
            </RequireAuth>
        );
    }

    if (!canAccessPage) {
        return (
            <RequireAuth>
                <div className="w-full h-full flex items-center justify-center p-5">
                    <BlocksLoader />
                </div>
            </RequireAuth>
        );
    }

    const tiles: AdminTile[] = [
        {
            title: "Organization list",
            description: "See every organization you can access and switch context.",
            href: "/dashboard/organizations",
            icon: <Building2 className="h-6 w-6 text-[#DB2B30]" />,
            visible: true,
        },
        {
            title: "Current organization",
            description: "Profile, branding, and settings for the selected organization.",
            href: "/dashboard/organization",
            icon: <Building className="h-6 w-6 text-[#DB2B30]" />,
            visible: true,
        },
        {
            title: "Team & members",
            description: "Owners, admins, members, and workspace access.",
            href: "/dashboard/admins",
            icon: <Users className="h-6 w-6 text-[#DB2B30]" />,
            visible: true,
        },
        {
            title: "Create accounts",
            description: "Invite people by email and assign a role.",
            href: "/dashboard/admins/invite",
            icon: <UserPlus className="h-6 w-6 text-[#DB2B30]" />,
            visible: canInviteUsers,
        },
        {
            title: "Assign roles",
            description: "Custom roles and permissions for your organization.",
            href: "/dashboard/admins?tab=roles",
            icon: <KeyRound className="h-6 w-6 text-[#DB2B30]" />,
            visible: canManageRoles,
        },
    ];

    const visibleTiles = tiles.filter((t) => t.visible);

    return (
        <RequireAuth>
            <div className="w-full min-h-full flex flex-col items-center p-6">
                <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-8">
                    <div className="w-full text-center border-b-2 border-dashed pb-4">
                        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
                            <Shield className="h-8 w-8 text-[#DB2B30]" />
                            Admin
                        </h1>
                        <p className="text-muted-foreground mt-2 text-sm max-w-xl mx-auto">
                            Organization and account management for your workspace.
                        </p>
                    </div>

                    <div className="w-full flex flex-wrap justify-center gap-4">
                        {visibleTiles.map((tile) => (
                            <Link
                                key={tile.href}
                                href={tile.href}
                                className="group block w-full max-w-sm sm:w-[280px] sm:max-w-none shrink-0"
                            >
                                <Card className="h-full transition-colors hover:border-[#DB2B30]/40 hover:bg-muted/30">
                                    <CardHeader className="flex flex-col items-center text-center gap-3 space-y-0 pb-4 pt-6">
                                        <div className="rounded-lg border border-border bg-background p-3">
                                            {tile.icon}
                                        </div>
                                        <div className="min-w-0 w-full">
                                            <CardTitle className="text-lg font-semibold group-hover:text-[#DB2B30] transition-colors">
                                                {tile.title}
                                            </CardTitle>
                                            <CardDescription className="mt-2">{tile.description}</CardDescription>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-[#DB2B30] transition-colors" />
                                    </CardHeader>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </RequireAuth>
    );
}
