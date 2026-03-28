"use client";
import React, { useState, useMemo, useEffect } from "react";
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
    SidebarMenuSubButton,
    SidebarMenuAction
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ChevronUp, ChevronDown, User2, Building2, Users, LayoutDashboard, Brain, MessageSquare, Layers, FileText, Settings, Building, Briefcase, BarChart3, Stethoscope, Compass, HelpCircle, Search, MoreHorizontal, Loader2, Route, Pencil, Rocket, LayoutGrid, Target, AppWindow } from "lucide-react";
import { useSignOut, useUserTenants } from "@/src/hooks/useAuth";
import { useOrganizationDetails } from "@/src/hooks/useOrganization";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/src/store/useAuth";
import { useUserPermissions, PERMISSIONS } from "@/src/hooks/useUserPermissions";
import { useUserProfile } from "@/src/hooks/useProfile";
import { useUserWorkspaces, useCreateUserWorkspace } from "@/src/hooks/useWorkspace";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useBrainSpaceStore } from "@/src/store/useBrainSpace";
import {
    ChatTab,
    CHAT_TAB_NAME_MIN_LENGTH,
    CHAT_TAB_NAME_MAX_LENGTH,
    filterChatTabNameInput,
    isValidChatTabName,
} from "../../types/chat";
import { getChatTabs, deleteChatTab, updateChatTabName } from "@/src/api/chat";
import {
    ACTIVE_CHAT_TAB_STORAGE_KEY,
    CHAT_NEW_SESSION_EVENT,
    CHAT_TAB_DELETED_EVENT,
} from "@/src/lib/activeChatTabStorage";
import { getUserFacingApiErrorMessage } from "@/src/lib/apiErrorMessage";
import { CHAT_ENTRY_PATH, CHAT_NEW_SESSION_PATH } from "@/src/lib/chatRoutes";
import type { DataContextSlug } from "@/src/app/dashboard/data-sources/_components/dataContextConfig";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";

const createBrainSpaceSchema = z.object({
    name: z.string().min(1, "Name is required").max(100, "Name is too long"),
});

type CreateBrainSpaceFormValues = z.infer<typeof createBrainSpaceSchema>;

/** Explicit red active state for every sidebar link (avoids theme/Slot merge issues with nested icons). */
const SIDEBAR_ACTIVE_CLASS =
    "bg-[#DB2B30] text-white font-semibold shadow-sm [&_svg]:!text-white [&_.text-muted-foreground]:!text-white/90";
const SIDEBAR_HOVER_CLASS = "hover:bg-muted/70 dark:hover:bg-white/10 hover:[&_svg]:!text-white";

function isMainDashboardRoute(pathname: string) {
    return pathname === "/dashboard" || pathname === "/dashboard/home";
}

/**
 * Single source of truth so nested KB routes don't light up Brainspaces + Collections + Content at once.
 * Priority: note routes → collections → brainspace list / workspace (non-collection) paths.
 */
function getKnowledgeBankActiveSection(
    pathname: string
): "brainspaces" | "collections" | "content" | null {
    if (!pathname.startsWith("/dashboard")) return null;

    // Top-level Content hub
    if (pathname === "/dashboard/notes" || pathname.startsWith("/dashboard/notes/")) {
        return "content";
    }

    // Nested notes (…/collections/…/notes or …/notes/:id) — must win over collections/brainspaces
    if (pathname.includes("/notes/") || pathname.endsWith("/notes")) {
        return "content";
    }

    // Collections: global list or anything under workspace that is in the collections tree
    if (
        pathname === "/dashboard/collections" ||
        pathname.startsWith("/dashboard/collections/") ||
        (pathname.includes("/dashboard/workspaces/") && pathname.includes("/collections"))
    ) {
        return "collections";
    }

    // Brainspaces: list or workspace routes that are not already classified above
    if (pathname === "/dashboard/workspaces" || pathname.startsWith("/dashboard/workspaces/")) {
        return "brainspaces";
    }

    return null;
}

function isDataContextPathActive(pathname: string, segment: DataContextSlug) {
    const base = `/dashboard/data-sources/${segment}`;
    return pathname === base || pathname.startsWith(`${base}/`);
}

function isStrategyPath(pathname: string) {
    return (
        pathname === "/dashboard/direction" ||
        pathname.startsWith("/dashboard/direction/") ||
        pathname === "/dashboard/architecture" ||
        pathname.startsWith("/dashboard/architecture/")
    );
}

