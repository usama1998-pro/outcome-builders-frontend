"use client";


import { Button } from "@/components/ui/button";
import { NotesList } from "@/src/components/List/Notes/NotesList";
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
import { useCollectionNotes } from "@/src/hooks/useNotes";
export default function NotesPage() {
    const params = useParams();
    const workspaceId = Array.isArray(params.workspaceId) ? params.workspaceId[0] : params.workspaceId; // workspace id from URL
    const collectionId = Array.isArray(params.collectionId) ? params.collectionId[0] : params.collectionId;

    const { data: notes, isLoading, isError, error, refetch } = useCollectionNotes(Number(collectionId));



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
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href={`/dashboard/workspaces/${workspaceId}/collections/${collectionId}/notes`}>Notes</BreadcrumbLink>
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
                        <Button>
                            <FaPlus className="mr-2" /> New Note
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
            <NotesList notes={notes} collection={{ id: Number(collectionId) }} workspace={{ id: Number(workspaceId) }} />
        </div>
    );
}


// const notes = [
//     {
//         id: 1,
//         title: "Notes 1",
//         createdAt: "24 Sep, 2025 at 10:05 PM",
//         createdBy: "usama",
//         description: "This is Notes 1",
//         members: 10,
//         avatarUrl: "https://github.com/shadcn.png",
//         workspaceId: Number(workspaceId),
//         workspaceName: "Workspace"
//     },
//     {
//         id: 2,
//         title: "Notes 2",
//         createdAt: "24 Sep, 2025 at 10:05 PM",
//         createdBy: "usama",
//         description: "This is Notes 2",
//         members: 12,
//         avatarUrl: "https://github.com/shadcn.png",
//         workspaceId: Number(workspaceId),
//         workspaceName: "Workspace"
//     },
//     {
//         id: 3,
//         title: "Notes 3",
//         createdAt: "24 Sep, 2025 at 10:05 PM",
//         createdBy: "usama",
//         description: "This is Notes 3",
//         members: 13,
//         avatarUrl: "https://github.com/shadcn.png",
//         workspaceId: Number(workspaceId),
//         workspaceName: "Workspace"
//     },
//     {
//         id: 4,
//         title: "Notes 4",
//         createdAt: "24 Sep, 2025 at 10:05 PM",
//         createdBy: "usama",
//         description: "This is Notes 4",
//         members: 14,
//         avatarUrl: "https://github.com/shadcn.png",
//         workspaceId: Number(workspaceId),
//         workspaceName: "Workspace"
//     },
//     {
//         id: 5,
//         title: "Notes 5",
//         createdAt: "24 Sep, 2025 at 10:05 PM",
//         createdBy: "usama",
//         description: "This is Notes 5",
//         members: 5,
//         avatarUrl: "https://github.com/shadcn.png",
//         workspaceId: Number(workspaceId),
//         workspaceName: "Workspace"
//     },
//     {
//         id: 6,
//         title: "Notes 6",
//         createdAt: "24 Sep, 2025 at 10:05 PM",
//         createdBy: "usama",
//         description: "This is Notes 6",
//         members: 3,
//         avatarUrl: "https://github.com/shadcn.png",
//         workspaceId: Number(workspaceId),
//         workspaceName: "Workspace"
//     },
//     {
//         id: 7,
//         title: "Notes 7",
//         createdAt: "24 Sep, 2025 at 10:05 PM",
//         createdBy: "usama",
//         description: "This is Notes 7",
//         members: 4,
//         avatarUrl: "https://github.com/shadcn.png",
//         workspaceId: Number(workspaceId),
//         workspaceName: "Workspace"
//     },
//     {
//         id: 8,
//         title: "Notes 8",
//         createdAt: "24 Sep, 2025 at 10:05 PM",
//         createdBy: "usama",
//         description: "This is Notes 8",
//         members: 6,
//         avatarUrl: "https://github.com/shadcn.png",
//         workspaceId: Number(workspaceId),
//         workspaceName: "Workspace"
//     }
// ];
