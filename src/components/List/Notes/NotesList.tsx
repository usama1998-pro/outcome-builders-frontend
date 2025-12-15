"use client";

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
import Notes from "@/src/types/notes";
import Link from "next/link";
import { BsThreeDotsVertical } from "react-icons/bs";
import { formatDateTime } from "@/src/utils/dateTimeFormat";
import { FaTrash } from "react-icons/fa";
import { useState } from "react";
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
import { useDeleteNote } from "@/src/hooks/useNotes";
// import { FaUser } from "react-icons/fa";


type NotesListProps = {
    notes?: Array<Notes>;
    collection: { id: number };
    workspace: { id: number };
};

export function NotesList({ workspace, collection, notes }: NotesListProps) {
    const { mutate: deleteNote, isPending: isDeleting } = useDeleteNote();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState<number | null>(null);

    const handleDeleteClick = (noteId: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setNoteToDelete(noteId);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (noteToDelete) {
            deleteNote({ note_id: noteToDelete }, {
                onSuccess: (res) => {
                    if (res?.status) {
                        toast.success(res.message || "Note deleted successfully!");
                        setDeleteDialogOpen(false);
                        setNoteToDelete(null);
                    } else {
                        toast.error(res?.message || "Could not delete note.");
                    }
                },
                onError: (err: unknown) => {
                    const error = err as { response?: { data?: { detail?: string } } };
                    toast.error(error?.response?.data?.detail || "Failed to delete note.");
                },
            });
        }
    };

    return (
        <>
            <div className="w-full h-full flex flex-row flex-wrap gap-5 items-center justify-center p-5">
                {
                    notes?.map((note, key) => (
                        <div key={key} className="relative">
                            <Link href={`/dashboard/workspace/${workspace.id}/collection/${collection.id}`} className="no-underline">
                                <Card className="w-[300px] h-[200px] flex flex-col justify-between">
                                    <CardHeader>
                                        <CardTitle>{note.title}</CardTitle>
                                        <CardDescription>{formatDateTime(note.createdAt)}</CardDescription>
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
                                                        onClick={(e) => handleDeleteClick(note.id, e)}
                                                        className="text-red-600 focus:text-red-600 cursor-pointer"
                                                    >
                                                        <FaTrash className="mr-2" />
                                                        Delete Note
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </CardAction>
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
                        </div>
                    ))
                }
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Note</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this note? This action cannot be undone.
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