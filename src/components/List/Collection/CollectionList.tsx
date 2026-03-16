"use client";

import { Badge } from "@/components/ui/badge";
import Collections from "@/src/types/collections";
import { formatDateTime } from "@/src/utils/dateTimeFormat";
import Link from "next/link";
import { useState, useMemo } from "react";
import { useBrainSpaceStore } from "@/src/store/useBrainSpace";
import { Layers, FileText, MoreVertical, Trash2, ChevronRight, Clock, Lock, Globe, Users, ChevronLeft, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
    useDeleteUserCollection, 
    useUpdateUserCollection,
    useCollectionMembers,
    useTenantUsers,
    useAddCollectionMember,
    useRemoveCollectionMember
} from "@/src/hooks/useCollection";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuthStore } from "@/src/store/useAuth";
import { X, UserPlus } from "lucide-react";
import { useQueries } from "@tanstack/react-query";
import api from "@/src/lib/axios";
import routes from "@/src/lib/routes";

// Component to display member count for shared collections
function CollectionMemberCount({ collectionId }: { collectionId: number }) {
    const { data: members = [] } = useCollectionMembers(collectionId);
    const memberCount = members.length;
    
    return (
        <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <Users className="w-4 h-4" />
            <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
        </div>
    );
}


type CollectionListProps = {
    collections: Array<Collections>;
    workspace: { id: number; uuid?: string | null };
    onDelete?: () => void;
    searchQuery?: string;
    getWorkspaceUuid?: (workspaceId: number) => string | null | undefined;
};

const ITEMS_PER_PAGE = 6;

const updateCollectionSchema = z.object({
    name: z.string().min(1, "Name is required").max(100, "Name is too long").optional(),
    description: z.string().max(500, "Description is too long").optional(),
    visibility: z.enum(["private", "public", "shared"]).optional(),
});

type UpdateCollectionFormValues = z.infer<typeof updateCollectionSchema>;

