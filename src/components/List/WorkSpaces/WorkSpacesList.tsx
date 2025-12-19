"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserWorkspaces, useDeleteUserWorkspace } from "@/src/hooks/useWorkspace";
import { formatDateTime } from "@/src/utils/dateTimeFormat";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaUser, FaTrash } from "react-icons/fa";
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

interface WorkSpacesListProps {
    filter: WorkspaceFilter;
    currentTenantId: number | null;
    searchQuery: string;
}

export default function WorkSpacesList({ filter, currentTenantId, searchQuery }: WorkSpacesListProps) {
    const { data: workspaceData, isLoading, isError, error } = useUserWorkspaces();
    const { mutate: deleteWorkspace, isPending: isDeleting } = useDeleteUserWorkspace();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [workspaceToDelete, setWorkspaceToDelete] = useState<number | null>(null);

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

    useEffect(() => {
        console.log(workspaceData);
    }, [workspaceData]);

    const handleDeleteClick = (workspaceId: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setWorkspaceToDelete(workspaceId);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (workspaceToDelete) {
            deleteWorkspace(workspaceToDelete, {
                onSuccess: (res) => {
                    if (res?.status) {
                        toast.success(res.message || "Workspace deleted successfully!");
                        setDeleteDialogOpen(false);
                        setWorkspaceToDelete(null);
                    } else {
                        toast.error(res?.message || "Could not delete workspace.");
                    }
                },
                onError: (err: any) => {
                    toast.error(err?.response?.data?.detail || "Failed to delete workspace.");
                },
            });
        }
    };

    return (
        <>
            <div className="w-full h-full flex flex-row flex-wrap gap-5 items-center justify-center p-5">
                {isLoading && <BlocksLoader />}

                {isError && (
                    <Card className="w-[300px] h-[200px] flex flex-col border border-red-500 text-red-800 shadow-md">
                        <CardHeader className="border-b border-red-800">
                            <CardTitle className="text-lg font-semibold text-red-700">Error</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex items-center justify-center">
                            <p>{error?.message || "Something went wrong."}</p>
                        </CardContent>
                    </Card>
                )}

                {filteredWorkspaces.length === 0 && !isLoading && !isError && (
                    <Card className="w-[300px] h-[200px] flex flex-col border border-muted shadow-md">
                        <CardHeader className="border-b border-muted">
                            <CardTitle className="text-lg font-semibold text-muted-foreground">No Workspaces</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex items-center justify-center">
                            <p className="text-muted-foreground text-center">
                                {searchQuery.trim() 
                                    ? `No workspaces found matching "${searchQuery}".`
                                    : "No workspaces found for this filter."}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {filteredWorkspaces.map((workspace, key) => (
                    <div key={key} className="relative">
                        <Link href={`/dashboard/workspaces/${workspace.id}/collections`} className="no-underline">
                            <Card className="w-[300px] h-[220px] flex flex-col justify-between">
                                <CardHeader>
                                    <div className="flex items-center justify-between gap-2">
                                        <CardTitle className="truncate max-w-[150px]" title={workspace.title}>
                                            {workspace.title}
                                        </CardTitle>
                                        <Badge variant="outline" className="text-xs shrink-0 truncate max-w-[100px]" title={workspace.tenant?.company_name || "Unknown"}>
                                            {workspace.tenant?.company_name || "Unknown"}
                                        </Badge>
                                    </div>
                                    <CardDescription>{formatDateTime(workspace.createdAt)}</CardDescription>
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
                                                    onClick={(e) => handleDeleteClick(workspace.id, e)}
                                                    className="text-red-600 focus:text-red-600 cursor-pointer"
                                                >
                                                    <FaTrash className="mr-2" />
                                                    Delete Workspace
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </CardAction>
                                </CardHeader>
                                <CardContent>
                                    <p className="line-clamp-2" title={workspace.description}>{workspace.description}</p>
                                </CardContent>
                                <CardFooter>
                                    <Avatar>
                                        <AvatarImage src={workspace.avatarUrl} />
                                        <AvatarFallback>CN</AvatarFallback>
                                    </Avatar>
                                    <FaUser className="ml-auto" /> <span> {workspace.members}</span>
                                </CardFooter>
                            </Card>
                        </Link>
                    </div>
                ))}
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this workspace? This action cannot be undone.
                            All collections and notes within this workspace will also be deleted.
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