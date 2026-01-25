"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronUp, User2, Building2, UserPlus, Users, LayoutDashboard, Brain, MessageSquare, FolderOpen } from "lucide-react";
import { useSignOut, useUserTenants } from "@/src/hooks/useAuth";
import { useAuthStore } from "@/src/store/useAuth";
import { useUserPermissions, PERMISSIONS } from "@/src/hooks/useUserPermissions";
import { useUserProfile } from "@/src/hooks/useProfile";
import { useUserWorkspaces } from "@/src/hooks/useWorkspace";

export default function SidePanel() {
    const pathname = usePathname();
    const signOut = useSignOut();
    const currentTenantId = useAuthStore((s) => s.tenantId);
    const { data: tenants } = useUserTenants();
    const { data: userProfile } = useUserProfile();
    const { data: workspaces } = useUserWorkspaces();

    // Permission checks - hide elements until permissions are loaded and confirmed
    const { hasPermission, isOwnerOrAdmin, isLoading: permissionsLoading } = useUserPermissions();

    // Get display name - prefer full_name, fallback to email, truncate if too long
    const getDisplayName = () => {
        const name = userProfile?.data?.full_name || userProfile?.data?.email || "User";
        if (name.length > 20) {
            return name.substring(0, 17) + "...";
        }
        return name;
    };

    // Truncate text helper
    const truncateText = (text: string, maxLength: number) => {
        if (text.length > maxLength) {
            return text.substring(0, maxLength - 3) + "...";
        }
        return text;
    };
    
    // Only show once permissions are loaded AND user has access
    const canViewTeam = !permissionsLoading && (
        hasPermission(PERMISSIONS.ADMIN_MANAGE) || 
        hasPermission(PERMISSIONS.USER_INVITE) || 
        isOwnerOrAdmin
    );

    // Find the current tenant
    const currentTenant = tenants?.find((t) => t.id === currentTenantId);

    return (
        <Sidebar>
            <SidebarContent>
                {/* Organization */}
                <SidebarGroup>
                    <SidebarGroupLabel>Organization</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link
                                        href="/dashboard/organization"
                                        className={`px-2 py-1 rounded ${pathname === "/dashboard/organization" ? "bg-gray-300 font-semibold" : "hover:bg-gray-200"
                                            }`}
                                    >
                                        <Building2 className="mr-2 h-4 w-4" />
                                        <span className="flex-1 text-left truncate">
                                            {currentTenant?.company_name || "Organization"}
                                        </span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            {/* Join Organization Link */}
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link
                                        href="/register-company"
                                        className={`px-2 py-1 rounded ${pathname === "/register-company" ? "bg-gray-300 font-semibold" : "hover:bg-gray-200"
                                            }`}
                                    >
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Join Organization
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Application Links */}
                <SidebarGroup>
                    <SidebarGroupLabel>Application</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link
                                        href="/dashboard"
                                        className={`px-2 py-1 rounded ${pathname === "/dashboard" ? "bg-gray-300 font-semibold" : "hover:bg-gray-200"
                                            }`}
                                    >
                                        <LayoutDashboard className="mr-2 h-4 w-4" />
                                        Dashboard
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link
                                        href="/dashboard/workspaces"
                                        className={`px-2 py-1 rounded ${pathname === "/dashboard/workspaces" ? "bg-gray-300 font-semibold" : "hover:bg-gray-200"
                                            }`}
                                    >
                                        <Brain className="mr-2 h-4 w-4" />
                                        Brainspace
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            {/* Join Brainspace Link */}
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link
                                        href="/join-workspace"
                                        className={`px-2 py-1 rounded ${pathname === "/join-workspace" ? "bg-gray-300 font-semibold" : "hover:bg-gray-200"
                                            }`}
                                    >
                                        <Users className="mr-2 h-4 w-4" />
                                        Join Brainspace
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link
                                        href="/chat"
                                        className={`px-2 py-1 rounded ${pathname === "/chat" ? "bg-gray-300 font-semibold" : "hover:bg-gray-200"
                                            }`}
                                    >
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        Chat
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            {canViewTeam && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link
                                            href="/dashboard/admins"
                                            className={`px-2 py-1 rounded ${pathname === "/dashboard/admins" ? "bg-gray-300 font-semibold" : "hover:bg-gray-200"
                                                }`}
                                        >
                                            <Users className="mr-2 h-4 w-4" />
                                            Team
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                        </SidebarMenu>

                    </SidebarGroupContent>
                </SidebarGroup>

                {/* My Brainspaces */}
                {workspaces && workspaces.length > 0 && (
                    <SidebarGroup>
                        <SidebarGroupLabel>My Brainspaces</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {workspaces.map((workspace) => (
                                    <SidebarMenuItem key={workspace.id}>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href={`/dashboard/workspaces/${workspace.id}/collections`}
                                                className={`px-2 py-1 rounded flex flex-col items-start gap-0 ${
                                                    pathname === `/dashboard/workspaces/${workspace.id}/collections` 
                                                        ? "bg-gray-300 font-semibold" 
                                                        : "hover:bg-gray-200"
                                                }`}
                                                title={`${workspace.title} - ${workspace.tenant?.company_name || "Unknown Org"}`}
                                            >
                                                <div className="flex items-center w-full">
                                                    <FolderOpen className="mr-2 h-4 w-4 shrink-0" />
                                                    <span className="truncate flex-1">
                                                        {truncateText(workspace.title, 18)}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-muted-foreground ml-6 truncate w-full">
                                                    {truncateText(workspace.tenant?.company_name || "Unknown Org", 20)}
                                                </span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton className="w-full">
                                    <User2 className="shrink-0" />
                                    <span className="truncate flex-1 text-left" title={userProfile?.data?.full_name || userProfile?.data?.email}>
                                        {getDisplayName()}
                                    </span>
                                    <ChevronUp className="ml-auto shrink-0" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                side="top"
                                className="w-[--radix-popper-anchor-width]"
                            >
                                <DropdownMenuItem>
                                    <Link href={'/dashboard/profile'}>Profile</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <span>Billing</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={signOut}>
                                    <span>Sign out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );


    // <div className="w-[300px] h-screen flex item-center justify-around flex-col p-10 overflow-y-auto bg-black text-white border-r-2 border-[#696E79]">
    //         <div className="height-[200px] border-[#696E79]-2 border-b-2 pb-4 mb-4">
    //             <h1 className="text-[#01C38D] text-2xl" >Company Name</h1>
    //         </div>

    //         <div className="flex flex-col gap-4">
    //             {/* <p className="text-[#01C38D] text-2xl">Home</p> */}
    //             {links.map((link) => (
    //                 <Link
    //                     key={link.href}
    //                     href={link.href}
    //                     className={`px-2 py-1 rounded ${pathname === link.href ? "bg-gray-300 font-semibold" : "hover:bg-gray-200"
    //                         }`}
    //                 >
    //                     {link.label}
    //                 </Link>
    //             ))}
    //         </div>

    //         <div className="border-t-2 border-[#696E79] pt-4">
    //             <p className="text-[#01C38D]">Muhammad Usama</p>
    //         </div>

    //     </div>
}