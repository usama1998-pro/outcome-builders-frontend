"use client";

import { Button } from "@/components/ui/button";
import { CollectionList } from "@/src/components/List/Collection/CollectionList";
import { useParams } from "next/navigation";
import { FaPlus } from "react-icons/fa";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    // BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
export default function WorkspacePage() {
    const params = useParams();
    const workspaceId = Array.isArray(params.workspaceId) ? params.workspaceId[0] : params.workspaceId; // workspace id from URL

    const collections = [
        {
            id: 1,
            title: "Collection 1",
            createdAt: "24 Sep, 2025 at 10:05 PM",
            createdBy: "usama",
            description: "This is Collection 1",
            members: 10,
            avatarUrl: "https://github.com/shadcn.png"
        },
        {
            id: 2,
            title: "Collection 2",
            createdAt: "24 Sep, 2025 at 10:05 PM",
            createdBy: "usama",
            description: "This is Collection 2",
            members: 12,
            avatarUrl: "https://github.com/shadcn.png"
        },
        {
            id: 3,
            title: "Collection 3",
            createdAt: "24 Sep, 2025 at 10:05 PM",
            createdBy: "usama",
            description: "This is Collection 3",
            members: 13,
            avatarUrl: "https://github.com/shadcn.png"
        },
        {
            id: 4,
            title: "Collection 4",
            createdAt: "24 Sep, 2025 at 10:05 PM",
            createdBy: "usama",
            description: "This is Collection 4",
            members: 14,
            avatarUrl: "https://github.com/shadcn.png"
        },
        {
            id: 5,
            title: "Collection 5",
            createdAt: "24 Sep, 2025 at 10:05 PM",
            createdBy: "usama",
            description: "This is Collection 5",
            members: 5,
            avatarUrl: "https://github.com/shadcn.png"
        },
        {
            id: 6,
            title: "Collection 6",
            createdAt: "24 Sep, 2025 at 10:05 PM",
            createdBy: "usama",
            description: "This is Collection 6",
            members: 3,
            avatarUrl: "https://github.com/shadcn.png"
        },
        {
            id: 7,
            title: "Collection 7",
            createdAt: "24 Sep, 2025 at 10:05 PM",
            createdBy: "usama",
            description: "This is Collection 7",
            members: 4,
            avatarUrl: "https://github.com/shadcn.png"
        },
        {
            id: 8,
            title: "Collection 8",
            createdAt: "24 Sep, 2025 at 10:05 PM",
            createdBy: "usama",
            description: "This is Collection 8",
            members: 6,
            avatarUrl: "https://github.com/shadcn.png"
        }
    ];



    return (
        <div className="flex flex-col items-center justify-center p-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard/workspaces">Workspaces</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href={`/dashboard/workspaces/${workspaceId}/collections`}>Collections</BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <nav className="sticky top-0 w-[90%] mx-auto self-center px-15 flex justify-between items-center bg-background border-b border-border py-5">
                <input
                    type="text"
                    placeholder="Search..."
                    className="px-4 py-2 border rounded-md w-1/3"
                />

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button className="outline" >
                            <FaPlus className="mr-2" /> New Collection
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your
                                account and remove your data from our servers.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </nav>
            <CollectionList collections={collections} workspace={{ id: Number(workspaceId) }} />
        </div>
    );
}
