"use client";

import { Badge } from "@/components/ui/badge";
import Collections from "@/src/types/collections";
import { formatDateTime } from "@/src/utils/dateTimeFormat";
import Link from "next/link";
import { useState, useMemo } from "react";
import { Layers, FileText, MoreVertical, Trash2, ChevronRight, Clock, Eye, Lock, Globe, Users, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const ITEMS_PER_PAGE = 6;

export function CollectionList({ collections, workspace, onDelete, searchQuery = "" }: CollectionListProps) {
    const { mutate: deleteCollection, isPending: isDeleting } = useDeleteUserCollection();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [collectionToDelete, setCollectionToDelete] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

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

    // Get visibility icon and color
    const getVisibilityConfig = (visibility?: string) => {
        switch (visibility) {
            case "public":
                return { icon: Globe, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Public" };
            case "shared":
                return { icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", label: "Shared" };
            default:
                return { icon: Lock, color: "text-amber-500", bg: "bg-amber-500/10", label: "Private" };
        }
    };

    // Color accents for collection cards - using teal/cyan scheme
    const accents = [
        { border: "hover:border-teal-500/50", icon: "from-teal-500 to-cyan-500", glow: "hover:shadow-teal-500/10" },
        { border: "hover:border-cyan-500/50", icon: "from-cyan-500 to-blue-500", glow: "hover:shadow-cyan-500/10" },
        { border: "hover:border-emerald-500/50", icon: "from-emerald-500 to-teal-500", glow: "hover:shadow-emerald-500/10" },
        { border: "hover:border-sky-500/50", icon: "from-sky-500 to-indigo-500", glow: "hover:shadow-sky-500/10" },
    ];

    const getAccent = (index: number) => accents[index % accents.length];

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
            <div className="w-full p-6">
                {/* Empty search results */}
                {filteredCollections.length === 0 && searchQuery.trim() && (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                            <Layers className="w-8 h-8 text-muted-foreground" />
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
                                    href={`/dashboard/workspaces/${workspace.id}/collections/${collection.id}/notes`}
                                    className="group block"
                                >
                                    <div className={`relative bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg ${accent.glow} ${accent.border}`}>
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
                                                            <h3 className="font-semibold text-lg text-foreground truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" title={collection.title}>
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
                                                        {/* Menu */}
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
                                                                    onClick={(e) => handleDeleteClick(collection.id, e)}
                                                                    className="text-red-600 focus:text-red-600 cursor-pointer"
                                                                >
                                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                                    Delete Collection
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>

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
                                                        <Eye className="w-4 h-4" />
                                                        <span>{collection.members} notes</span>
                                                    </div>
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