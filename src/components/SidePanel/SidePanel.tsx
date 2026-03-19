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
import { ChevronUp, ChevronDown, User2, Building2, Users, LayoutDashboard, Brain, MessageSquare, FolderOpen, Layers, FileText, Wrench, Sparkles, Settings, Building, Briefcase, BarChart3, Stethoscope, Compass, Network, Palette, Package, Megaphone, HelpCircle, Plus, Move, MoreVertical, Search, MoreHorizontal, Loader2, Route, Database, FileAudio, FileVideo } from "lucide-react";
import { useSignOut, useUserTenants } from "@/src/hooks/useAuth";
import { useOrganizationDetails } from "@/src/hooks/useOrganization";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/src/store/useAuth";
import { useUserPermissions, PERMISSIONS } from "@/src/hooks/useUserPermissions";
import { useUserProfile } from "@/src/hooks/useProfile";
import { useUserWorkspaces, useCreateUserWorkspace } from "@/src/hooks/useWorkspace";
import { useUserCollections } from "@/src/hooks/useCollection";
import { useMoveNote } from "@/src/hooks/useNotes";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/src/lib/axios";
import routes from "@/src/lib/routes";
import { useBrainSpaceStore } from "@/src/store/useBrainSpace";
import { ChatTab } from "../../types/chat";
import { getChatTabs, deleteChatTab, clearChatTab } from "@/src/api/chat";
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
const SIDEBAR_HOVER_CLASS = "hover:bg-muted/70 dark:hover:bg-white/10";

function isMainDashboardRoute(pathname: string) {
    return pathname === "/dashboard" || pathname === "/dashboard/home";
}

function isBrainspacesPathActive(pathname: string) {
    return pathname === "/dashboard/workspaces" || pathname.startsWith("/dashboard/workspaces/");
}

function isCollectionsPathActive(pathname: string) {
    if (pathname === "/dashboard/collections" || pathname.startsWith("/dashboard/collections/")) return true;
    return pathname.includes("/dashboard/workspaces/") && pathname.includes("/collections");
}

function isContentNotesPathActive(pathname: string) {
    if (pathname === "/dashboard/notes" || pathname.startsWith("/dashboard/notes/")) return true;
    if (!pathname.startsWith("/dashboard")) return false;
    return pathname.includes("/notes");
}