function isExecutionPath(pathname: string) {
    return (
        pathname === "/dashboard/brand" ||
        pathname.startsWith("/dashboard/brand/") ||
        pathname === "/dashboard/product" ||
        pathname.startsWith("/dashboard/product/") ||
        pathname === "/dashboard/marketing" ||
        pathname.startsWith("/dashboard/marketing/")
    );
}

/** First segment after `/chat/` (ignores trailing slash); used to match delete vs current route. */
function getOpenChatTabIdFromPathname(pathname: string | null): string | null {
    if (!pathname) return null;
    const m = pathname.match(/^\/chat\/([^/]+)/);
    return m?.[1] ?? null;
}

export default function SidePanel() {
    const pathname = usePathname();
    const router = useRouter();
    const signOut = useSignOut();
    const currentTenantId = useAuthStore((s) => s.tenantId);
    const setTenantId = useAuthStore((s) => s.setTenantId);
    const hydrated = useAuthStore((state) => state.hydrated);
    const { data: tenants } = useUserTenants();
    const { data: organization } = useOrganizationDetails(currentTenantId || 0);
    const { data: userProfile } = useUserProfile();
    const { data: workspaces } = useUserWorkspaces();
    const { currentBrainSpaceId, setCurrentBrainSpaceId } = useBrainSpaceStore();
    const queryClient = useQueryClient();
    const { mutate: createWorkspace, isPending: isCreatingWorkspace } = useCreateUserWorkspace();

    // State for create brain space dialog
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    // Permission checks - hide elements until permissions are loaded and confirmed
    const { hasPermission, isOwnerOrAdmin, isLoading: permissionsLoading } = useUserPermissions();
    const canCreateBrainspace = !permissionsLoading && (
        hasPermission(PERMISSIONS.BRAINSPACE_CREATE) || isOwnerOrAdmin
    );

    // Ensure a default tenant is selected
    useEffect(() => {
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

    // Chat-specific state
    const [chatsOpen, setChatsOpen] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [renameDraft, setRenameDraft] = useState("");
    const [isRenamingChat, setIsRenamingChat] = useState(false);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null); // UUID as string
    const [loadingChatId, setLoadingChatId] = useState<string | null>(null); // UUID as string

    // Load chat tabs from API (filtered by current tenant)
    const { data: chatTabs = [], isLoading: isLoadingChatTabs, refetch: refetchChatTabs } = useQuery({
        queryKey: ["chatTabs", currentTenantId],
        queryFn: getChatTabs,
        enabled: !!currentTenantId && hydrated,
        staleTime: 0,
        refetchOnWindowFocus: false,
        refetchOnMount: "always",
    });

    // Get last message for each chat tab (for display)
    const getLastMessage = (chatTab: ChatTab): string => {
        return "Click to continue conversation";
    };

    const handleRenameChatSubmit = async () => {
        const name = renameDraft.trim();
        if (!name) {
            toast.error("Please enter a name");
            return;
        }
        if (!isValidChatTabName(name)) {
            toast.error(
                `Name must be ${CHAT_TAB_NAME_MIN_LENGTH}–${CHAT_TAB_NAME_MAX_LENGTH} characters, using letters, numbers, dashes, and spaces only`,
            );
            return;
        }
        if (!selectedChatId) return;
        setIsRenamingChat(true);
        try {
            await updateChatTabName(selectedChatId, name);
            await refetchChatTabs();
            queryClient.invalidateQueries({ queryKey: ["chatHistory", selectedChatId] });
            toast.success("Chat renamed");
            setRenameDialogOpen(false);
            setSelectedChatId(null);
            setRenameDraft("");
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "Failed to rename chat";
            toast.error(message);
        } finally {
            setIsRenamingChat(false);
        }
    };

    const createForm = useForm<CreateBrainSpaceFormValues>({
        resolver: zodResolver(createBrainSpaceSchema),
        defaultValues: { name: "" },
    });

    // Extract current brain space from pathname (supports both legacy numeric id and UUID)
    useEffect(() => {
        const segmentMatch = pathname.match(/\/dashboard\/workspaces\/([^/]+)/);
        if (!segmentMatch) return;
        const segment = segmentMatch[1];
        // Legacy URL: segment is purely numeric
        if (/^\d+$/.test(segment)) {
            const workspaceId = Number(segment);
            if (workspaceId && workspaceId !== currentBrainSpaceId) {
                setCurrentBrainSpaceId(workspaceId);
            }
            return;
        }
        // UUID URL: resolve to workspace id so Select value stays in sync
        const workspace = workspaces?.find((w) => w.uuid === segment);
        if (workspace && workspace.id !== currentBrainSpaceId) {
            setCurrentBrainSpaceId(workspace.id);
        }
    }, [pathname, currentBrainSpaceId, setCurrentBrainSpaceId, workspaces]);

    // Validate that the current brain space still exists (use stable dep to avoid loop)
    const workspaceIds = useMemo(() => new Set((workspaces ?? []).map((ws) => ws.id)), [workspaces]);
    useEffect(() => {
        if (currentBrainSpaceId && workspaceIds.size > 0 && !workspaceIds.has(currentBrainSpaceId)) {
            setCurrentBrainSpaceId(null);
        }
    }, [currentBrainSpaceId, workspaceIds]);

    // Get current brain space
    const currentBrainSpace = workspaces?.find(ws => ws.id === currentBrainSpaceId);

    // Handle brain space selection
    const handleBrainSpaceChange = (value: string) => {
        if (value === "create-new") {
            setCreateDialogOpen(true);
            return;
        }
        const workspaceId = Number(value);
        setCurrentBrainSpaceId(workspaceId);
        const ws = workspaces?.find((w) => w.id === workspaceId);
        router.push(`/dashboard/workspaces/${ws?.uuid ?? workspaceId}/collections`);
    };

    // Handle create brain space
    const onCreateBrainSpace = (values: CreateBrainSpaceFormValues) => {
        const workspaceName = values.name;
        createWorkspace(workspaceName, {
            onSuccess: async (res) => {
                if (res?.status) {
                    toast.success(res.message || "Brainspace created successfully!");
                    createForm.reset();
                    setCreateDialogOpen(false);
                    // Wait for the refetch to complete, then find and select the new workspace
                    await queryClient.refetchQueries({ queryKey: ["userWorkspaces"] });
                    // Get the updated workspaces from the cache
                    const refetchedWorkspaces = queryClient.getQueryData<typeof workspaces>(["userWorkspaces"]);
                    const newWorkspace = refetchedWorkspaces?.find((ws) => ws.title === workspaceName);
                    if (newWorkspace) {
                        setCurrentBrainSpaceId(newWorkspace.id);
                        router.push(`/dashboard/workspaces/${newWorkspace.uuid ?? newWorkspace.id}/collections`);
                    } else {
                        // If not found, navigate to workspaces page
                        router.push('/dashboard/workspaces');
                    }
                } else {
                    createForm.reset();
                    toast.error(res?.message || "Could not create brainspace.");
                }
            },
            onError: (err: any) => {
                toast.error(err?.message || "Request failed, please try again.");
            },
        });
    };

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

    // State for managing expanded workspaces (to show collections)
    const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<number>>(new Set());

    // State for managing expanded navigation sections
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set([
            "business-dashboard",
            "command-center",
            "knowledge-bank",
            "building-tools",
            "business-context",
            "embedded-intelligence",
        ])
    );

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

    // Toggle workspace expansion (to show collections)
    const toggleWorkspace = (workspaceId: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setExpandedWorkspaces(prev => {
            const newSet = new Set(prev);
            if (newSet.has(workspaceId)) {
                newSet.delete(workspaceId);
            } else {
                newSet.add(workspaceId);
            }
            return newSet;
        });
    };

    return (
        <>
            <Sidebar>
                <SidebarContent>
                    {/* Organization Switcher */}
                    <div className="px-4 py-4 border-b">
                        {tenants && tenants.length > 0 ? (
                            <div className="flex items-center gap-2 w-full">
                                {/* Platform icon (outside dropdown) */}
                                <div className="h-8 w-8 flex items-center justify-center shrink-0">
                                    <img
                                        src="/assets/OB-Logo-Black.png"
                                        alt="Outcome Builders"
                                        className="block dark:hidden h-6 w-6 object-contain"
                                    />
                                    <img
                                        src="/assets/OB-Logo-White.png"
                                        alt="Outcome Builders"
                                        className="hidden dark:block h-6 w-6 object-contain"
                                    />
                                </div>

                                <span className="text-muted-foreground shrink-0">|</span>

                                {/* Client dropdown (only this area is clickable) */}
                                <Select
                                    value={currentTenantId ? String(currentTenantId) : undefined}
                                    onValueChange={handleOrganizationChange}
                                >
                                    <SelectTrigger className="flex-1 h-8 px-3 bg-background/80 dark:bg-background/40 border border-border shadow-sm text-sm text-black dark:text-[#FFFFFF] min-w-0">
                                        <div className="flex items-center gap-2 w-full min-w-0">
                                            <Avatar className="h-6 w-6 shrink-0 rounded-sm">
                                                <AvatarImage src={organization?.logo || ""} alt={organization?.company_name || "Organization"} />
                                                <AvatarFallback className="rounded-sm text-[10px]">
                                                    {(organization?.company_name || "Org")
                                                        .split(" ")
                                                        .filter(Boolean)
                                                        .slice(0, 2)
                                                        .map((w) => w[0]?.toUpperCase())
                                                        .join("")}
                                                </AvatarFallback>
                                            </Avatar>

                                            <span className="truncate">
                                                {organization?.company_name || "Select organization"}
                                            </span>

                                            {/* Keep SelectValue for internal select state/ARIA */}
                                            <span className="sr-only">
                                                <SelectValue placeholder={organization?.company_name || "Select organization"} />
                                            </span>
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tenants.map((tenant) => (
                                            <SelectItem key={tenant.id} value={String(tenant.id)}>
                                                {tenant.company_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <span className="font-semibold text-sm truncate text-black dark:text-[#FFFFFF]">
                                {organization?.company_name || "Organization"}
                            </span>
                        )}
                    </div>

                    {/* Brain Space Selector removed per design */}

                    {/* Business Dashboard */}
                    <SidebarGroup>
                        <SidebarGroupLabel className="text-black dark:text-[#FFFFFF] pb-2 mb-1">
                            <button
                                type="button"
                                onClick={() => toggleSection("business-dashboard")}
                                className="flex items-center gap-2 w-full text-left text-black dark:text-[#FFFFFF]"
                            >
                                {expandedSections.has("business-dashboard") ? (
                                    <ChevronDown className="h-4 w-4 shrink-0" />
                                ) : (
                                    <ChevronUp className="h-4 w-4 shrink-0 -rotate-90" />
                                )}
                                Business Dashboard
                            </button>
                        </SidebarGroupLabel>
                        {expandedSections.has("business-dashboard") && (
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href="/dashboard"
                                                className={`px-2 py-1 rounded ${isMainDashboardRoute(pathname) ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS}`}
                                            >
                                                <LayoutDashboard className="mr-2 h-4 w-4 text-[#DB2B30] dark:text-white" />
                                                Overview
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href="/dashboard/clients"
                                                className={`px-2 py-1 rounded ${pathname === "/dashboard/clients" || pathname.startsWith("/dashboard/clients/") ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS}`}
                                            >
                                                <Briefcase className="mr-2 h-4 w-4 text-[#DB2B30] dark:text-white" />
                                                Clients
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href="/dashboard/roadmap"
                                                className={`px-2 py-1 rounded ${pathname === "/dashboard/roadmap" || pathname.startsWith("/dashboard/roadmap/") ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS}`}
                                            >
                                                <Route className="mr-2 h-4 w-4 text-[#DB2B30] dark:text-white" />
                                                Roadmap
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href="/dashboard/analytics"
                                                className={`px-2 py-1 rounded ${pathname === "/dashboard/analytics" || pathname.startsWith("/dashboard/analytics/") ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS}`}
                                            >
                                                <BarChart3 className="mr-2 h-4 w-4 text-[#DB2B30] dark:text-white" />
                                                Analytics
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        )}
                    </SidebarGroup>

                    {/* Command Center */}
                    <SidebarGroup className="border-t border-border pt-3 mt-1">
                        <SidebarGroupLabel className="text-black dark:text-[#FFFFFF] pb-2 mb-1">
                            <button
                                type="button"
                                onClick={() => toggleSection("command-center")}
                                className="flex items-center gap-2 w-full text-left text-black dark:text-[#FFFFFF]"
                            >
                                {expandedSections.has("command-center") ? (
                                    <ChevronDown className="h-4 w-4 shrink-0" />
                                ) : (
                                    <ChevronUp className="h-4 w-4 shrink-0 -rotate-90" />
                                )}
                                Command Center
                            </button>
                        </SidebarGroupLabel>
                        {expandedSections.has("command-center") && (
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href={CHAT_ENTRY_PATH}
                                                className={`px-2 py-1 rounded ${pathname === CHAT_ENTRY_PATH || pathname === CHAT_NEW_SESSION_PATH ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS}`}
                                                onClick={(e) => {
                                                    if (
                                                        pathname === CHAT_ENTRY_PATH ||
                                                        pathname === CHAT_NEW_SESSION_PATH
                                                    ) {
                                                        e.preventDefault();
                                                        window.dispatchEvent(
                                                            new CustomEvent(CHAT_NEW_SESSION_EVENT),
                                                        );
                                                    }
                                                }}
                                            >
                                                <MessageSquare className="mr-2 h-4 w-4 text-[#DB2B30] dark:text-white" />
                                                New action
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href="/chat/search"
                                                className={`px-2 py-1 rounded ${pathname === "/chat/search" || pathname.startsWith("/chat/search/") ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS}`}
                                            >
                                                <Search className="mr-2 h-4 w-4 text-[#DB2B30] dark:text-white" />
                                                Search actions
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                                <div className="mt-1 px-2">
                                    <button
                                        type="button"
                                        onClick={() => setChatsOpen(!chatsOpen)}
                                        className="flex items-center gap-2 w-full text-left text-sm font-medium text-black dark:text-[#FFFFFF] py-1.5 rounded-md hover:bg-muted/70 dark:hover:bg-white/10"
                                    >
                                        {chatsOpen ? (
                                            <ChevronDown className="h-4 w-4 shrink-0" />
                                        ) : (
                                            <ChevronUp className="h-4 w-4 shrink-0 -rotate-90" />
                                        )}
                                        All actions
                                    </button>
                                </div>
                                {chatsOpen && (
                                    <div className="max-h-[400px] overflow-y-auto pr-1 pl-0">
                                        {isLoadingChatTabs ? (
                                            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                                                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                                                Loading chats...
                                            </div>
                                        ) : chatTabs.length === 0 ? (
                                            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                                                No chats yet. Start a new conversation!
                                            </div>
                                        ) : (
                                            <SidebarMenu>
                                                {chatTabs.map((chat) => {
                                                    const isLoading = loadingChatId === chat.id;
                                                    return (
                                                        <SidebarMenuItem key={chat.id}>
                                                            <SidebarMenuButton asChild disabled={isLoading}>
                                                                <Link
                                                                    href={`/chat/${chat.id}`}
                                                                    className={`flex flex-col items-start px-2 py-2 rounded ${pathname === `/chat/${chat.id}` ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS} ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                                                                >
                                                                    <div className="flex items-center gap-2 w-full">
                                                                        {isLoading ? (
                                                                            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                                                        ) : null}
                                                                        <span className="flex-1">{chat.name}</span>
                                                                    </div>
                                                                    {!isLoading && (
                                                                        <span
                                                                            className={`text-xs truncate ${pathname === `/chat/${chat.id}` ? "text-white/80" : "text-muted-foreground"}`}
                                                                        >
                                                                            {getLastMessage(chat)}
                                                                        </span>
                                                                    )}
                                                                </Link>
                                                            </SidebarMenuButton>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild disabled={isLoading}>
                                                                    <SidebarMenuAction disabled={isLoading} className="text-[#FFFFFF]">
                                                                        {isLoading ? (
                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        )}
                                                                    </SidebarMenuAction>
                                                                </DropdownMenuTrigger>
                                                                {!isLoading && (
                                                                    <DropdownMenuContent
                                                                        side="right"
                                                                        align="start"
                                                                        className="text-[#FFFFFF]"
                                                                    >
                                                                        <DropdownMenuItem
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                setSelectedChatId(chat.id);
                                                                                setRenameDraft(filterChatTabNameInput(chat.name));
                                                                                setRenameDialogOpen(true);
                                                                            }}
                                                                        >
                                                                            <Pencil className="mr-2 h-4 w-4" />
                                                                            <span>Rename</span>
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                setSelectedChatId(chat.id);
                                                                                setDeleteDialogOpen(true);
                                                                            }}
                                                                            className="text-destructive focus:text-destructive"
                                                                        >
                                                                            <span>Delete</span>
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                )}
                                                            </DropdownMenu>
                                                        </SidebarMenuItem>
                                                    );
                                                })}
                                            </SidebarMenu>
                                        )}
                                    </div>
                                )}
                            </SidebarGroupContent>
                        )}
                    </SidebarGroup>

                    {/* Knowledge Bank */}
                    <SidebarGroup className="border-t border-border pt-3 mt-1">
                        <SidebarGroupLabel className="text-black dark:text-[#FFFFFF] pb-2 mb-1">
                            <button
                                type="button"
                                onClick={() => toggleSection("knowledge-bank")}
                                className="flex items-center gap-2 w-full text-left text-black dark:text-[#FFFFFF]"
                            >
                                {expandedSections.has("knowledge-bank") ? (
                                    <ChevronDown className="h-4 w-4 shrink-0" />
                                ) : (
                                    <ChevronUp className="h-4 w-4 shrink-0 -rotate-90" />
                                )}
                                Knowledge Bank
                            </button>
                        </SidebarGroupLabel>
                        {expandedSections.has("knowledge-bank") && (
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href="/dashboard/workspaces"
                                                className={`flex items-center gap-2 w-full rounded-md px-2 py-2 ${getKnowledgeBankActiveSection(pathname) === "brainspaces" ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS}`}
                                            >
                                                <Brain className="h-4 w-4 text-[#DB2B30] dark:text-white" />
                                                <span>Brainspaces</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href="/dashboard/collections"
                                                className={`flex items-center gap-2 w-full rounded-md px-2 py-2 ${getKnowledgeBankActiveSection(pathname) === "collections" ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS}`}
                                            >
                                                <Layers className="h-4 w-4 text-[#DB2B30] dark:text-white" />
                                                <span>Collections</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href="/dashboard/notes"
                                                className={`flex items-center gap-2 w-full rounded-md px-2 py-2 ${getKnowledgeBankActiveSection(pathname) === "content" ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS}`}
                                            >
                                                <FileText className="h-4 w-4 text-[#DB2B30] dark:text-white" />
                                                <span>Content</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        )}
                    </SidebarGroup>

                    {/* Building Tools (Diagnosis + former Strategy & Execution areas) */}
                    <SidebarGroup className="border-t border-border pt-3 mt-1">
                        <SidebarGroupLabel className="text-black dark:text-[#FFFFFF] pb-2 mb-1">
                            <button
                                type="button"
                                onClick={() => toggleSection("building-tools")}
                                className="flex items-center gap-2 w-full text-left text-black dark:text-[#FFFFFF]"
                            >
                                {expandedSections.has("building-tools") ? (
                                    <ChevronDown className="h-4 w-4 shrink-0" />
                                ) : (
                                    <ChevronUp className="h-4 w-4 shrink-0 -rotate-90" />
                                )}
                                Building Tools
                            </button>
                        </SidebarGroupLabel>
                        {expandedSections.has("building-tools") && (
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href="/dashboard/diagnosis"
                                                className={`px-2 py-1 rounded ${pathname === "/dashboard/diagnosis" || pathname.startsWith("/dashboard/diagnosis/") ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS}`}
                                            >
                                                <Stethoscope className="mr-2 h-4 w-4 text-[#DB2B30] dark:text-white" />
                                                Diagnosis
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href="/dashboard/direction"
                                                className={`px-2 py-1 rounded ${isStrategyPath(pathname) ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS}`}
                                            >
                                                <Compass className="mr-2 h-4 w-4 text-[#DB2B30] dark:text-white" />
                                                Strategy
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href="/dashboard/brand"
                                                className={`px-2 py-1 rounded ${isExecutionPath(pathname) ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS}`}
                                            >
                                                <Rocket className="mr-2 h-4 w-4 text-[#DB2B30] dark:text-white" />
                                                Execution
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        )}
                    </SidebarGroup>

                    {/* Business Context (former Data Resources) */}
                    <SidebarGroup className="border-t border-border pt-3 mt-1">
                        <SidebarGroupLabel className="text-black dark:text-[#FFFFFF] pb-2 mb-1">
                            <button
                                type="button"
                                onClick={() => toggleSection("business-context")}
                                className="flex items-center gap-2 w-full text-left text-black dark:text-[#FFFFFF]"
                            >
                                {expandedSections.has("business-context") ? (
                                    <ChevronDown className="h-4 w-4 shrink-0" />
                                ) : (
                                    <ChevronUp className="h-4 w-4 shrink-0 -rotate-90" />
                                )}
                                Business Context
                            </button>
                        </SidebarGroupLabel>
                        {expandedSections.has("business-context") && (
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href="/dashboard/data-sources/company-context"
                                                className={`flex items-center gap-2 w-full rounded-md px-2 py-2 ${isDataContextPathActive(pathname, "company-context") ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS}`}
                                            >
                                                <Building2 className="h-4 w-4 text-[#DB2B30] dark:text-white" />
                                                <span>Company</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href="/dashboard/data-sources/customer-context"
                                                className={`flex items-center gap-2 w-full rounded-md px-2 py-2 ${isDataContextPathActive(pathname, "customer-context") ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS}`}
                                            >
                                                <Users className="h-4 w-4 text-[#DB2B30] dark:text-white" />
                                                <span>Customers</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href="/dashboard/data-sources/competitor-context"
                                                className={`flex items-center gap-2 w-full rounded-md px-2 py-2 ${isDataContextPathActive(pathname, "competitor-context") ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS}`}
                                            >
                                                <Target className="h-4 w-4 text-[#DB2B30] dark:text-white" />
                                                <span>Competitors</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href="/dashboard/data-sources/category-context"
                                                className={`flex items-center gap-2 w-full rounded-md px-2 py-2 ${isDataContextPathActive(pathname, "category-context") ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS}`}
                                            >
                                                <LayoutGrid className="h-4 w-4 text-[#DB2B30] dark:text-white" />
                                                <span>Category</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        )}
                    </SidebarGroup>

                    {/* Embedded Intelligence */}
                    <SidebarGroup className="border-t border-border pt-3 mt-1">
                        <SidebarGroupLabel className="text-black dark:text-[#FFFFFF] pb-2 mb-1">
                            <button
                                type="button"
                                onClick={() => toggleSection("embedded-intelligence")}
                                className="flex items-center gap-2 w-full text-left text-black dark:text-[#FFFFFF]"
                            >
                                {expandedSections.has("embedded-intelligence") ? (
                                    <ChevronDown className="h-4 w-4 shrink-0" />
                                ) : (
                                    <ChevronUp className="h-4 w-4 shrink-0 -rotate-90" />
                                )}
                                Embedded Intelligence
                            </button>
                        </SidebarGroupLabel>
                        {expandedSections.has("embedded-intelligence") && (
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href="/dashboard/chat-widget"
                                                className={`px-2 py-1 rounded ${pathname === "/dashboard/chat-widget" || pathname.startsWith("/dashboard/chat-widget/") ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS}`}
                                            >
                                                <AppWindow className="mr-2 h-4 w-4 text-[#DB2B30] dark:text-white" />
                                                Chat Widget
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        )}
                    </SidebarGroup>

                </SidebarContent>

                <SidebarFooter>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <SidebarMenuButton className="w-full text-black dark:text-[#FFFFFF] hover:text-black dark:hover:text-[#FFFFFF]">
                                        <User2 className="shrink-0 text-[#DB2B30] dark:text-white" />
                                        <span className="truncate flex-1 text-left" title={userProfile?.data?.full_name || userProfile?.data?.email}>
                                            {getDisplayName()}
                                        </span>
                                        <ChevronUp className="ml-auto shrink-0" />
                                    </SidebarMenuButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    side="top"
                                    className="w-[--radix-popper-anchor-width] text-black dark:text-[#FFFFFF]"
                                >
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/profile">
                                            <User2 className="mr-2 h-4 w-4 text-[#DB2B30] dark:text-white" />
                                            Profile
                                        </Link>
                                    </DropdownMenuItem>
                                    {tenants && tenants.length > 0 && (
                                        <DropdownMenuItem asChild>
                                            <Link href="/dashboard/organization">
                                                <Building className="mr-2 h-4 w-4 text-[#DB2B30] dark:text-white" />
                                                Organization
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    {canViewTeam && (
                                        <DropdownMenuItem asChild>
                                            <Link href="/dashboard/admins">
                                                <Users className="mr-2 h-4 w-4 text-[#DB2B30] dark:text-white" />
                                                Team
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/faq">
                                            <HelpCircle className="mr-2 h-4 w-4 text-[#DB2B30] dark:text-white" />
                                            FAQ
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/settings">
                                            <Settings className="mr-2 h-4 w-4 text-[#DB2B30] dark:text-white" />
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

            <Dialog
                open={renameDialogOpen}
                onOpenChange={(open) => {
                    setRenameDialogOpen(open);
                    if (!open) {
                        setSelectedChatId(null);
                        setRenameDraft("");
                        setIsRenamingChat(false);
                    }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Rename chat</DialogTitle>
                        <DialogDescription>
                            Use letters, numbers, dashes, and spaces (minimum{" "}
                            {CHAT_TAB_NAME_MIN_LENGTH} characters). This appears in your chat history
                            list.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2 py-2">
                        <div className="flex items-center justify-between gap-2">
                            <Label htmlFor="rename-chat-title">Name</Label>
                            <span className="text-xs text-muted-foreground tabular-nums">
                                {renameDraft.length}/{CHAT_TAB_NAME_MAX_LENGTH} (min{" "}
                                {CHAT_TAB_NAME_MIN_LENGTH})
                            </span>
                        </div>
                        <Input
                            id="rename-chat-title"
                            value={renameDraft}
                            onChange={(e) =>
                                setRenameDraft(filterChatTabNameInput(e.target.value))
                            }
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !isRenamingChat) {
                                    e.preventDefault();
                                    void handleRenameChatSubmit();
                                }
                            }}
                            placeholder="Chat name"
                            maxLength={CHAT_TAB_NAME_MAX_LENGTH}
                            autoFocus
                            disabled={isRenamingChat}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setRenameDialogOpen(false)}
                            disabled={isRenamingChat}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={() => void handleRenameChatSubmit()}
                            disabled={isRenamingChat}
                        >
                            {isRenamingChat ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving
                                </>
                            ) : (
                                "Save"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Chat Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Chat</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this chat? This will permanently delete the chat and all its messages. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (selectedChatId) {
                                    const chatIdToDelete = selectedChatId;
                                    // Close dialog immediately
                                    setDeleteDialogOpen(false);
                                    setSelectedChatId(null);
                                    setLoadingChatId(chatIdToDelete);
                                    try {
                                        await deleteChatTab(chatIdToDelete);
                                        toast.success("Chat deleted successfully");
                                        // Immediately refetch chat tabs to update the list
                                        await refetchChatTabs();
                                        // Invalidate chat history for this specific chat (UUID string)
                                        queryClient.invalidateQueries({ queryKey: ["chatHistory", chatIdToDelete] });
                                        // Viewing deleted tab: URL is `/chat/{uuid}` or `/chat/new` with tab in sessionStorage
                                        const openTabId = getOpenChatTabIdFromPathname(pathname);
                                        let viewingDeleted =
                                            !!openTabId &&
                                            openTabId.toLowerCase() ===
                                            chatIdToDelete.toLowerCase();
                                        if (!viewingDeleted) {
                                            try {
                                                const stored =
                                                    typeof window !== "undefined"
                                                        ? sessionStorage.getItem(
                                                            ACTIVE_CHAT_TAB_STORAGE_KEY,
                                                        )
                                                        : null;
                                                if (
                                                    stored &&
                                                    stored.toLowerCase() ===
                                                    chatIdToDelete.toLowerCase()
                                                ) {
                                                    viewingDeleted = true;
                                                }
                                            } catch {
                                                /* ignore */
                                            }
                                        }
                                        if (viewingDeleted) {
                                            queryClient.removeQueries({
                                                queryKey: ["chatHistory", chatIdToDelete],
                                            });
                                            try {
                                                sessionStorage.removeItem(
                                                    ACTIVE_CHAT_TAB_STORAGE_KEY,
                                                );
                                            } catch {
                                                /* ignore */
                                            }
                                            window.dispatchEvent(
                                                new CustomEvent(CHAT_TAB_DELETED_EVENT, {
                                                    detail: { chatTabId: chatIdToDelete },
                                                }),
                                            );
                                            router.replace(CHAT_ENTRY_PATH);
                                        }
                                    } catch (error: unknown) {
                                        toast.error(
                                            getUserFacingApiErrorMessage(
                                                error,
                                                "Failed to delete chat. Please try again.",
                                            ),
                                        );
                                    } finally {
                                        setLoadingChatId(null);
                                    }
                                }
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
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
    //                     className={`px-2 py-1 rounded ${pathname === link.href ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS
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