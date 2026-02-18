"use client";
import { useState, useMemo, useEffect } from "react";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ChevronUp, ChevronDown, User2, Building2, Users, LayoutDashboard, Brain, MessageSquare, FolderOpen, Layers, FileText, Wrench, Sparkles, Settings, Building, Briefcase, BarChart3, Stethoscope, Compass, Network, Palette, Package, Megaphone, HelpCircle } from "lucide-react";
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
    const { data: workspaces, isLoading: workspacesLoading, isError: workspacesError } = useUserWorkspaces();
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
    const groupedWorkspaces = useMemo(() => {
        if (!workspaces || workspaces.length === 0) {
            return {};
        }
        
        return workspaces.reduce((acc, workspace) => {
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
        }, {} as Record<number, { id: number; name: string; workspaces: typeof workspaces }>);
    }, [workspaces]);

    // State for managing expanded organization groups
    const [expandedOrgs, setExpandedOrgs] = useState<Set<number>>(new Set());
    
    // State for managing expanded navigation sections
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['knowledge-bank']));
    
    // Auto-expand first organization when workspaces load
    useEffect(() => {
        if (workspaces && workspaces.length > 0 && Object.keys(groupedWorkspaces).length > 0 && expandedOrgs.size === 0) {
            const firstOrgId = Object.keys(groupedWorkspaces)[0];
            if (firstOrgId) {
                setExpandedOrgs(new Set([Number(firstOrgId)]));
            }
        }
    }, [workspaces, groupedWorkspaces]);

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

    // Toggle navigation section expansion
    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sectionId)) {
                newSet.delete(sectionId);
            } else {
                newSet.add(sectionId);
            }
            return newSet;
        });
    };


    return (
        <Sidebar>
            <SidebarContent>
                {/* Main Navigation */}
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link
                                        href="/dashboard"
                                        className={`px-2 py-1 rounded ${pathname === "/dashboard" ? "bg-gray-300 font-semibold" : "hover:bg-gray-200"
                                            }`}
                                    >
                                        <LayoutDashboard className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                        Dashboard
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link
                                        href="/chat"
                                        className={`px-2 py-1 rounded ${pathname === "/chat" || pathname.startsWith("/chat/") ? "bg-gray-300 font-semibold" : "hover:bg-gray-200"
                                            }`}
                                    >
                                        <MessageSquare className="mr-2 h-4 w-4 text-fuchsia-600 dark:text-fuchsia-400" />
                                        Chat
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link
                                        href="/dashboard/clients"
                                        className={`px-2 py-1 rounded ${pathname === "/dashboard/clients" || pathname.startsWith("/dashboard/clients/") ? "bg-gray-300 font-semibold" : "hover:bg-gray-200"
                                            }`}
                                    >
                                        <Briefcase className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        Clients
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link
                                        href="/dashboard/analytics"
                                        className={`px-2 py-1 rounded ${pathname === "/dashboard/analytics" || pathname.startsWith("/dashboard/analytics/") ? "bg-gray-300 font-semibold" : "hover:bg-gray-200"
                                            }`}
                                    >
                                        <BarChart3 className="mr-2 h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                        Analytics
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Knowledge Bank - Collapsible */}
                <SidebarGroup>
                    <SidebarGroupLabel>
                        <button
                            onClick={() => toggleSection('knowledge-bank')}
                            className="flex items-center gap-2 w-full text-left"
                        >
                            {expandedSections.has('knowledge-bank') ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronUp className="h-4 w-4 rotate-[-90deg]" />
                            )}
                            Knowledge Bank
                        </button>
                    </SidebarGroupLabel>
                    {expandedSections.has('knowledge-bank') && (
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link
                                            href="/dashboard/workspaces"
                                            className={`px-2 py-1 rounded ${pathname === "/dashboard/workspaces" || pathname.startsWith("/dashboard/workspaces/") ? "bg-gray-300 font-semibold" : "hover:bg-gray-200"
                                                }`}
                                        >
                                            <Brain className="mr-2 h-4 w-4 text-violet-600 dark:text-violet-400" />
                                            Brainspaces
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>

                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === '/dashboard/collections'}
                                    >
                                        <Link href="/dashboard/collections" className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-2">
                                                <Layers className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
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
                                                <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                                <span>Articles</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground ml-auto">
                                                ({totalNotesCount})
                                            </span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    )}
                </SidebarGroup>

                {/* Strategy Tools - Collapsible */}
                <SidebarGroup>
                    <SidebarGroupLabel>
                        <button
                            onClick={() => toggleSection('strategy-tools')}
                            className="flex items-center gap-2 w-full text-left"
                        >
                            {expandedSections.has('strategy-tools') ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronUp className="h-4 w-4 rotate-[-90deg]" />
                            )}
                            Strategy Tools
                        </button>
                    </SidebarGroupLabel>
                    {expandedSections.has('strategy-tools') && (
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link
                                            href="/dashboard/diagnosis"
                                            className={`px-2 py-1 rounded ${pathname === "/dashboard/diagnosis" || pathname.startsWith("/dashboard/diagnosis/") ? "bg-gray-300 font-semibold" : "hover:bg-gray-200"
                                                }`}
                                        >
                                            <Stethoscope className="mr-2 h-4 w-4 text-red-600 dark:text-red-400" />
                                            Diagnosis
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>

                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link
                                            href="/dashboard/direction"
                                            className={`px-2 py-1 rounded ${pathname === "/dashboard/direction" || pathname.startsWith("/dashboard/direction/") ? "bg-gray-300 font-semibold" : "hover:bg-gray-200"
                                                }`}
                                        >
                                            <Compass className="mr-2 h-4 w-4 text-orange-600 dark:text-orange-400" />
                                            Direction
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>

                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link
                                            href="/dashboard/architecture"
                                            className={`px-2 py-1 rounded ${pathname === "/dashboard/architecture" || pathname.startsWith("/dashboard/architecture/") ? "bg-gray-300 font-semibold" : "hover:bg-gray-200"
                                                }`}
                                        >
                                            <Network className="mr-2 h-4 w-4 text-purple-600 dark:text-purple-400" />
                                            Architecture
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    )}
                </SidebarGroup>

                {/* Execution Tools - Collapsible */}
                <SidebarGroup>
                    <SidebarGroupLabel>
                        <button
                            onClick={() => toggleSection('execution-tools')}
                            className="flex items-center gap-2 w-full text-left"
                        >
                            {expandedSections.has('execution-tools') ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronUp className="h-4 w-4 rotate-[-90deg]" />
                            )}
                            Execution Tools
                        </button>
                    </SidebarGroupLabel>
                    {expandedSections.has('execution-tools') && (
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link
                                            href="/dashboard/brand"
                                            className={`px-2 py-1 rounded ${pathname === "/dashboard/brand" || pathname.startsWith("/dashboard/brand/") ? "bg-gray-300 font-semibold" : "hover:bg-gray-200"
                                                }`}
                                        >
                                            <Palette className="mr-2 h-4 w-4 text-pink-600 dark:text-pink-400" />
                                            Brand
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>

                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link
                                            href="/dashboard/product"
                                            className={`px-2 py-1 rounded ${pathname === "/dashboard/product" || pathname.startsWith("/dashboard/product/") ? "bg-gray-300 font-semibold" : "hover:bg-gray-200"
                                                }`}
                                        >
                                            <Package className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
                                            Product
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>

                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link
                                            href="/dashboard/marketing"
                                            className={`px-2 py-1 rounded ${pathname === "/dashboard/marketing" || pathname.startsWith("/dashboard/marketing/") ? "bg-gray-300 font-semibold" : "hover:bg-gray-200"
                                                }`}
                                        >
                                            <Megaphone className="mr-2 h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                            Marketing
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    )}
                </SidebarGroup>

                {/* My Brainspaces - Tree Structure */}
                {workspaces && workspaces.length > 0 && Object.keys(groupedWorkspaces).length > 0 && (
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
                                                onClick={() => {
                                                    toggleOrg(orgGroup.id);
                                                }}
                                                isActive={isActive}
                                                className="w-full cursor-pointer"
                                                type="button"
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        {isExpanded ? (
                                                            <ChevronDown className="h-4 w-4 shrink-0" />
                                                        ) : (
                                                            <ChevronUp className="h-4 w-4 shrink-0 rotate-[-90deg]" />
                                                        )}
                                                        <Building2 className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
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
                                                                        onClick={() => {
                                                                            // Close the dropdown when a workspace is clicked
                                                                            setExpandedOrgs(prev => {
                                                                                const newSet = new Set(prev);
                                                                                newSet.delete(orgGroup.id);
                                                                                return newSet;
                                                                            });
                                                                        }}
                                                                    >
                                                                        <FolderOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/profile">
                                        <User2 className="mr-2 h-4 w-4" />
                                        Profile
                                    </Link>
                                </DropdownMenuItem>
                                {tenants && tenants.length > 0 && (
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/organization">
                                            <Building className="mr-2 h-4 w-4" />
                                            Organization
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                                {canViewTeam && (
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/admins">
                                            <Users className="mr-2 h-4 w-4" />
                                            Team
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/faq">
                                        <HelpCircle className="mr-2 h-4 w-4" />
                                        FAQ
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/settings">
                                        <Settings className="mr-2 h-4 w-4" />
                                        Settings
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
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