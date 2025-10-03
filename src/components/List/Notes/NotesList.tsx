import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Card,
    CardAction,
    //    CardContent, 
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import Collections from "@/src/types/collections";
import Link from "next/link";
import { BsThreeDotsVertical } from "react-icons/bs";
// import { FaUser } from "react-icons/fa";


type NotesListProps = {
    notes: Array<Collections>;
    collection: { id: number };
    workspace: { id: number };
};

export function NotesList({ workspace, collection, notes }: NotesListProps) {
    return (<div className="w-full h-full flex flex-row flex-wrap gap-5 items-center justify-center p-5">
        {
            notes.map((note, key) => (
                <Link href={`/dashboard/workspace/${workspace.id}/collection/${collection.id}`} key={key} className="no-underline">
                    <Card key={key} className="w-[300px] h-[200px] flex flex-col justify-between">
                        <CardHeader >
                            <CardTitle>{note.title}</CardTitle>
                            <CardDescription>{note.createdAt}</CardDescription>
                            <CardAction><BsThreeDotsVertical /></CardAction>
                        </CardHeader>
                        {/* <CardContent>
                            <p>{note.description}</p>
                        </CardContent> */}
                        <CardFooter>
                            <Avatar>
                                <AvatarImage src={note.createdBy} />
                                <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                            {/* <FaUser className="ml-auto" /> <span> {note.members}</span> */}

                        </CardFooter>
                    </Card>
                </Link>
            )

            )

        }
    </div>
    );
}