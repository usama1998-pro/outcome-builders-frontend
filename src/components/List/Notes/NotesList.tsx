"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Card,
    CardAction,
    CardContent, 
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import Notes from "@/src/types/notes";
import Link from "next/link";
import { BsThreeDotsVertical } from "react-icons/bs";
import { formatDateTime } from "@/src/utils/dateTimeFormat";
import { FaTrash, FaPaperclip, FaEdit, FaEye, FaBrain } from "react-icons/fa";
import { useState, useMemo } from "react";
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
import { useDeleteNote, useToggleTrainNote } from "@/src/hooks/useNotes";
// import { FaUser } from "react-icons/fa";


type NotesListProps = {
    notes?: Array<Notes>;
    collection: { id: number };
    workspace: { id: number };
    searchQuery?: string;
};

export function NotesList({ workspace, collection, notes, searchQuery = "" }: NotesListProps) {
    const { mutate: deleteNote, isPending: isDeleting } = useDeleteNote();
    const { mutate: toggleTrain } = useToggleTrainNote();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState<number | null>(null);

    // Filter notes based on search query
    const filteredNotes = useMemo(() => {
        if (!notes || !searchQuery.trim()) return notes || [];
        
        const query = searchQuery.toLowerCase().trim();
        return notes.filter(note => 
            note.title.toLowerCase().includes(query) ||
            note.createdBy?.toLowerCase().includes(query)
        );
    }, [notes, searchQuery]);

    const handleDeleteClick = (noteId: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setNoteToDelete(noteId);
        setDeleteDialogOpen(true);
    };

    const handleTrainClick = (noteId: number, isTrained: boolean, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleTrain(noteId, {
            onSuccess: (res) => {
                if (res?.status) {
                    toast.success(res.data.message);
                } else {
                    toast.error("Could not update training status.");
                }
            },
            onError: (err: unknown) => {
                const error = err as { message?: string };
                toast.error(error?.message || "Request failed, please try again.");
            },
        });
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
                {filteredNotes.length === 0 && searchQuery.trim() && (
                    <Card className="w-[300px] h-[200px] flex flex-col border border-muted shadow-md">
                        <CardHeader className="border-b border-muted">
                            <CardTitle className="text-lg font-semibold text-muted-foreground">No Results</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex items-center justify-center">
                            <p className="text-muted-foreground text-center">
                                No notes found matching &quot;{searchQuery}&quot;.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {
                    filteredNotes.map((note, key) => (
                        <div key={key} className="relative">
                            <Link href={`/dashboard/workspaces/${workspace.id}/collections/${collection.id}/notes/${note.id}`} className="no-underline">
                                <Card className="w-[300px] h-[200px] flex flex-col justify-between">
                                    <CardHeader>
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="truncate max-w-[180px]" title={note.title}>{note.title}</CardTitle>
                                            {note.hasFile && (
                                                <span title={note.fileName || "Attachment"} className="text-blue-500">
                                                    <FaPaperclip size={14} />
                                                </span>
                                            )}
                                            {note.is_trained && (
                                                <span 
                                                    title="Trained" 
                                                    className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500"
                                                >
                                                    <FaBrain size={12} className="text-white" />
                                                </span>
                                            )}
                                        </div>
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
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            window.location.href = `/dashboard/workspaces/${workspace.id}/collections/${collection.id}/notes/${note.id}`;
                                                        }}
                                                        className="cursor-pointer"
                                                    >
                                                        <FaEye className="mr-2" />
                                                        View Note
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            window.location.href = `/dashboard/workspaces/${workspace.id}/collections/${collection.id}/notes/${note.id}?edit=true`;
                                                        }}
                                                        className="cursor-pointer"
                                                    >
                                                        <FaEdit className="mr-2" />
                                                        Edit Note
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={(e) => handleTrainClick(note.id, note.is_trained || false, e)}
                                                        className={`cursor-pointer ${note.is_trained ? "text-cyan-600 focus:text-cyan-600" : ""}`}
                                                    >
                                                        <FaBrain className="mr-2" />
                                                        {note.is_trained ? "Untrain Note" : "Train Note"}
                                                    </DropdownMenuItem>
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
                                    <CardFooter>
                                        <Avatar>
                                            <AvatarImage src={note.createdBy} />
                                            <AvatarFallback>CN</AvatarFallback>
                                        </Avatar>
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