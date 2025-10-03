// "use client";

import WorkSpacesList from "@/src/components/List/WorkSpaces/WorkSpacesList";
import { Button } from "@/components/ui/button";
// import ShinyText from '@/components/ShinyText;
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
import { FaPlus } from "react-icons/fa";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    // BreadcrumbPage,
    // BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
// import styles from "./page.module.css";
// import RequireAuth from "../../components/auth/requireAuth";
// import { useSignOut } from "../../hooks/useAuth";

export default function DashboardWorkspace() {
    // const signOut = useSignOut();

    const workspaces = [
        {
            id: 11,
            title: "Workspace 11",
            createdAt: "24 Sep, 2025 at 10:05 PM",
            createdBy: "usama",
            description: "This is workspace 1",
            members: 1,
            avatarUrl: "https://github.com/shadcn.png"
        },
        {
            id: 1,
            title: "Workspace 1",
            createdAt: "24 Sep, 2025 at 10:05 PM",
            createdBy: "usama",
            description: "This is workspace 1",
            members: 10,
            avatarUrl: "https://github.com/shadcn.png"
        },
        {
            id: 2,
            title: "Workspace 2",
            createdAt: "24 Sep, 2025 at 10:05 PM",
            createdBy: "usama",
            description: "This is workspace 2",
            members: 12,
            avatarUrl: "https://github.com/shadcn.png"
        },
        {
            id: 3,
            title: "Workspace 3",
            createdAt: "24 Sep, 2025 at 10:05 PM",
            createdBy: "usama",
            description: "This is workspace 3",
            members: 13,
            avatarUrl: "https://github.com/shadcn.png"
        },
        {
            id: 4,
            title: "Workspace 4",
            createdAt: "24 Sep, 2025 at 10:05 PM",
            createdBy: "usama",
            description: "This is workspace 4",
            members: 14,
            avatarUrl: "https://github.com/shadcn.png"
        },
        {
            id: 5,
            title: "Workspace 5",
            createdAt: "24 Sep, 2025 at 10:05 PM",
            createdBy: "usama",
            description: "This is workspace 5",
            members: 5,
            avatarUrl: "https://github.com/shadcn.png"
        },
        {
            id: 6,
            title: "Workspace 6",
            createdAt: "24 Sep, 2025 at 10:05 PM",
            createdBy: "usama",
            description: "This is workspace 6",
            members: 3,
            avatarUrl: "https://github.com/shadcn.png"
        },
        {
            id: 7,
            title: "Workspace 7",
            createdAt: "24 Sep, 2025 at 10:05 PM",
            createdBy: "usama",
            description: "This is workspace 7",
            members: 4,
            avatarUrl: "https://github.com/shadcn.png"
        },
        {
            id: 8,
            title: "Workspace 8",
            createdAt: "24 Sep, 2025 at 10:05 PM",
            createdBy: "usama",
            description: "This is workspace 8",
            members: 6,
            avatarUrl: "https://github.com/shadcn.png"
        }
    ];

    return (
        // <RequireAuth>
        <div className="flex flex-col items-center justify-center p-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard/workspaces">Workspaces</BreadcrumbLink>
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
                            <FaPlus className="mr-2" /> New Workspace
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
            <WorkSpacesList workspaces={workspaces} />
        </div>

        // </RequireAuth>
    );
}