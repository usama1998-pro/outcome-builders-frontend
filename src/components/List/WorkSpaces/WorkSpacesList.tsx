import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkSpaceList } from "@/src/types/workspaces";
import Link from "next/link";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaUser } from "react-icons/fa";

export default function WorkSpacesList({ workspaces }: { workspaces: Array<WorkSpaceList> }) {
    return (<div className="w-full h-full flex flex-row flex-wrap gap-5 items-center justify-center p-5">
        {
            workspaces.map((workspace, key) => (
                <Link href={`/dashboard/workspaces/${workspace.id}/collections`} key={key} className="no-underline">
                    <Card key={key} className="w-[300px] h-[200px] flex flex-col justify-between">
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
                </Link>
            )

            )

        }
    </div>
    );
}