"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CollectionList } from "@/src/components/List/Collection/CollectionList";
import { useParams } from "next/navigation";
import { FaPlus } from "react-icons/fa";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
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
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import BlocksLoader from "@/src/components/Loaders/BlocksLoader/BlocksLoader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RequireAuth from "@/src/components/auth/requireAuth";

const createCollectionSchema = z.object({
    name: z.string().min(1, "Name is required").max(100, "Name is too long"),
    description: z.string().max(500, "Description is too long").optional(),
    visibility: z.enum(["private", "public", "shared"]).default("private"),
});

type CreateCollectionFormValues = z.infer<typeof createCollectionSchema>;

export default function WorkspacePage() {
    const params = useParams();
    const workspaceId = Array.isArray(params.workspaceId) ? params.workspaceId[0] : params.workspaceId;
    const { data: allCollections, isLoading, isError, error, refetch } = useUserCollections();
    const { mutate: createCollection, isPending } = useCreateUserCollection();
    const [open, setOpen] = useState(false);

    // Filter collections for current workspace only
    const collections = allCollections?.filter(
        (collection) => collection.workspaceId === Number(workspaceId)
    );

    const form = useForm<CreateCollectionFormValues>({
        resolver: zodResolver(createCollectionSchema),
        defaultValues: {
            name: "",
            description: "",
            visibility: "private"
        },
    });

    const onSubmit = (values: CreateCollectionFormValues) => {
        createCollection(
            {
                name: values.name,
                description: values.description || null,
                visibility: values.visibility,
                workspace_id: Number(workspaceId),
            },
            {
                onSuccess: (res) => {
                    if (res?.status) {
                        toast.success(res.message || "Collection created successfully!");
                        form.reset();
                        setOpen(false);
                        refetch(); // Refresh the collections list
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
                            <BreadcrumbLink href="/dashboard/workspaces">Workspaces</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href={`/dashboard/workspaces/${workspaceId}/collections`}>
                                Collections
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <nav className="sticky top-0 w-[90%] mx-auto self-center px-15 flex justify-between items-center bg-background border-b border-border py-5">
                    <input
                        type="text"
                        placeholder="Search..."
                        className="px-4 py-2 border rounded-md w-1/3"
                    />

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
                                    <Label className="pb-3" htmlFor="visibility">
                                        Visibility
                                    </Label>
                                    <select
                                        id="visibility"
                                        {...form.register("visibility")}
                                        className="w-full px-4 py-2 border rounded-md"
                                    >
                                        <option value="private">Private</option>
                                        <option value="public">Public</option>
                                        <option value="shared">Shared</option>
                                    </select>
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

                {collections && collections.length > 0 && (
                    <CollectionList collections={collections} workspace={{ id: Number(workspaceId) }} />
                )}

                {collections && collections.length === 0 && !isLoading && (
                    <div className="w-full h-full flex items-center justify-center p-5">
                        <Card className="w-[400px] p-6 text-center">
                            <CardContent className="pt-6">
                                <p className="text-muted-foreground">No collections yet. Create your first one!</p>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </RequireAuth>
    );
}
