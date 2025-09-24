"use client";

import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { BsThreeDotsVertical } from "react-icons/bs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FaUser } from "react-icons/fa";

export default function WorkspaceCollections() {
    // const signOut = useSignOut();

    const collections = [
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
        <div className="flex flex-row flex-wrap gap-5 mt-10 items-start justify-start w-full h-screen p-5">
            {
                collections.map((workspace, key) => (
                    <Card key={key} className="w-[350px]">
                        <CardHeader >
                            <CardTitle>{workspace.title}</CardTitle>
                            <CardDescription>{workspace.createdAt}</CardDescription>
                            <CardAction><BsThreeDotsVertical /></CardAction>
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
                ))}
        </div>
        // </RequireAuth>
    );
}