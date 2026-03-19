"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CollectionList } from "@/src/components/List/Collection/CollectionList";
import { useParams } from "next/navigation";
import { FaPlus } from "react-icons/fa";
import { Layers, FolderOpen, Sparkles } from "lucide-react";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    useUserCollections,
    useCreateUserCollection,
    useTenantUsers,
    useAddCollectionMember
} from "@/src/hooks/useCollection";
import { useUserWorkspaces } from "@/src/hooks/useWorkspace";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm, Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import BlocksLoader from "@/src/components/Loaders/BlocksLoader/BlocksLoader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RequireAuth from "@/src/components/auth/requireAuth";
import { useUserPermissions, PERMISSIONS } from "@/src/hooks/useUserPermissions";
import { useAuthStore } from "@/src/store/useAuth";
import { useBrainSpaceStore } from "@/src/store/useBrainSpace";
import { X, UserPlus } from "lucide-react";

const createCollectionSchema = z.object({
    name: z.string().min(1, "Name is required").max(100, "Name is too long"),
    description: z.string().max(500, "Description is too long").optional(),
    visibility: z.enum(["private", "public", "shared"]),
});

type CreateCollectionFormValues = z.infer<typeof createCollectionSchema>;

export default function WorkspacePage() {
    const params = useParams();
    const workspaceParam = Array.isArray(params.workspaceId) ? params.workspaceId[0] : params.workspaceId; // UUID or legacy numeric id
    const { setCurrentBrainSpaceId, currentBrainSpaceId } = useBrainSpaceStore();
    const { data: allCollections, isLoading, isError, error, refetch } = useUserCollections();
    const { data: workspaces } = useUserWorkspaces();

    // Resolve URL param (UUID or legacy id) to workspace
    const workspace = workspaces?.find(
        (w) => w.uuid === workspaceParam || String(w.id) === workspaceParam
    );
    const workspaceIdNum = workspace?.id;

    // Set the workspace from URL when page loads
    useEffect(() => {
        if (workspaceIdNum && workspaceIdNum !== currentBrainSpaceId) {
            setCurrentBrainSpaceId(workspaceIdNum);
        }
    }, [workspaceIdNum, currentBrainSpaceId, setCurrentBrainSpaceId]);
    const { mutate: createCollection, isPending } = useCreateUserCollection();
    const { mutate: addMember, isPending: isAddingMember } = useAddCollectionMember();
    const userId = useAuthStore((state) => state.userId);
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | "">("");

    // Fetch tenant users for member selection
    const { data: tenantUsers = [] } = useTenantUsers();

    // Filter out the current user (owner) from the list
    const availableUsers = tenantUsers.filter(
        (user) => user.id !== userId && !selectedMembers.includes(user.id)
    );

    // Permission checks - hide elements until permissions are loaded and confirmed
    const { hasPermission, isOwnerOrAdmin, isLoading: permissionsLoading } = useUserPermissions();
    const hasBrainSpaces = (workspaces?.length ?? 0) > 0;
    const canCreateCollection = hasBrainSpaces && !!workspace && !permissionsLoading && (
        hasPermission(PERMISSIONS.COLLECTION_CREATE) || isOwnerOrAdmin
    );
    const canCreatePrivateCollection = !permissionsLoading && (
        hasPermission(PERMISSIONS.COLLECTION_CREATE_PRIVATE) || isOwnerOrAdmin
    );

    // Filter collections for current workspace only
    const collections = workspaceIdNum != null
        ? allCollections?.filter((collection) => collection.workspaceId === workspaceIdNum)
        : [];

    const form = useForm<CreateCollectionFormValues>({
        resolver: zodResolver(createCollectionSchema),
        defaultValues: {
            name: "",
            description: "",
            visibility: "public" // Default to public, will be updated based on permissions
        },
    });

    // Update default visibility based on permissions when they load (in effect to avoid setState during render)
    useEffect(() => {
        if (!permissionsLoading && !canCreatePrivateCollection && form.getValues("visibility") === "private") {
            form.setValue("visibility", "public");
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- form.setValue is stable; form ref would cause loops
    }, [permissionsLoading, canCreatePrivateCollection]);

    const handleAddMember = () => {
        if (!selectedUserId) return;
        setSelectedMembers([...selectedMembers, Number(selectedUserId)]);
        setSelectedUserId("");
    };

    const handleRemoveMember = (userId: number) => {
        setSelectedMembers(selectedMembers.filter((id) => id !== userId));
    };

    const onSubmit = (values: CreateCollectionFormValues) => {
        if (workspaceIdNum == null) return;
        createCollection(
            {
                name: values.name,
                description: values.description || null,
                visibility: values.visibility,
                workspace_id: workspaceIdNum,
            },
            {
                onSuccess: async (res) => {
                    if (res?.status) {
                        // If visibility is "shared" and there are members, add them
                        if (values.visibility === "shared" && selectedMembers.length > 0) {
                            // Get the collection ID from the response
                            // Response structure: { status, message, data: { message: { collection: { id, ... } } } }
                            const collectionId = (res?.data as any)?.message?.collection?.id ||
                                (res?.data as any)?.collection?.id;

                            if (collectionId) {
                                // Add all selected members sequentially to avoid race conditions
                                let successCount = 0;
                                for (const memberId of selectedMembers) {
                                    try {
                                        await new Promise<void>((resolve, reject) => {
                                            addMember(
                                                {
                                                    collectionId,
                                                    payload: { user_id: memberId, role: "viewer" },
                                                },
                                                {
                                                    onSuccess: () => {
                                                        successCount++;
                                                        resolve();
                                                    },
                                                    onError: (err) => reject(err),
                                                }
                                            );
                                        });
                                    } catch (err: any) {
                                        console.error(`Failed to add member ${memberId}:`, err);
                                    }
                                }

                                if (successCount === selectedMembers.length) {
                                    toast.success("Collection created and all members added successfully!");
                                } else if (successCount > 0) {
                                    toast.warning(`Collection created but only ${successCount} of ${selectedMembers.length} members were added.`);
                                } else {
                                    toast.warning("Collection created but members could not be added. You can add them manually.");
                                }
                            } else {
                                toast.success(res.message || "Collection created successfully!");
                                toast.info("Please add members manually from the collection settings.");
                            }
                        } else {
                            toast.success(res.message || "Collection created successfully!");
                        }

                        form.reset();
                        setSelectedMembers([]);
                        setSelectedUserId("");
                        setOpen(false);
                        // Small delay to ensure backend has processed, then refetch
                        setTimeout(() => {
                            refetch(); // Refresh the collections list
                        }, 100);
                    } else {
                        form.reset();
                        toast.error(res?.message || "Could not create collection.");
                    }
                },
                onError: (err: any) => {
                    toast.error(err?.message || "Request failed, please try again.");
                },
            }
        );
    };

    return (
        <RequireAuth>
            <div className="flex flex-col items-center justify-center p-4">
                <nav className="sticky top-0 z-[100] w-[90%] mx-auto self-center px-15 flex justify-between items-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border rounded-b-lg py-3 shadow-sm" style={{ isolation: 'isolate' }}>
                    <Input
                        type="text"
                        placeholder="Search collections..."
                        className="w-64"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />

                    {canCreateCollection && (
                        <AlertDialog
                            open={open}
                            onOpenChange={(isOpen) => {
                                setOpen(isOpen);
                                if (!isOpen) {
                                    // Reset form and selections when dialog closes
                                    form.reset();
                                    setSelectedMembers([]);
                                    setSelectedUserId("");
                                }
                            }}
                        >
                            <AlertDialogTrigger asChild>
                                <Button className="outline">
                                    <FaPlus className="mr-2" /> New Collection
                                </Button>
                            </AlertDialogTrigger>

                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Create a new collection</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Enter details for your new collection below.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>

                                <form
                                    id="create-collection-form"
                                    onSubmit={form.handleSubmit(onSubmit)}
                                    className="space-y-4"
                                >
                                    <div>
                                        <Label className="pb-3" htmlFor="name">
                                            Collection name
                                        </Label>
                                        <Input
                                            id="name"
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
                                        <Label className="pb-3" htmlFor="description">
                                            Description (optional)
                                        </Label>
                                        <Input
                                            id="description"
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
                                        <Label className="pb-3" htmlFor="visibility">
                                            Visibility
                                        </Label>
                                        <Controller
                                            name="visibility"
                                            control={form.control}
                                            render={({ field }) => (
                                                <Select
                                                    value={field.value}
                                                    onValueChange={(value) => {
                                                        // If user doesn't have permission and tries to select private, prevent it
                                                        if (value === "private" && !canCreatePrivateCollection) {
                                                            toast.error("You don't have permission to create private collections. Please contact an administrator.");
                                                            return;
                                                        }
                                                        field.onChange(value);
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full" id="visibility">
                                                        <SelectValue placeholder="Select visibility" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem
                                                            value="private"
                                                            disabled={!canCreatePrivateCollection}
                                                            className={!canCreatePrivateCollection ? "opacity-50 cursor-not-allowed" : ""}
                                                        >
                                                            Private {!canCreatePrivateCollection && "(Permission Required)"}
                                                        </SelectItem>
                                                        <SelectItem value="public">Public</SelectItem>
                                                        <SelectItem value="shared">Shared</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {!canCreatePrivateCollection && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                You need the "Create Private Collection" permission to create private collections.
                                            </p>
                                        )}
                                        {form.formState.errors.visibility && (
                                            <p className="text-sm !text-red-500 mt-1">
                                                {form.formState.errors.visibility.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Member Management Section - Only show when visibility is "shared" */}
                                    {form.watch("visibility") === "shared" && (
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
                                            {selectedMembers.length > 0 && (
                                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                                    {selectedMembers.map((memberId) => {
                                                        const member = tenantUsers.find((u) => u.id === memberId);
                                                        if (!member) return null;
                                                        return (
                                                            <div
                                                                key={memberId}
                                                                className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                                                            >
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium truncate">
                                                                        {member.full_name || member.email}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Viewer
                                                                    </p>
                                                                </div>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleRemoveMember(memberId)}
                                                                    className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {selectedMembers.length === 0 && (
                                                <p className="text-sm text-muted-foreground text-center py-4">
                                                    No members added yet. Add members to share this collection with them.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <AlertDialogFooter>
                                        <AlertDialogCancel disabled={isPending}>
                                            Cancel
                                        </AlertDialogCancel>
                                        <Button
                                            type="submit"
                                            disabled={isPending}
                                            className="ml-2"
                                        >
                                            {isPending ? "Creating..." : "Create"}
                                        </Button>
                                    </AlertDialogFooter>
                                </form>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </nav>

                {isLoading && (
                    <div className="w-full h-full flex items-center justify-center p-5">
                        <BlocksLoader />
                    </div>
                )}

                {isError && (
                    <div className="w-full h-full flex items-center justify-center p-5">
                        <Card className="w-[300px] h-[200px] flex flex-col border border-red-500 text-red-800 shadow-md">
                            <CardHeader className="border-b border-red-800">
                                <CardTitle className="text-lg font-semibold text-red-700">Error</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 flex items-center justify-center">
                                <p>{error?.message || "Something went wrong."}</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {workspaceParam && !workspace && workspaces && workspaces.length > 0 && (
                    <div className="w-full flex justify-center p-10">
                        <Card className="max-w-md">
                            <CardHeader>
                                <CardTitle>Brainspace not found</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">This brainspace does not exist or you don&apos;t have access to it.</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {collections && collections.length > 0 && workspaceIdNum != null && (
                    <div className="w-full mt-4" style={{ position: 'relative', zIndex: 0 }}>
                        <CollectionList collections={collections} workspace={{ id: workspaceIdNum, uuid: workspace?.uuid ?? undefined }} searchQuery={searchQuery} />
                    </div>
                )}

                {collections && collections.length === 0 && !isLoading && (
                    <div className="w-full flex items-center justify-center p-10 mt-10">
                        <div className="flex flex-col items-center text-center max-w-md">
                            {/* Empty State Icon with Animations - red theme to match sidebar Collections */}
                            <div className="relative mb-6">
                                {/* Animated background gradient */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B6B]/25 via-[#FF3B3B]/25 to-[#E10000]/25 rounded-full blur-3xl animate-pulse"></div>

                                {/* Main icon container */}
                                <div className="relative w-24 h-24 bg-gradient-to-br from-[#FF6B6B]/15 via-[#FF3B3B]/15 to-[#E10000]/15 dark:from-[#7F1D1D]/60 dark:via-[#991B1B]/60 dark:to-[#7F1D1D]/60 rounded-full flex items-center justify-center border border-[#DB2B30]/40 dark:border-[#DB2B30]/60 shadow-lg animate-pulse">
                                    <Layers className="w-12 h-12 text-[#DB2B30] dark:text-[#FDEBEB]" />
                                </div>

                                {/* Animated folder icon badge */}
                                <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-[#DB2B30] rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                    <FolderOpen className="w-5 h-5 text-white" />
                                </div>

                                {/* Decorative sparkles */}
                                <div className="absolute -top-2 -right-2">
                                    <Sparkles className="w-5 h-5 text-[#FFB3B3] animate-pulse" style={{ animationDelay: '0s' }} />
                                </div>
                                <div className="absolute -bottom-2 -left-2">
                                    <Sparkles className="w-4 h-4 text-[#FF8A8A] animate-pulse" style={{ animationDelay: '0.5s' }} />
                                </div>
                                <div className="absolute top-1/2 -left-3">
                                    <Sparkles className="w-3 h-3 text-[#FF6B6B] animate-pulse" style={{ animationDelay: '1s' }} />
                                </div>
                            </div>

                            {/* Text Content (keep message identical to sidebar Collections) */}
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                                {currentBrainSpaceId ? "No Collections in Selected Brain Space" : "No Collections Yet"}
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                {currentBrainSpaceId
                                    ? "This brain space doesn't have any collections yet. Create your first collection to get started!"
                                    : "Collections help you organize your articles and content. Select a brain space from the sidebar or create your first collection to get started!"
                                }
                            </p>

                            {/* CTA Button - only show if user can create */}
                            {canCreateCollection && (
                                <Button
                                    onClick={() => setOpen(true)}
                                    className="bg-[#DB2B30] hover:bg-[#B52227] text-white border-0 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                                >
                                    <FaPlus className="mr-2 h-4 w-4" />
                                    Create Your First Collection
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </RequireAuth>
    );
}
