import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Collections from "@/src/types/collections";
import Link from "next/link";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaUser } from "react-icons/fa";


type CollectionListProps = {
    collections: Array<Collections>;
    workspace: { id: number };
};

export function CollectionList({ collections, workspace }: CollectionListProps) {
    return (<div className="w-full h-full flex flex-row flex-wrap gap-5 items-center justify-center p-5">
        {
            collections.map((collection, key) => (
                <Link href={`/dashboard/workspaces/${workspace.id}/collections/${collection.id}/notes`} key={key} className="no-underline">
                    <Card key={key} className="w-[300px] h-[200px] flex flex-col justify-between">
                        <CardHeader >
                            <CardTitle>{collection.title}</CardTitle>
                            <CardDescription>{collection.createdAt}</CardDescription>
                            <CardAction><BsThreeDotsVertical /></CardAction>
                        </CardHeader>
                        <CardContent>
                            <p>{collection.description}</p>
                        </CardContent>
                        <CardFooter>
                            <Avatar>
                                <AvatarImage src={collection.avatarUrl} />
                                <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                            <FaUser className="ml-auto" /> <span> {collection.members}</span>

                        </CardFooter>
                    </Card>
                </Link>
            )

            )

        }
    </div>
    );
}