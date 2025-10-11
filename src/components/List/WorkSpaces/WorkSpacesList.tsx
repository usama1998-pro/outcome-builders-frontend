"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserWorkspaces } from "@/src/hooks/useWorkspace";
import { WorkSpaceList } from "@/src/types/workspaces";
import { formatDateTime } from "@/src/utils/dateTimeFormat";
import Link from "next/link";
import { useEffect } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaUser } from "react-icons/fa";
import BlocksLoader from "../../Loaders/BlocksLoader/BlocksLoader";

export default function WorkSpacesList({ workspaces }: { workspaces: Array<WorkSpaceList> }) {
    const { data: workspaceData, isLoading, isError, error } = useUserWorkspaces()

    useEffect(() => {
        console.log(workspaceData);
    }, [workspaceData])

    // if (isLoading) return <BlocksLoader />;

    if (isError) return <p>Error: {error?.message}</p>;

    return (

        <div className="w-full h-full flex flex-row flex-wrap gap-5 items-center justify-center p-5">

            {
                isLoading && <BlocksLoader />
            }

            {
                isError && (<Card className="w-[300px] h-[200px] flex flex-col border border-red-500 text-red-800 shadow-md">
                    <CardHeader className="border-b border-red-800">
                        <CardTitle className="text-lg font-semibold text-red-700">Error</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex items-center justify-center">
                        <p>{error?.message || "Something went wrong."}</p>
                    </CardContent>
                </Card>)
            }

            {
                workspaceData && workspaceData.map((workspace, key) => (
                    <Link href={`/dashboard/workspaces/${workspace.id}/collections`} key={key} className="no-underline">
                        <Card key={key} className="w-[300px] h-[200px] flex flex-col justify-between">
                            <CardHeader >
                                <CardTitle>{workspace.title}</CardTitle>
                                <CardDescription>{formatDateTime(workspace.createdAt)}</CardDescription>
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
                    </Link>
                )

                )

            }
        </div>
    );
}