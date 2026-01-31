"use client";
import { useState } from "react";
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
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronUp, ChevronDown, User2, Building2, UserPlus, Users, LayoutDashboard, Brain, MessageSquare, FolderOpen, Layers, FileText } from "lucide-react";
import { useSignOut, useUserTenants } from "@/src/hooks/useAuth";
import { useAuthStore } from "@/src/store/useAuth";
import { useUserPermissions, PERMISSIONS } from "@/src/hooks/useUserPermissions";
import { useUserProfile } from "@/src/hooks/useProfile";
import { useUserWorkspaces } from "@/src/hooks/useWorkspace";
import { useUserCollections } from "@/src/hooks/useCollection";
import { useQueries } from "@tanstack/react-query";
import api from "@/src/lib/axios";
import routes from "@/src/lib/routes";

export default function SidePanel() {
    const pathname = usePathname();
    const signOut = useSignOut();
    const currentTenantId = useAuthStore((s) => s.tenantId);
    const hydrated = useAuthStore((state) => state.hydrated);
    const { data: tenants } = useUserTenants();
    const { data: userProfile } = useUserProfile();
    const { data: workspaces } = useUserWorkspaces();
    const { data: collections } = useUserCollections();

    // Fetch notes count from all collections
    const noteQueries = useQueries({
        queries: (collections || []).map((collection) => ({
            queryKey: ["collectionNotes", collection.id, currentTenantId],
            queryFn: async () => {
                const { data } = await api.get(routes.notes.get, {
                    params: { collection_id: collection.id },
                });
                return data.data.notes || [];
            },
            enabled: !!collection.id && !!currentTenantId && hydrated && !!collections && collections.length > 0,
        })),
    });

    // Calculate total notes count
    const totalNotesCount = noteQueries.reduce((total, query) => {
        return total + (query.data?.length || 0);
    }, 0);
    
    // State for managing expanded organization groups
    const [expandedOrgs, setExpandedOrgs] = useState<Set<number>>(new Set());

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

    // Group workspaces by organization/tenant
    const groupedWorkspaces = workspaces?.reduce((acc, workspace) => {
        const orgId = workspace.tenantId;
        const orgName = workspace.tenant?.company_name || "Unknown Organization";
        
        if (!acc[orgId]) {
            acc[orgId] = {
                id: orgId,
                name: orgName,
                workspaces: []
            };
        }
        acc[orgId].workspaces.push(workspace);
        return acc;
    }, {} as Record<number, { id: number; name: string; workspaces: typeof workspaces }>) || {};

    // Toggle organization expansion
    const toggleOrg = (orgId: number) => {
        setExpandedOrgs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orgId)) {
                newSet.delete(orgId);
            } else {
                newSet.add(orgId);
            }
            return newSet;
        });
    };


    return (
        <Sidebar>
            <SidebarContent>
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

                {/* My Brainspaces - Tree Structure */}
                {Object.keys(groupedWorkspaces).length > 0 && (
                    <SidebarGroup>
                        <SidebarGroupLabel>My Brainspaces</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {Object.values(groupedWorkspaces).map((orgGroup) => {
                                    const isExpanded = expandedOrgs.has(orgGroup.id);
                                    const isActive = orgGroup.workspaces.some(
                                        ws => pathname.startsWith(`/dashboard/workspaces/${ws.id}`)
                                    );
                                    
                                    return (
                                        <SidebarMenuItem key={orgGroup.id}>
                                            <SidebarMenuButton
                                                onClick={() => toggleOrg(orgGroup.id)}
                                                isActive={isActive}
                                                className="w-full"
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        {isExpanded ? (
                                                            <ChevronDown className="h-4 w-4 shrink-0" />
                                                        ) : (
                                                            <ChevronUp className="h-4 w-4 shrink-0 rotate-[-90deg]" />
                                                        )}
                                                        <Building2 className="h-4 w-4 shrink-0" />
                                                        <span className="truncate flex-1">
                                                            {truncateText(orgGroup.name, 20)}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground shrink-0 ml-2">
                                                            ({orgGroup.workspaces.length})
                                                        </span>
                                                    </div>
                                                </div>
                                            </SidebarMenuButton>
                                            {isExpanded && (
                                                <SidebarMenuSub>
                                                    {orgGroup.workspaces.map((workspace) => {
                                                        const isWorkspaceActive = pathname.startsWith(
                                                            `/dashboard/workspaces/${workspace.id}`
                                                        );
                                                        return (
                                                            <SidebarMenuSubItem key={workspace.id}>
                                                                <SidebarMenuSubButton
                                                                    asChild
                                                                    isActive={isWorkspaceActive}
                                                                >
                                                                    <Link
                                                                        href={`/dashboard/workspaces/${workspace.id}/collections`}
                                                                        title={workspace.title}
                                                                    >
                                                                        <FolderOpen className="h-4 w-4" />
                                                                        <span className="truncate">
                                                                            {truncateText(workspace.title, 25)}
                                                                        </span>
                                                                    </Link>
                                                                </SidebarMenuSubButton>
                                                            </SidebarMenuSubItem>
                                                        );
                                                    })}
                                                </SidebarMenuSub>
                                            )}
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}

                {/* Collections & Notes */}
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={pathname === '/dashboard/collections'}
                                >
                                    <Link href="/dashboard/collections" className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2">
                                            <Layers className="h-4 w-4" />
                                            <span>Collections</span>
                                        </div>
                                        {collections && (
                                            <span className="text-xs text-muted-foreground ml-auto">
                                                ({collections.length})
                                            </span>
                                        )}
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={pathname === '/dashboard/notes'}
                                >
                                    <Link href="/dashboard/notes" className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            <span>Notes</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground ml-auto">
                                            ({totalNotesCount})
                                        </span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
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