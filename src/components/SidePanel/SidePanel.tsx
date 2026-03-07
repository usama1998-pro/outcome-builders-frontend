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
import { ChevronUp, ChevronDown, User2, Building2, Users, LayoutDashboard, Brain, MessageSquare, FolderOpen, Layers, FileText, Wrench, Sparkles, Settings, Building, Briefcase, BarChart3, Stethoscope, Compass, Network, Palette, Package, Megaphone, HelpCircle, Plus, Move, MoreVertical, Search, MoreHorizontal, Loader2 } from "lucide-react";
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

export default function SidePanel() {
    const pathname = usePathname();
    const router = useRouter();
    const signOut = useSignOut();
    const currentTenantId = useAuthStore((s) => s.tenantId);
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
                {/* Organization Logo */}
                <div className="px-4 py-4 border-b">
                    <Link href="/dashboard/organization" className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={organization?.logo || ""} alt={organization?.company_name || "Organization"} />
                            <AvatarFallback className="text-lg font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300">
                                {organization?.company_name?.charAt(0).toUpperCase() || "O"}
                            </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-sm truncate">
                            {organization?.company_name || "Organization"}
                        </span>
                    </Link>
                </div>

                {/* Brain Space Selector */}
                <SidebarGroup>
                    <SidebarGroupContent>
                        <div className="px-2 py-2">
                            <Label className="text-xs text-muted-foreground mb-2 block">Brain Space</Label>
                            <Select
                                value={currentBrainSpaceId ? String(currentBrainSpaceId) : undefined}
                                onValueChange={handleBrainSpaceChange}
                            >
                                <SelectTrigger className="w-full">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <Brain className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
                                        <SelectValue placeholder="Select a brain space">
                                            {currentBrainSpace ? (
                                                <span className="truncate">{truncateText(currentBrainSpace.title, 20)}</span>
                                            ) : (
                                                "Select a brain space"
                                            )}
                                        </SelectValue>
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    {workspaces && workspaces.length > 0 ? (
                                        <>
                                            {workspaces.map((workspace) => (
                                                <SelectItem key={workspace.id} value={String(workspace.id)}>
                                                    <div className="flex items-center gap-2">
                                                        <Brain className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                                        <span className="truncate">{workspace.title}</span>
                                                        {currentBrainSpaceId === workspace.id && (
                                                            <span className="ml-auto text-xs text-muted-foreground">(Current)</span>
                                                        )}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                            {canCreateBrainspace && (
                                                <>
                                                    <SelectItem value="create-new" className="text-primary">
                                                        <div className="flex items-center gap-2">
                                                            <Plus className="h-4 w-4" />
                                                            <span>Create New Brain Space</span>
                                                        </div>
                                                    </SelectItem>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                            No brain spaces available
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>

                            {/* Create Brain Space Dialog */}
                            {canCreateBrainspace && (
                                <AlertDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Create a new brain space</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Enter a name for your new brain space below.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <form
                                            onSubmit={createForm.handleSubmit(onCreateBrainSpace)}
                                            className="space-y-4"
                                        >
                                            <div>
                                                <Label htmlFor="brainspace-name">
                                                    Brainspace name
                                                </Label>
                                                <Input
                                                    id="brainspace-name"
                                                    placeholder="e.g. ai-brainspace"
                                                    {...createForm.register("name")}
                                                    aria-invalid={!!createForm.formState.errors.name}
                                                />
                                                {createForm.formState.errors.name && (
                                                    <p className="text-sm !text-red-500 mt-1">
                                                        {createForm.formState.errors.name.message}
                                                    </p>
                                                )}
                                            </div>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel disabled={isCreatingWorkspace}>
                                                    Cancel
                                                </AlertDialogCancel>
                                                <Button
                                                    type="submit"
                                                    disabled={isCreatingWorkspace}
                                                    className="ml-2"
                                                >
                                                    {isCreatingWorkspace ? "Creating..." : "Create"}
                                                </Button>
                                            </AlertDialogFooter>
                                        </form>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}

                            {/* Move Articles Dialog */}
                            <AlertDialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
                                <AlertDialogContent className="max-w-2xl">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Move Articles</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Select articles to move and choose the target collection.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>

                                    {sourceCollectionId && (
                                        <div className="space-y-4">
                                            {/* Source Collection Info */}
                                            <div>
                                                <Label>From Collection</Label>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {collections?.find(c => c.id === sourceCollectionId)?.title || "Unknown"}
                                                </p>
                                            </div>

                                            {/* Articles List */}
                                            <div>
                                                <Label>Select Articles to Move</Label>
                                                <div className="mt-2 max-h-60 overflow-y-auto border rounded-md p-2 space-y-2">
                                                    {getCollectionNotes(sourceCollectionId).length === 0 ? (
                                                        <p className="text-sm text-muted-foreground text-center py-4">
                                                            No articles in this collection
                                                        </p>
                                                    ) : (
                                                        getCollectionNotes(sourceCollectionId).map((note: { id: number; title: string }) => (
                                                            <div key={note.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded">
                                                                <input
                                                                    type="checkbox"
                                                                    id={`note-${note.id}`}
                                                                    checked={selectedNoteIds.includes(note.id)}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            setSelectedNoteIds([...selectedNoteIds, note.id]);
                                                                        } else {
                                                                            setSelectedNoteIds(selectedNoteIds.filter(id => id !== note.id));
                                                                        }
                                                                    }}
                                                                    className="rounded"
                                                                />
                                                                <label
                                                                    htmlFor={`note-${note.id}`}
                                                                    className="flex-1 text-sm cursor-pointer"
                                                                >
                                                                    {note.title}
                                                                </label>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                                {getCollectionNotes(sourceCollectionId).length > 0 && (
                                                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                                        <span>
                                                            {selectedNoteIds.length} of {getCollectionNotes(sourceCollectionId).length} selected
                                                        </span>
                                                        <button
                                                            onClick={() => {
                                                                if (selectedNoteIds.length === getCollectionNotes(sourceCollectionId).length) {
                                                                    setSelectedNoteIds([]);
                                                                } else {
                                                                    setSelectedNoteIds(
                                                                        getCollectionNotes(sourceCollectionId).map(
                                                                            (n: { id: number }) => n.id
                                                                        )
                                                                    );
                                                                }
                                                            }}
                                                            className="text-primary hover:underline"
                                                        >
                                                            {selectedNoteIds.length === getCollectionNotes(sourceCollectionId).length ? "Deselect All" : "Select All"}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Target Collection Select */}
                                            <div>
                                                <Label htmlFor="target-collection">To Collection *</Label>
                                                <Select
                                                    value={targetCollectionId}
                                                    onValueChange={setTargetCollectionId}
                                                >
                                                    <SelectTrigger id="target-collection" className="w-full mt-2">
                                                        <SelectValue placeholder="Select target collection" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {allCollections
                                                            ?.filter(c => c.id !== sourceCollectionId)
                                                            .map((collection) => (
                                                                <SelectItem key={collection.id} value={String(collection.id)}>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium">{collection.title}</span>
                                                                        {collection.workspaceName && (
                                                                            <span className="text-xs text-muted-foreground">
                                                                                {collection.workspaceName}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    )}

                                    <AlertDialogFooter>
                                        <AlertDialogCancel disabled={isMovingNote}>
                                            Cancel
                                        </AlertDialogCancel>
                                        <Button
                                            onClick={handleMoveArticles}
                                            disabled={isMovingNote || selectedNoteIds.length === 0 || !targetCollectionId}
                                        >
                                            {isMovingNote ? "Moving..." : `Move ${selectedNoteIds.length} Article(s)`}
                                        </Button>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </SidebarGroupContent>
                </SidebarGroup>

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
                                        className={`px-2 py-1 rounded ${pathname === "/chat" || pathname === "/chat/new" ? "bg-gray-300 font-semibold" : "hover:bg-gray-200"
                                            }`}
                                    >
                                        <MessageSquare className="mr-2 h-4 w-4 text-fuchsia-600 dark:text-fuchsia-400" />
                                        New Chat
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link
                                        href="/chat/search"
                                        className={`px-2 py-1 rounded ${pathname === "/chat/search" || pathname.startsWith("/chat/search/") ? "bg-gray-300 font-semibold" : "hover:bg-gray-200"
                                            }`}
                                    >
                                        <Search className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                        Chat Search
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

                {/* Chat History */}
                {true && (
                    <SidebarGroup>
                        <SidebarGroupLabel>
                            <button
                                onClick={() => setChatsOpen(!chatsOpen)}
                                className="flex items-center gap-2 w-full text-left"
                            >
                                {chatsOpen ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronUp className="h-4 w-4 rotate-[-90deg]" />
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
                                                                    ? "bg-gray-300 font-semibold"
                                                                    : "hover:bg-gray-200"
                                                                    } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                                                            >
                                                                <div className="flex items-center gap-2 w-full">
                                                                    {isLoading ? (
                                                                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                                                    ) : null}
                                                                    <span className="flex-1">{chat.name}</span>
                                                                </div>
                                                                {!isLoading && (
                                                                    <span className="text-xs text-gray-500 truncate">
                                                                        {getLastMessage(chat)}
                                                                    </span>
                                                                )}
                                                            </Link>
                                                        </SidebarMenuButton>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild disabled={isLoading}>
                                                                <SidebarMenuAction disabled={isLoading}>
                                                                    {isLoading ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    )}
                                                                </SidebarMenuAction>
                                                            </DropdownMenuTrigger>
                                                            {!isLoading && (
                                                                <DropdownMenuContent side="right" align="start">
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
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === '/dashboard/workspaces' || pathname.startsWith('/dashboard/workspaces/')}
                                    >
                                        <Link href="/dashboard/workspaces" className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-2">
                                                <Brain className="h-4 w-4 text-violet-600 dark:text-violet-400" />
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
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === '/dashboard/collections'}
                                    >
                                        <Link href="/dashboard/collections" className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-2">
                                                <Layers className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
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
                                            href="/dashboard/roadmap"
                                            className={`px-2 py-1 rounded ${
                                                pathname === "/dashboard/roadmap" ||
                                                pathname.startsWith("/dashboard/roadmap/")
                                                    ? "bg-gray-300 font-semibold"
                                                    : "hover:bg-gray-200"
                                            }`}
                                        >
                                            <BarChart3 className="mr-2 h-4 w-4 text-sky-600 dark:text-sky-400" />
                                            Roadmap
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>

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
                                        ws => pathname.startsWith(`/dashboard/workspaces/${ws.uuid ?? ws.id}`)
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
                                                            `/dashboard/workspaces/${workspace.uuid ?? workspace.id}`
                                                        );
                                                        const isWorkspaceExpanded = expandedWorkspaces.has(workspace.id);
                                                        const workspaceCollections = getWorkspaceCollections(workspace.id);
                                                        const hasCollections = workspaceCollections.length > 0;

                                                        return (
                                                            <SidebarMenuSubItem key={workspace.id}>
                                                                <div className="w-full">
                                                                    <SidebarMenuSubButton
                                                                        asChild={!hasCollections}
                                                                        isActive={isWorkspaceActive}
                                                                        onClick={hasCollections ? (e) => toggleWorkspace(workspace.id, e) : undefined}
                                                                        className={hasCollections ? "cursor-pointer" : ""}
                                                                    >
                                                                        {hasCollections ? (
                                                                            <div className="flex items-center justify-between w-full">
                                                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                                    {isWorkspaceExpanded ? (
                                                                                        <ChevronDown className="h-3 w-3 shrink-0" />
                                                                                    ) : (
                                                                                        <ChevronUp className="h-3 w-3 shrink-0 rotate-[-90deg]" />
                                                                                    )}
                                                                                    <FolderOpen className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                                                                    <span className="truncate flex-1">
                                                                                        {truncateText(workspace.title, 25)}
                                                                                    </span>
                                                                                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                                                                                        ({workspaceCollections.length})
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <Link
                                                                                href={`/dashboard/workspaces/${workspace.uuid ?? workspace.id}/collections`}
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
                                                                        )}
                                                                    </SidebarMenuSubButton>
                                                                    {hasCollections && isWorkspaceExpanded && (
                                                                        <div className="ml-6 mt-1 space-y-1 relative z-0">
                                                                            {workspaceCollections.map((collection, index) => {
                                                                                const isLast = index === workspaceCollections.length - 1;
                                                                                const collectionSegment = collection.uuid ?? collection.id;
                                                                                const isCollectionActive = pathname.startsWith(
                                                                                    `/dashboard/workspaces/${workspace.uuid ?? workspace.id}/collections/${collectionSegment}`
                                                                                );
                                                                                // Get article count for this collection (use allCollections and allNoteQueries)
                                                                                const collectionIndex = allCollections?.findIndex(c => c.id === collection.id) ?? -1;
                                                                                // Prefer query data if available, otherwise use collection.members as fallback
                                                                                let articleCount = 0;
                                                                                if (collectionIndex >= 0 && collectionIndex < allNoteQueries.length) {
                                                                                    const query = allNoteQueries[collectionIndex];
                                                                                    if (query?.data) {
                                                                                        articleCount = query.data.length;
                                                                                    } else {
                                                                                        // Use fallback while loading or if query failed
                                                                                        articleCount = collection.members || 0;
                                                                                    }
                                                                                } else {
                                                                                    articleCount = collection.members || 0;
                                                                                }

                                                                                const collectionNotes = getCollectionNotes(collection.id);

                                                                                return (
                                                                                    <div key={collection.id} className={`flex items-center group relative z-0 ${isLast ? 'rounded-b-md overflow-hidden' : ''}`}>
                                                                                        <SidebarMenuSubButton
                                                                                            asChild
                                                                                            isActive={isCollectionActive}
                                                                                            className={`pl-4 flex-1 relative z-0 ${isLast ? 'rounded-b-md' : ''}`}
                                                                                        >
                                                                                            <Link
                                                                                                href={`/dashboard/workspaces/${workspace.uuid ?? workspace.id}/collections/${collection.uuid ?? collection.id}/notes`}
                                                                                                title={collection.title}
                                                                                            >
                                                                                                <Layers className="h-3 w-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
                                                                                                <span className="truncate flex-1">
                                                                                                    {truncateText(collection.title, 20)}
                                                                                                </span>
                                                                                                <span className="text-xs text-muted-foreground shrink-0 ml-2">
                                                                                                    ({articleCount})
                                                                                                </span>
                                                                                            </Link>
                                                                                        </SidebarMenuSubButton>
                                                                                        {articleCount > 0 && (
                                                                                            <DropdownMenu>
                                                                                                <DropdownMenuTrigger asChild>
                                                                                                    <button
                                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-opacity mr-1"
                                                                                                        title="Move articles"
                                                                                                    >
                                                                                                        <MoreVertical className="h-3 w-3 text-muted-foreground" />
                                                                                                    </button>
                                                                                                </DropdownMenuTrigger>
                                                                                                <DropdownMenuContent align="end">
                                                                                                    <DropdownMenuItem
                                                                                                        onClick={(e) => handleMoveArticleClick(collection.id, e)}
                                                                                                    >
                                                                                                        <Move className="mr-2 h-4 w-4" />
                                                                                                        Move Articles
                                                                                                    </DropdownMenuItem>
                                                                                                </DropdownMenuContent>
                                                                                            </DropdownMenu>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </div>
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