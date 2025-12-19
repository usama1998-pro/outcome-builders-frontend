"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Collections from "@/src/types/collections";
import { formatDateTime } from "@/src/utils/dateTimeFormat";
import Link from "next/link";
import { useState, useMemo } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaUser, FaTrash } from "react-icons/fa";
import { useDeleteUserCollection } from "@/src/hooks/useCollection";
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


type CollectionListProps = {
    collections: Array<Collections>;
    workspace: { id: number };
    onDelete?: () => void;
    searchQuery?: string;
};

export function CollectionList({ collections, workspace, onDelete, searchQuery = "" }: CollectionListProps) {
    const { mutate: deleteCollection, isPending: isDeleting } = useDeleteUserCollection();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [collectionToDelete, setCollectionToDelete] = useState<number | null>(null);

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

    const handleDeleteClick = (collectionId: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCollectionToDelete(collectionId);
        setDeleteDialogOpen(true);
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
            <div className="w-full h-full flex flex-row flex-wrap gap-5 items-center justify-center p-5">
                {filteredCollections.length === 0 && searchQuery.trim() && (
                    <Card className="w-[300px] h-[200px] flex flex-col border border-muted shadow-md">
                        <CardHeader className="border-b border-muted">
                            <CardTitle className="text-lg font-semibold text-muted-foreground">No Results</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex items-center justify-center">
                            <p className="text-muted-foreground text-center">
                                No collections found matching &quot;{searchQuery}&quot;.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {filteredCollections.map((collection, key) => (
                    <div key={key} className="relative">
                        <Link
                            href={`/dashboard/workspaces/${workspace.id}/collections/${collection.id}/notes`}
                            className="no-underline"
                        >
                            <Card className="w-[300px] h-[220px] flex flex-col justify-between">
                                <CardHeader>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-md truncate max-w-[150px]" title={collection.workspaceName}>
                                            {collection.workspaceName}
                                        </span>
                                    </div>
                                    <CardTitle className="truncate max-w-[250px]" title={collection.title}>{collection.title}</CardTitle>
                                    <CardDescription>{formatDateTime(collection.createdAt)}</CardDescription>
                                    <CardAction>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                }}
                                                className="focus:outline-none"
                                            >
                                                <BsThreeDotsVertical />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem
                                                    onClick={(e) => handleDeleteClick(collection.id, e)}
                                                    className="text-red-600 focus:text-red-600 cursor-pointer"
                                                >
                                                    <FaTrash className="mr-2" />
                                                    Delete Collection
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </CardAction>
                        </CardHeader>
                        <CardContent>
                                    <p className="line-clamp-2" title={collection.description || "No description"}>{collection.description || "No description"}</p>
                        </CardContent>
                        <CardFooter>
                            <Avatar>
                                <AvatarImage src={collection.avatarUrl} />
                                <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                            <FaUser className="ml-auto" /> <span> {collection.members}</span>
                        </CardFooter>
                    </Card>
                </Link>
                    </div>
                ))}
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Collection</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this collection? This action cannot be undone.
                            All notes within this collection will also be deleted.
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