function isDataContextPathActive(
    pathname: string,
    segment: "customer-context" | "supplier-context" | "process-context"
) {
    const base = `/dashboard/data-sources/${segment}`;
    return pathname === base || pathname.startsWith(`${base}/`);
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
    const { data: workspaces, isLoading: workspacesLoading, isError: workspacesError } = useUserWorkspaces();
    // SidePanel needs all collections (not filtered by workspace) for the tree structure
    // Pass undefined explicitly to fetch all collections (not filtered by workspace)
    const { data: allCollections, isLoading: collectionsLoading, isError: collectionsError } = useUserCollections(undefined);
    const { currentBrainSpaceId, setCurrentBrainSpaceId } = useBrainSpaceStore();
    const queryClient = useQueryClient();
    const { mutate: createWorkspace, isPending: isCreatingWorkspace } = useCreateUserWorkspace();

    // State for create brain space dialog
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    // State for move article dialog
    const [moveDialogOpen, setMoveDialogOpen] = useState(false);
    const [sourceCollectionId, setSourceCollectionId] = useState<number | null>(null);
    const [selectedNoteIds, setSelectedNoteIds] = useState<number[]>([]);
    const [targetCollectionId, setTargetCollectionId] = useState<string>("");
    const { mutate: moveNote, isPending: isMovingNote } = useMoveNote();

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
    const [clearDialogOpen, setClearDialogOpen] = useState(false);
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

    // Filter collections by selected brain space for counts (but keep all for tree structure)
    // If no brainspace is selected, show 0 counts (not all collections)
    const collections = useMemo(() => {
        if (!allCollections) return [];
        if (!currentBrainSpaceId) return []; // Show 0 if no brain space selected
        return allCollections.filter(c => c.workspaceId === currentBrainSpaceId);
    }, [allCollections, currentBrainSpaceId]);

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

    // Fetch notes count from all collections (needed for move functionality)
    const allNoteQueries = useQueries({
        queries: (allCollections || []).map((collection) => ({
            queryKey: ["collectionNotes", collection.id, currentTenantId],
            queryFn: async () => {
                const { data } = await api.get(routes.notes.get, {
                    params: { collection_id: collection.id },
                });
                return data.data.notes || [];
            },
            enabled: !!collection.id && !!currentTenantId && hydrated && !!allCollections && allCollections.length > 0,
            refetchOnMount: true,
            refetchOnWindowFocus: false,
            staleTime: 0, // Always consider data stale to ensure fresh counts
        })),
    });

    // Filter note queries by selected brain space for counts
    const noteQueries = useMemo(() => {
        if (!currentBrainSpaceId || !allCollections) return [];
        const filteredCollectionIds = collections?.map(c => c.id) || [];
        return allNoteQueries.filter((query, index) => {
            const collection = allCollections[index];
            return collection && filteredCollectionIds.includes(collection.id);
        });
    }, [allNoteQueries, allCollections, collections, currentBrainSpaceId]);

    // Calculate total notes count from collections in the selected brain space
    const totalNotesCount = noteQueries.reduce((total, query) => {
        return total + (query.data?.length || 0);
    }, 0);

    // Get notes for a specific collection (use allCollections and allNoteQueries)
    const getCollectionNotes = (collectionId: number) => {
        const collectionIndex = allCollections?.findIndex(c => c.id === collectionId) ?? -1;
        if (collectionIndex >= 0 && collectionIndex < allNoteQueries.length) {
            const query = allNoteQueries[collectionIndex];
            return query?.data || [];
        }
        return [];
    };

    // Handle move article click
    const handleMoveArticleClick = (collectionId: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setSourceCollectionId(collectionId);
        setSelectedNoteIds([]);
        setTargetCollectionId("");
        setMoveDialogOpen(true);
    };

    // Handle move articles
    const handleMoveArticles = () => {
        if (!sourceCollectionId || !targetCollectionId || selectedNoteIds.length === 0) {
            toast.error("Please select articles and a target collection");
            return;
        }

        // Move all selected notes one by one
        let successCount = 0;
        let errorCount = 0;
        const totalNotes = selectedNoteIds.length;

        const movePromises = selectedNoteIds.map((noteId) => {
            return new Promise<void>((resolve) => {
                moveNote(
                    {
                        noteId,
                        payload: { collection_id: Number(targetCollectionId) },
                    },
                    {
                        onSuccess: (res) => {
                            if (res?.status) {
                                successCount++;
                            } else {
                                errorCount++;
                            }
                            resolve();
                        },
                        onError: () => {
                            errorCount++;
                            resolve();
                        },
                    }
                );
            });
        });

        Promise.all(movePromises).then(() => {
            if (successCount === totalNotes) {
                toast.success(`Successfully moved ${successCount} article(s)!`);
            } else if (successCount > 0) {
                toast.warning(`Moved ${successCount} article(s), but ${errorCount} failed.`);
            } else {
                toast.error("Failed to move articles.");
            }
            setMoveDialogOpen(false);
            setSourceCollectionId(null);
            setSelectedNoteIds([]);
            setTargetCollectionId("");
            // Invalidate queries to refresh the UI
            queryClient.invalidateQueries({ queryKey: ["collectionNotes"] });
            queryClient.invalidateQueries({ queryKey: ["userCollections"] });
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
    // Default: Knowledge Bank, Strategy Tools, Execution Tools, and Chat are all expanded
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['knowledge-bank', 'strategy-tools', 'execution-tools', 'chat']));

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

    // Get collections for a specific workspace (use allCollections for tree structure)
    const getWorkspaceCollections = (workspaceId: number) => {
        return allCollections?.filter(c => c.workspaceId === workspaceId) || [];
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

                    {/* Main Navigation */}
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link
                                            href="/dashboard"
                                            className={`px-2 py-1 rounded ${isMainDashboardRoute(pathname) ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS
                                                }`}
                                        >
                                            <LayoutDashboard className="mr-2 h-4 w-4 text-[#DB2B30] dark:text-white" />
                                            Dashboard
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>

                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link
                                            href="/chat"
                                            className={`px-2 py-1 rounded ${pathname === "/chat" || pathname === "/chat/new" ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS
                                                }`}
                                        >
                                            <MessageSquare className="mr-2 h-4 w-4 text-[#DB2B30] dark:text-white" />
                                            New Chat
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>

                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link
                                            href="/chat/search"
                                            className={`px-2 py-1 rounded ${pathname === "/chat/search" || pathname.startsWith("/chat/search/") ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS
                                                }`}
                                        >
                                            <Search className="mr-2 h-4 w-4 text-[#DB2B30] dark:text-white" />
                                            Chat Search
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>

                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild>
                                        <Link
                                            href="/dashboard/clients"
                                            className={`px-2 py-1 rounded ${pathname === "/dashboard/clients" || pathname.startsWith("/dashboard/clients/") ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS
                                                }`}
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
                                            className={`px-2 py-1 rounded ${pathname === "/dashboard/roadmap" ||
                                                    pathname.startsWith("/dashboard/roadmap/")
                                                    ? SIDEBAR_ACTIVE_CLASS
                                                    : SIDEBAR_HOVER_CLASS
                                                }`}
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
                                            className={`px-2 py-1 rounded ${pathname === "/dashboard/analytics" || pathname.startsWith("/dashboard/analytics/") ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS
                                                }`}
                                        >
                                            <BarChart3 className="mr-2 h-4 w-4 text-[#DB2B30] dark:text-white" />
                                            Analytics
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>

                    {/* Chat History */}
                    {true && (
                        <SidebarGroup>
                            <SidebarGroupLabel className="text-black dark:text-[#FFFFFF]">
                                <button
                                    onClick={() => setChatsOpen(!chatsOpen)}
                                    className="flex items-center gap-2 w-full text-left text-black dark:text-[#FFFFFF]"
                                >
                                    {chatsOpen ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronUp className="h-4 w-4 -rotate-90" />
                                    )}
                                    Chat History
                                </button>
                            </SidebarGroupLabel>
                            {chatsOpen && (
                                <SidebarGroupContent>
                                    <div className="max-h-[400px] overflow-y-auto pr-1">
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
                                                                    className={`flex flex-col items-start px-2 py-2 rounded ${pathname === `/chat/${chat.id}`
                                                                        ? SIDEBAR_ACTIVE_CLASS
                                                                        : SIDEBAR_HOVER_CLASS
                                                                        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
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
                                                                                setClearDialogOpen(true);
                                                                            }}
                                                                        >
                                                                            <span>Clear</span>
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
                                </SidebarGroupContent>
                            )}
                        </SidebarGroup>
                    )}

                    {/* Knowledge Bank - Collapsible */}
                    <SidebarGroup>
                        <SidebarGroupLabel className="text-black dark:text-[#FFFFFF]">
                            <button
                                onClick={() => toggleSection('knowledge-bank')}
                                className="flex items-center gap-2 w-full text-left text-black dark:text-[#FFFFFF]"
                            >
                                {expandedSections.has('knowledge-bank') ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronUp className="h-4 w-4 -rotate-90" />
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
                                                className={`flex items-center justify-between w-full rounded-md px-2 py-2 ${isBrainspacesPathActive(pathname) ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Brain className="h-4 w-4 text-[#DB2B30] dark:text-white" />
                                                    <span>Brainspaces</span>
                                                </div>
                                                {!workspacesLoading && workspaces && (
                                                    <span className="text-xs text-muted-foreground ml-auto">
                                                        ({workspaces.length})
                                                    </span>
                                                )}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href="/dashboard/collections"
                                                className={`flex items-center justify-between w-full rounded-md px-2 py-2 ${isCollectionsPathActive(pathname) ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Layers className="h-4 w-4 text-[#DB2B30] dark:text-white" />
                                                    <span>Collections</span>
                                                </div>
                                                {!collectionsLoading && collections && (
                                                    <span className="text-xs text-muted-foreground ml-auto">
                                                        ({collections.length})
                                                    </span>
                                                )}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href="/dashboard/notes"
                                                className={`flex items-center justify-between w-full rounded-md px-2 py-2 ${isContentNotesPathActive(pathname) ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-[#DB2B30] dark:text-white" />
                                                    <span>Content</span>
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
                        <SidebarGroupLabel className="text-black dark:text-[#FFFFFF]">
                            <button
                                onClick={() => toggleSection('strategy-tools')}
                                className="flex items-center gap-2 w-full text-left text-black dark:text-[#FFFFFF]"
                            >
                                {expandedSections.has('strategy-tools') ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronUp className="h-4 w-4 -rotate-90" />
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
                                                className={`px-2 py-1 rounded ${pathname === "/dashboard/diagnosis" || pathname.startsWith("/dashboard/diagnosis/") ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS
                                                    }`}
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
                                                className={`px-2 py-1 rounded ${pathname === "/dashboard/direction" || pathname.startsWith("/dashboard/direction/") ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS
                                                    }`}
                                            >
                                                <Compass className="mr-2 h-4 w-4 text-[#DB2B30] dark:text-white" />
                                                Direction
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href="/dashboard/architecture"
                                                className={`px-2 py-1 rounded ${pathname === "/dashboard/architecture" || pathname.startsWith("/dashboard/architecture/") ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS
                                                    }`}
                                            >
                                                <Network className="mr-2 h-4 w-4 text-[#DB2B30] dark:text-white" />
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
                        <SidebarGroupLabel className="text-black dark:text-[#FFFFFF]">
                            <button
                                onClick={() => toggleSection('execution-tools')}
                                className="flex items-center gap-2 w-full text-left text-black dark:text-[#FFFFFF]"
                            >
                                {expandedSections.has('execution-tools') ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronUp className="h-4 w-4 -rotate-90" />
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
                                                className={`px-2 py-1 rounded ${pathname === "/dashboard/brand" || pathname.startsWith("/dashboard/brand/") ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS
                                                    }`}
                                            >
                                                <Palette className="mr-2 h-4 w-4 text-[#DB2B30] dark:text-white" />
                                                Brand
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href="/dashboard/product"
                                                className={`px-2 py-1 rounded ${pathname === "/dashboard/product" || pathname.startsWith("/dashboard/product/") ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS
                                                    }`}
                                            >
                                                <Package className="mr-2 h-4 w-4 text-[#DB2B30] dark:text-white" />
                                                Product
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>

                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href="/dashboard/marketing"
                                                className={`px-2 py-1 rounded ${pathname === "/dashboard/marketing" || pathname.startsWith("/dashboard/marketing/") ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS
                                                    }`}
                                            >
                                                <Megaphone className="mr-2 h-4 w-4 text-[#DB2B30] dark:text-white" />
                                                Marketing
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        )}
                    </SidebarGroup>

                    {/* Data Resources - Three primary categories */}
                    <SidebarGroup>
                        <SidebarGroupLabel className="text-black dark:text-[#FFFFFF]">
                            <button
                                onClick={() => toggleSection('data-sources')}
                                className="flex items-center gap-2 w-full text-left text-black dark:text-[#FFFFFF]"
                            >
                                {expandedSections.has('data-sources') ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronUp className="h-4 w-4 -rotate-90" />
                                )}
                                Data Resources
                            </button>
                        </SidebarGroupLabel>
                        {expandedSections.has('data-sources') && (
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href="/dashboard/data-sources/customer-context"
                                                className={`flex items-center gap-2 w-full rounded-md px-2 py-2 ${isDataContextPathActive(pathname, "customer-context") ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS}`}
                                            >
                                                <Database className="h-4 w-4 text-[#DB2B30] dark:text-white" />
                                                <span>Customer Context</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href="/dashboard/data-sources/supplier-context"
                                                className={`flex items-center gap-2 w-full rounded-md px-2 py-2 ${isDataContextPathActive(pathname, "supplier-context") ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS}`}
                                            >
                                                <Database className="h-4 w-4 text-[#DB2B30] dark:text-white" />
                                                <span>Supplier Context</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild>
                                            <Link
                                                href="/dashboard/data-sources/process-context"
                                                className={`flex items-center gap-2 w-full rounded-md px-2 py-2 ${isDataContextPathActive(pathname, "process-context") ? SIDEBAR_ACTIVE_CLASS : SIDEBAR_HOVER_CLASS}`}
                                            >
                                                <Database className="h-4 w-4 text-[#DB2B30] dark:text-white" />
                                                <span>Process Context</span>
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

            {/* Clear Chat Confirmation Dialog */}
            <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Clear Chat</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to clear all messages from this chat? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (selectedChatId) {
                                    const chatIdToClear = selectedChatId;
                                    // Close dialog immediately
                                    setClearDialogOpen(false);
                                    setSelectedChatId(null);
                                    setLoadingChatId(chatIdToClear);
                                    try {
                                        await clearChatTab(chatIdToClear);
                                        toast.success("Chat cleared successfully");
                                        // Invalidate chat history for this specific chat so it reloads with empty messages
                                        queryClient.invalidateQueries({
                                            predicate: (query) => {
                                                const key = query.queryKey;
                                                return Array.isArray(key) &&
                                                    key.length >= 2 &&
                                                    key[0] === "chatHistory" &&
                                                    String(key[1]) === String(chatIdToClear);
                                            }
                                        });
                                    } catch (error: any) {
                                        toast.error(`Failed to clear chat: ${error.message || "Unknown error"}`);
                                    } finally {
                                        setLoadingChatId(null);
                                    }
                                }
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Clear
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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
                                        // If we're on this chat page, redirect to landing page
                                        if (pathname === `/chat/${chatIdToDelete}`) {
                                            router.push("/chat");
                                        }
                                    } catch (error: any) {
                                        toast.error(`Failed to delete chat: ${error.message || "Unknown error"}`);
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