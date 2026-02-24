"use client";

import { Badge } from "@/components/ui/badge";
import { useUserWorkspaces, useDeleteUserWorkspace } from "@/src/hooks/useWorkspace";
import { useUserCollections } from "@/src/hooks/useCollection";
import { formatDateTime } from "@/src/utils/dateTimeFormat";
import Link from "next/link";
import { useState, useMemo } from "react";
import { Brain, Users, Calendar, MoreVertical, Trash2, ArrowRight, Building2, Sparkles, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import BlocksLoader from "../../Loaders/BlocksLoader/BlocksLoader";
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
import { WorkspaceFilter } from "@/src/app/dashboard/workspaces/page";
import { Button } from "@/components/ui/button";

interface WorkSpacesListProps {
    filter: WorkspaceFilter;
    currentTenantId: number | null;
    searchQuery: string;
    onCreateClick?: () => void;
    canCreate?: boolean;
    onClearSearch?: () => void;
}

const ITEMS_PER_PAGE = 8;

export default function WorkSpacesList({ filter, currentTenantId, searchQuery, onCreateClick, canCreate, onClearSearch }: WorkSpacesListProps) {
    const { data: workspaceData, isLoading, isError, error } = useUserWorkspaces();
    const { data: collections } = useUserCollections();
    const { mutate: deleteWorkspace, isPending: isDeleting } = useDeleteUserWorkspace();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [workspaceToDelete, setWorkspaceToDelete] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Filter workspaces based on selection and search query
    const filteredWorkspaces = useMemo(() => {
        if (!workspaceData) return [];
        
        let result = workspaceData;
        
        // Apply filter
        switch (filter) {
            case "all":
                break;
            case "my":
                // Show workspaces from current tenant
                result = result.filter(ws => ws.tenantId === currentTenantId);
                break;
            default:
                // Filter is a tenant ID number
                result = result.filter(ws => ws.tenantId === filter);
        }
        
        // Apply search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(ws => 
                ws.title.toLowerCase().includes(query) ||
                ws.description?.toLowerCase().includes(query) ||
                ws.tenant?.company_name?.toLowerCase().includes(query)
            );
        }
        
        return result;
    }, [workspaceData, filter, currentTenantId, searchQuery]);

    // Pagination logic
    const totalPages = Math.ceil(filteredWorkspaces.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedWorkspaces = filteredWorkspaces.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useMemo(() => {
        setCurrentPage(1);
    }, [filter, searchQuery]);

    // Color gradients for workspace cards
    const gradients = [
        "from-violet-500 to-purple-600",
        "from-blue-500 to-cyan-500",
        "from-emerald-500 to-teal-500",
        "from-orange-500 to-amber-500",
        "from-pink-500 to-rose-500",
        "from-indigo-500 to-blue-500",
    ];

    const getGradient = (index: number) => gradients[index % gradients.length];

    const handleDeleteClick = (workspaceId: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Check if workspace has collections
        const workspaceCollections = collections?.filter(c => c.workspaceId === workspaceId) || [];
        if (workspaceCollections.length > 0) {
            toast.error(`Cannot delete brainspace. It contains ${workspaceCollections.length} collection(s). Please delete all collections first.`);
            return;
        }
        
        setWorkspaceToDelete(workspaceId);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (workspaceToDelete) {
            deleteWorkspace(workspaceToDelete, {
                onSuccess: (res) => {
                    if (res?.status) {
                        toast.success(res.message || "Brainspace deleted successfully!");
                        setDeleteDialogOpen(false);
                        setWorkspaceToDelete(null);
                    } else {
                        toast.error(res?.message || "Could not delete brainspace.");
                    }
                },
                onError: (err: any) => {
                    toast.error(err?.response?.data?.detail || "Failed to delete brainspace.");
                },
            });
        }
    };

    return (
        <>
            <div className="w-full p-6">
                {isLoading && (
                    <div className="flex items-center justify-center py-20">
                        <BlocksLoader />
                    </div>
                )}

                {isError && (
                    <div className="flex items-center justify-center py-20">
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 max-w-md text-center">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Something went wrong</h3>
                            <p className="text-red-600 dark:text-red-300 text-sm">{error?.message || "Failed to load brainspaces."}</p>
                        </div>
                    </div>
                )}

                {filteredWorkspaces.length === 0 && !isLoading && !isError && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="relative mb-8">
                            {/* Animated background gradient */}
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-fuchsia-500/20 rounded-full blur-3xl animate-pulse"></div>
                            
                            {/* Main icon container */}
                            <div className="relative w-24 h-24 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center border border-violet-500/20 dark:border-violet-500/30 shadow-lg animate-pulse">
                                <Brain className="w-12 h-12 text-violet-500 dark:text-violet-400" />
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
                        
                        <h3 className="text-2xl font-bold text-foreground mb-3">
                            {searchQuery.trim() ? "No Brainspaces Found" : "No Brainspaces Yet"}
                        </h3>
                        
                        <p className="text-muted-foreground text-center max-w-md mb-8 text-base leading-relaxed">
                            {searchQuery.trim() 
                                ? `We couldn't find any brainspaces matching "${searchQuery}". Try adjusting your search terms or create a new brainspace.`
                                : "Start organizing your knowledge by creating your first brainspace. Group related collections and collaborate with your team."}
                        </p>

                        {!searchQuery.trim() && canCreate && onCreateClick && (
                            <Button
                                onClick={onCreateClick}
                                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Your First Brainspace
                            </Button>
                        )}

                        {searchQuery.trim() && onClearSearch && (
                            <Button
                                onClick={onClearSearch}
                                variant="outline"
                                className="border-violet-500/50 hover:bg-violet-500/10 hover:border-violet-500 transition-all"
                            >
                                Clear Search
                            </Button>
                        )}
                    </div>
                )}

                {/* Workspace Grid */}
                {filteredWorkspaces.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {paginatedWorkspaces.map((workspace, index) => (
                            <Link 
                                key={workspace.id} 
                                href={`/dashboard/workspaces/${workspace.uuid ?? workspace.id}/collections`}
                                className="group block"
                            >
                                <div className="relative bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/10 hover:border-violet-500/30 hover:-translate-y-1">
                                    {/* Gradient Header */}
                                    <div className={`h-24 bg-gradient-to-br ${getGradient(index)} relative overflow-hidden`}>
                                        {/* Pattern overlay */}
                                        <div className="absolute inset-0 opacity-20">
                                            <div className="absolute top-2 right-2 w-20 h-20 border border-white/30 rounded-full" />
                                            <div className="absolute bottom-2 left-2 w-12 h-12 border border-white/20 rounded-full" />
                                        </div>
                                        
                                        {/* Brain icon */}
                                        <div className="absolute top-4 left-4">
                                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                                <Brain className="w-6 h-6 text-white" />
                                            </div>
                                        </div>

                                        {/* Menu button */}
                                        <div className="absolute top-4 right-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                    }}
                                                    className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-white hover:bg-white/30 transition-colors focus:outline-none"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={(e) => handleDeleteClick(workspace.id, e)}
                                                        className="text-red-600 focus:text-red-600 cursor-pointer"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Delete Brainspace
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5">
                                        {/* Title & Organization */}
                                        <div className="mb-3">
                                            <h3 className="font-semibold text-lg text-foreground truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors" title={workspace.title}>
                                                {workspace.title}
                                            </h3>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground truncate" title={workspace.tenant?.company_name}>
                                                    {workspace.tenant?.company_name || "Unknown Organization"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[40px]" title={workspace.description}>
                                            {workspace.description || "No description provided"}
                                        </p>

                                        {/* Footer Stats */}
                                        <div className="flex items-center justify-between pt-3 border-t border-border">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <Users className="w-4 h-4" />
                                                    <span className="text-sm">{workspace.members}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <Calendar className="w-4 h-4" />
                                                    <span className="text-sm">{formatDateTime(workspace.createdAt)}</span>
                                                </div>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination Controls */}
                {filteredWorkspaces.length > ITEMS_PER_PAGE && (
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
                                    className={`w-9 h-9 p-0 ${currentPage === page ? "bg-violet-500 hover:bg-violet-600" : ""}`}
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
                {filteredWorkspaces.length > 0 && (
                    <div className="text-center text-sm text-muted-foreground mt-4">
                        Showing {startIndex + 1}-{Math.min(endIndex, filteredWorkspaces.length)} of {filteredWorkspaces.length} brainspaces
                    </div>
                )}
            </div>

            {/* Delete Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Trash2 className="w-5 h-5 text-red-500" />
                            Delete Brainspace
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this brainspace? This action cannot be undone.
                            All collections and notes within this brainspace will also be deleted.
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