export function CollectionList({ collections, workspace, onDelete, searchQuery = "", getWorkspaceUuid }: CollectionListProps) {
    const { mutate: deleteCollection, isPending: isDeleting } = useDeleteUserCollection();
    const { mutate: updateCollection, isPending: isUpdating } = useUpdateUserCollection();
    const { mutate: addMember, isPending: isAddingMember } = useAddCollectionMember();
    const { mutate: removeMember, isPending: isRemovingMember } = useRemoveCollectionMember();
    const userId = useAuthStore((state) => state.userId);
    const tenantId = useAuthStore((state) => state.tenantId);
    const hydrated = useAuthStore((state) => state.hydrated);
    const { setCurrentBrainSpaceId } = useBrainSpaceStore();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [collectionToDelete, setCollectionToDelete] = useState<number | null>(null);
    const [collectionToEdit, setCollectionToEdit] = useState<Collections | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedUserId, setSelectedUserId] = useState<number | "">("");
    
    // Fetch notes count from all collections to get accurate article counts
    const noteQueries = useQueries({
        queries: collections.map((collection) => ({
            queryKey: ["collectionNotes", collection.id, tenantId],
            queryFn: async () => {
                const { data } = await api.get(routes.notes.get, {
                    params: { collection_id: collection.id },
                });
                return data.data.notes || [];
            },
            enabled: !!collection.id && !!tenantId && hydrated && collections.length > 0,
            refetchOnMount: true,
            staleTime: 0, // Always consider data stale to ensure fresh counts
        })),
    });
    
    // Helper function to get article count for a collection
    const getArticleCount = (collection: Collections) => {
        const collectionIndex = collections.findIndex(c => c.id === collection.id);
        if (collectionIndex >= 0 && collectionIndex < noteQueries.length) {
            const query = noteQueries[collectionIndex];
            if (query?.data) {
                return query.data.length;
            }
        }
        // Fallback to collection.members if query data not available
        return collection.members || 0;
    };
    
    // Initialize form first
    const form = useForm<UpdateCollectionFormValues>({
        resolver: zodResolver(updateCollectionSchema),
        defaultValues: {
            name: "",
            description: "",
            visibility: "private",
        },
    });
    
    // Fetch members and users when editing a collection
    const visibility = form.watch("visibility");
    const shouldFetchMembers = editDialogOpen && collectionToEdit && visibility === "shared";
    const { data: members = [], refetch: refetchMembers } = useCollectionMembers(
        collectionToEdit?.id || 0
    );
    const { data: tenantUsers = [] } = useTenantUsers();

    // Check if user owns a collection
    const isOwner = (collection: Collections) => {
        return userId !== null && String(userId) === collection.createdBy;
    };

    // Filter collections based on search query
    const filteredCollections = useMemo(() => {
        if (!searchQuery.trim()) return collections;
        
        const query = searchQuery.toLowerCase().trim();
        return collections.filter(collection => 
            collection.title.toLowerCase().includes(query) ||
            collection.description?.toLowerCase().includes(query) ||
            collection.workspaceName?.toLowerCase().includes(query)
        );
    }, [collections, searchQuery]);

    // Pagination logic
    const totalPages = Math.ceil(filteredCollections.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedCollections = filteredCollections.slice(startIndex, endIndex);

    // Reset to page 1 when search changes
    useMemo(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // Get visibility icon and color (red-accented)
    const getVisibilityConfig = (visibility?: string) => {
        switch (visibility) {
            case "public":
                return { icon: Globe, color: "text-[#DB2B30]", bg: "bg-[#DB2B30]/10", label: "Public" };
            case "shared":
                return { icon: Users, color: "text-[#B52227]", bg: "bg-[#B52227]/10", label: "Shared" };
            default:
                return { icon: Lock, color: "text-[#8A1B1F]", bg: "bg-[#8A1B1F]/10", label: "Private" };
        }
    };

    // Color accents for collection cards - red shades
    const accents = [
        { border: "hover:border-[#DB2B30]/50", icon: "from-[#DB2B30] to-[#B52227]", glow: "hover:shadow-[#DB2B30]/10" },
        { border: "hover:border-[#B52227]/50", icon: "from-[#B52227] to-[#8A1B1F]", glow: "hover:shadow-[#B52227]/10" },
        { border: "hover:border-[#F04A4F]/50", icon: "from-[#F04A4F] to-[#DB2B30]", glow: "hover:shadow-[#F04A4F]/10" },
        { border: "hover:border-[#C7393E]/50", icon: "from-[#C7393E] to-[#8A1B1F]", glow: "hover:shadow-[#C7393E]/10" },
    ];

    const getAccent = (index: number) => accents[index % accents.length];

    const handleDeleteClick = (collectionId: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Find the collection to check for articles
        const collection = collections.find(c => c.id === collectionId);
        if (collection) {
            const articleCount = getArticleCount(collection);
            if (articleCount > 0) {
                toast.error(`Cannot delete collection. It contains ${articleCount} article(s). Please delete all articles first.`);
                return;
            }
        }
        
        setCollectionToDelete(collectionId);
        setDeleteDialogOpen(true);
    };

    const handleEditClick = (collection: Collections, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCollectionToEdit(collection);
        setSelectedUserId("");
        form.reset({
            name: collection.title,
            description: collection.description || "",
            visibility: (collection.visibility as "private" | "public" | "shared" | undefined) || "private",
        });
        setEditDialogOpen(true);
    };
    
    const handleAddMember = () => {
        if (!collectionToEdit || !selectedUserId) return;
        
        addMember(
            {
                collectionId: collectionToEdit.id,
                payload: { user_id: Number(selectedUserId), role: "viewer" },
            },
            {
                onSuccess: () => {
                    toast.success("Member added successfully!");
                    setSelectedUserId("");
                    refetchMembers();
                },
                onError: (err: any) => {
                    toast.error(err?.response?.data?.detail || "Failed to add member");
                },
            }
        );
    };
    
    const handleRemoveMember = (userId: number) => {
        if (!collectionToEdit) return;
        
        removeMember(
            {
                collectionId: collectionToEdit.id,
                userId,
            },
            {
                onSuccess: () => {
                    toast.success("Member removed successfully!");
                    refetchMembers();
                },
                onError: (err: any) => {
                    toast.error(err?.response?.data?.detail || "Failed to remove member");
                },
            }
        );
    };
    
    // Filter out users who are already members and the owner
    const availableUsers = tenantUsers.filter(
        (user) => user.id !== userId && !members.some((member) => member.user_id === user.id)
    );

    const onSubmitEdit = (values: UpdateCollectionFormValues) => {
        if (!collectionToEdit) return;

        const payload: any = {};
        if (values.name !== undefined && values.name !== collectionToEdit.title) {
            payload.name = values.name;
        }
        if (values.description !== undefined && values.description !== collectionToEdit.description) {
            payload.description = values.description || null;
        }
        if (values.visibility !== undefined && values.visibility !== collectionToEdit.visibility) {
            payload.visibility = values.visibility;
        }

        if (Object.keys(payload).length === 0) {
            toast.info("No changes to save");
            return;
        }

        updateCollection(
            { collectionId: collectionToEdit.id, payload },
            {
                onSuccess: (res) => {
                    if (res?.status) {
                        toast.success(res.message || "Collection updated successfully!");
                        setEditDialogOpen(false);
                        setCollectionToEdit(null);
                        form.reset();
                        if (onDelete) onDelete();
                    } else {
                        toast.error(res?.message || "Could not update collection.");
                    }
                },
                onError: (err: any) => {
                    const errorMessage = err?.response?.data?.detail || err?.message || "Failed to update collection.";
                    
                    // Don't show error if it's a permission error and user shouldn't have access
                    if (err?.response?.status === 403) {
                        toast.error("You don't have permission to edit this collection. Only the owner can edit it.");
                    } else {
                        toast.error(errorMessage);
                    }
                    
                    // Close dialog on error
                    setEditDialogOpen(false);
                    setCollectionToEdit(null);
                    form.reset();
                },
            }
        );
    };

    const confirmDelete = () => {
        if (collectionToDelete) {
            deleteCollection(collectionToDelete, {
                onSuccess: (res) => {
                    if (res?.status) {
                        toast.success(res.message || "Collection deleted successfully!");
                        setDeleteDialogOpen(false);
                        setCollectionToDelete(null);
                        if (onDelete) onDelete();
                    } else {
                        toast.error(res?.message || "Could not delete collection.");
                    }
                },
                onError: (err: any) => {
                    toast.error(err?.response?.data?.detail || "Failed to delete collection.");
                },
            });
        }
    };

    return (
        <>
            <div className="w-full p-6" style={{ position: 'relative', zIndex: 0 }}>
                {/* Empty search results */}
                {filteredCollections.length === 0 && searchQuery.trim() && (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#DB2B30]/20 via-[#B52227]/20 to-[#8A1B1F]/20 rounded-full blur-3xl animate-pulse" />
                            <div className="relative w-20 h-20 bg-gradient-to-br from-[#DB2B30]/10 to-[#8A1B1F]/10 rounded-full flex items-center justify-center border border-[#DB2B30]/30 shadow-lg">
                                <Layers className="w-10 h-10 text-[#DB2B30]" />
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">No Results Found</h3>
                        <p className="text-muted-foreground text-center">
                            No collections found matching &quot;{searchQuery}&quot;.
                        </p>
                    </div>
                )}

                {/* Collection Grid - Horizontal Card Layout */}
                {filteredCollections.length > 0 && (
                    <div className="space-y-4">
                        {paginatedCollections.map((collection, index) => {
                            const accent = getAccent(index);
                            const visibility = getVisibilityConfig(collection.visibility);
                            const VisibilityIcon = visibility.icon;

                            return (
                                <Link
                                    key={collection.id}
                                    href={`/dashboard/workspaces/${(collection.workspaceId === workspace.id ? workspace.uuid : getWorkspaceUuid?.(collection.workspaceId)) ?? collection.workspaceId}/collections/${collection.uuid ?? collection.id}/notes`}
                                    className="group block"
                                    style={{ position: 'relative', zIndex: 0 }}
                                    onClick={() => {
                                        // Set the workspace when clicking on a collection
                                        if (collection.workspaceId) {
                                            setCurrentBrainSpaceId(collection.workspaceId);
                                        }
                                    }}
                                >
                                    <div className={`relative bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg ${accent.glow} ${accent.border}`} style={{ position: 'relative', zIndex: 0 }}>
                                        <div className="flex items-stretch">
                                            {/* Left Color Bar & Icon */}
                                            <div className={`w-20 shrink-0 bg-gradient-to-b ${accent.icon} flex items-center justify-center`}>
                                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                                    <Layers className="w-6 h-6 text-white" />
                                                </div>
                                            </div>

                                            {/* Main Content */}
                                            <div className="flex-1 p-5 min-w-0">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="min-w-0 flex-1">
                                                        {/* Title Row */}
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="font-semibold text-lg text-foreground truncate group-hover:text-[#DB2B30] dark:group-hover:text-[#DB2B30] transition-colors" title={collection.title}>
                                                                {collection.title}
                                                            </h3>
                                                            {/* Visibility Badge */}
                                                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${visibility.bg} ${visibility.color}`}>
                                                                <VisibilityIcon className="w-3 h-3" />
                                                                <span>{visibility.label}</span>
                                                            </div>
                                                        </div>

                                                        {/* Workspace Badge */}
                                                        <Badge variant="secondary" className="mb-3 text-xs">
                                                            <FileText className="w-3 h-3 mr-1" />
                                                            {collection.workspaceName || "Workspace"}
                                                        </Badge>

                                                        {/* Description */}
                                                        <p className="text-sm text-muted-foreground line-clamp-2" title={collection.description || "No description"}>
                                                            {collection.description || "No description provided"}
                                                        </p>
                                                    </div>

                                                    {/* Right Section: Actions & Arrow */}
                                                    <div className="flex items-center gap-3 shrink-0">
                                                        {/* Menu - Only show for collections the user owns */}
                                                        {isOwner(collection) && (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                    }}
                                                                    className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none"
                                                                >
                                                                    <MoreVertical className="w-4 h-4" />
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem
                                                                        onClick={(e) => handleEditClick(collection, e)}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        <Edit className="w-4 h-4 mr-2" />
                                                                        Edit Collection
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={(e) => handleDeleteClick(collection.id, e)}
                                                                        className="text-red-600 focus:text-red-600 cursor-pointer"
                                                                    >
                                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                                        Delete Collection
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        )}

                                                        {/* Arrow */}
                                                        <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-teal-500 transition-colors">
                                                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Footer Stats */}
                                                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
                                                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                                                        <Clock className="w-4 h-4" />
                                                        <span>{formatDateTime(collection.createdAt)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                                                        <FileText className="w-4 h-4" />
                                                        <span>{getArticleCount(collection)} articles</span>
                                                    </div>
                                                    {collection.visibility === "shared" && (
                                                        <CollectionMemberCount collectionId={collection.id} />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {/* Pagination Controls */}
                {filteredCollections.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-border">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="gap-1"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </Button>
                        
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-9 h-9 p-0 ${currentPage === page ? "bg-teal-500 hover:bg-teal-600" : ""}`}
                                >
                                    {page}
                                </Button>
                            ))}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="gap-1"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                )}

                {/* Results count */}
                {filteredCollections.length > 0 && (
                    <div className="text-center text-sm text-muted-foreground mt-4">
                        Showing {startIndex + 1}-{Math.min(endIndex, filteredCollections.length)} of {filteredCollections.length} collections
                    </div>
                )}
            </div>

            {/* Edit Dialog */}
            <AlertDialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Edit className="w-5 h-5 text-teal-500" />
                            Edit Collection
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Update the collection name, description, or visibility settings.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-4">
                        <div>
                            <Label className="pb-3" htmlFor="edit-name">
                                Collection name
                            </Label>
                            <Input
                                id="edit-name"
                                placeholder="e.g. My Research Collection"
                                {...form.register("name")}
                                aria-invalid={!!form.formState.errors.name}
                            />
                            {form.formState.errors.name && (
                                <p className="text-sm !text-red-500 mt-1">
                                    {form.formState.errors.name.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label className="pb-3" htmlFor="edit-description">
                                Description (optional)
                            </Label>
                            <Input
                                id="edit-description"
                                placeholder="e.g. Collection for AI research papers"
                                {...form.register("description")}
                                aria-invalid={!!form.formState.errors.description}
                            />
                            {form.formState.errors.description && (
                                <p className="text-sm !text-red-500 mt-1">
                                    {form.formState.errors.description.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label className="pb-3" htmlFor="edit-visibility">
                                Visibility
                            </Label>
                            <Controller
                                name="visibility"
                                control={form.control}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className="w-full" id="edit-visibility">
                                            <SelectValue placeholder="Select visibility" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="private">Private</SelectItem>
                                            <SelectItem value="public">Public</SelectItem>
                                            <SelectItem value="shared">Shared</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {form.formState.errors.visibility && (
                                <p className="text-sm !text-red-500 mt-1">
                                    {form.formState.errors.visibility.message}
                                </p>
                            )}
                        </div>

                        {/* Member Management Section - Only show when visibility is "shared" */}
                        {form.watch("visibility") === "shared" && collectionToEdit && (
                            <div className="space-y-3 pt-4 border-t border-border">
                                <Label className="text-base font-semibold">Shared Members</Label>
                                <p className="text-sm text-muted-foreground">
                                    Add members who can view this collection. Only these members and the owner will be able to see it.
                                </p>
                                
                                {/* Add Member Section */}
                                <div className="flex gap-2">
                                    <Select
                                        value={selectedUserId.toString()}
                                        onValueChange={(value) => setSelectedUserId(value === "" ? "" : Number(value))}
                                    >
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Select a user to add" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableUsers.length === 0 ? (
                                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                    No users available to add
                                                </div>
                                            ) : (
                                                availableUsers.map((user) => (
                                                    <SelectItem key={user.id} value={user.id.toString()}>
                                                        {user.full_name || user.email}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        type="button"
                                        onClick={handleAddMember}
                                        disabled={!selectedUserId || isAddingMember}
                                        size="sm"
                                        className="shrink-0"
                                    >
                                        <UserPlus className="w-4 h-4 mr-1" />
                                        Add
                                    </Button>
                                </div>
                                
                                {/* Members List */}
                                {members.length > 0 && (
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {members.map((member) => (
                                            <div
                                                key={member.id}
                                                className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                        {member.full_name || member.email}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground capitalize">
                                                        {member.role}
                                                    </p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveMember(member.user_id)}
                                                    disabled={isRemovingMember}
                                                    className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {members.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No members added yet. Add members to share this collection with them.
                                    </p>
                                )}
                            </div>
                        )}

                        <AlertDialogFooter>
                            <AlertDialogCancel
                                disabled={isUpdating}
                                onClick={() => {
                                    form.reset();
                                    setCollectionToEdit(null);
                                }}
                            >
                                Cancel
                            </AlertDialogCancel>
                            <Button
                                type="submit"
                                disabled={isUpdating}
                                className="bg-teal-500 hover:bg-teal-600"
                            >
                                {isUpdating ? "Updating..." : "Update"}
                            </Button>
                        </AlertDialogFooter>
                    </form>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Trash2 className="w-5 h-5 text-red-500" />
                            Delete Collection
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this collection? This action cannot be undone.
                            All articles within this collection will also be deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}