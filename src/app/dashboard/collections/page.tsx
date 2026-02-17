"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CollectionList } from "@/src/components/List/Collection/CollectionList";
import { FaPlus } from "react-icons/fa";
import { Layers, FolderOpen, Sparkles, Building } from "lucide-react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
} from "@/components/ui/breadcrumb";
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
import { useUserCollections, useCreateUserCollection } from "@/src/hooks/useCollection";
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

const createCollectionSchema = z.object({
    name: z.string().min(1, "Name is required").max(100, "Name is too long"),
    description: z.string().max(500, "Description is too long").optional(),
    visibility: z.enum(["private", "public", "shared"]),
    workspace_id: z.number().min(1, "Workspace is required"),
});

type CreateCollectionFormValues = z.infer<typeof createCollectionSchema>;

export default function AllCollectionsPage() {
    const { data: allCollections, isLoading, isError, error, refetch } = useUserCollections();
    const { data: workspaces } = useUserWorkspaces();
    const { mutate: createCollection, isPending } = useCreateUserCollection();
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Permission checks - hide elements until permissions are loaded and confirmed
    const { hasPermission, isOwnerOrAdmin, isLoading: permissionsLoading } = useUserPermissions();
    const canCreateCollection = !permissionsLoading && (
        hasPermission(PERMISSIONS.COLLECTION_CREATE) || isOwnerOrAdmin
    );
    const canCreatePrivateCollection = !permissionsLoading && (
        hasPermission(PERMISSIONS.COLLECTION_CREATE_PRIVATE) || isOwnerOrAdmin
    );

    const form = useForm<CreateCollectionFormValues>({
        resolver: zodResolver(createCollectionSchema),
        defaultValues: {
            name: "",
            description: "",
            visibility: "public", // Default to public if user doesn't have private permission
            workspace_id: workspaces && workspaces.length > 0 ? workspaces[0].id : 0,
        },
    });

    // Update default visibility based on permissions when they load
    if (!permissionsLoading && !canCreatePrivateCollection && form.getValues("visibility") === "private") {
        form.setValue("visibility", "public");
    }

    // Update default workspace_id when workspaces load
    if (workspaces && workspaces.length > 0 && form.getValues("workspace_id") === 0) {
        form.setValue("workspace_id", workspaces[0].id);
    }

    const onSubmit = (values: CreateCollectionFormValues) => {
        createCollection(
            {
                name: values.name,
                description: values.description || null,
                visibility: values.visibility,
                workspace_id: values.workspace_id,
            },
            {
                onSuccess: (res) => {
                    if (res?.status) {
                        toast.success(res.message || "Collection created successfully!");
                        form.reset();
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
            <div className="flex flex-col items-center justify-center p-6">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard/collections">
                                Collections
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <nav className="sticky top-0 w-[90%] mx-auto self-center px-15 flex justify-between items-center bg-background border-b border-border py-5">
                    <Input
                        type="text"
                        placeholder="Search collections..."
                        className="w-64"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />

                    {canCreateCollection && (
                        <AlertDialog open={open} onOpenChange={setOpen}>
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
                                        <Label className="pb-3" htmlFor="workspace_id">
                                            Workspace
                                        </Label>
                                        <select
                                            id="workspace_id"
                                            {...form.register("workspace_id", { valueAsNumber: true })}
                                            className="w-full px-4 py-2 border rounded-md"
                                        >
                                            {workspaces?.map((ws) => (
                                                <option key={ws.id} value={ws.id}>
                                                    {ws.title}
                                                </option>
                                            ))}
                                        </select>
                                        {form.formState.errors.workspace_id && (
                                            <p className="text-sm !text-red-500 mt-1">
                                                {form.formState.errors.workspace_id.message}
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

                {allCollections && allCollections.length > 0 && (
                    <CollectionList
                        collections={allCollections}
                        workspace={{ id: 0 }}
                        searchQuery={searchQuery}
                    />
                )}

                {allCollections && allCollections.length === 0 && !isLoading && (
                    <div className="w-full flex items-center justify-center p-10 mt-10">
                        <div className="flex flex-col items-center text-center max-w-md">
                            {/* Empty State Icon with Animations */}
                            <div className="relative mb-6">
                                {/* Animated background gradient */}
                                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-fuchsia-500/20 rounded-full blur-3xl animate-pulse"></div>

                                {/* Main icon container */}
                                <div className="relative w-24 h-24 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center border border-violet-500/20 dark:border-violet-500/30 shadow-lg animate-pulse">
                                    <Layers className="w-12 h-12 text-violet-500 dark:text-violet-400" />
                                </div>

                                {/* Animated folder icon badge */}
                                <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                    <FolderOpen className="w-5 h-5 text-white" />
                                </div>

                                {/* Decorative sparkles */}
                                <div className="absolute -top-2 -right-2">
                                    <Sparkles className="w-5 h-5 text-violet-400 animate-pulse" style={{ animationDelay: '0s' }} />
                                </div>
                                <div className="absolute -bottom-2 -left-2">
                                    <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
                                </div>
                                <div className="absolute top-1/2 -left-3">
                                    <Sparkles className="w-3 h-3 text-fuchsia-400 animate-pulse" style={{ animationDelay: '1s' }} />
                                </div>
                            </div>

                            {/* Text Content */}
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                                No Collections Yet
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                Collections help you organize your articles and resources. Create your first collection to get started!
                            </p>

                            {/* CTA Button - only show if user can create */}
                            {canCreateCollection && workspaces && workspaces.length > 0 && (
                                <Button
                                    onClick={() => setOpen(true)}
                                    className="bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0 hover:from-violet-600 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                                >
                                    <FaPlus className="mr-2 h-4 w-4" />
                                    Create Your First Collection
                                </Button>
                            )}

                            {(!workspaces || workspaces.length === 0) && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Building className="w-4 h-4" />
                                    <span>You need to create a brain space first before creating collections.</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </RequireAuth>
    );
}

