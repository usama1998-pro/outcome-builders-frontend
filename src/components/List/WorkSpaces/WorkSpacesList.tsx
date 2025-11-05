"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserWorkspaces, useDeleteUserWorkspace } from "@/src/hooks/useWorkspace";
import { formatDateTime } from "@/src/utils/dateTimeFormat";
import Link from "next/link";
import { useEffect, useState } from "react";
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

export default function WorkSpacesList() {
    const { data: workspaceData, isLoading, isError, error } = useUserWorkspaces();
    const { mutate: deleteWorkspace, isPending: isDeleting } = useDeleteUserWorkspace();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [workspaceToDelete, setWorkspaceToDelete] = useState<number | null>(null);

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

                {workspaceData && workspaceData.map((workspace, key) => (
                    <div key={key} className="relative">
                        <Link href={`/dashboard/workspaces/${workspace.id}/collections`} className="no-underline">
                            <Card className="w-[300px] h-[200px] flex flex-col justify-between">
                                <CardHeader>
                                    <CardTitle>{workspace.title}</CardTitle>
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
                                    <p>{workspace.description}</p>
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