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
import { FaTrash, FaEdit, FaEye, FaBrain } from "react-icons/fa";
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
import { useDeleteNote, useToggleTrainNote, useMoveNote } from "@/src/hooks/useNotes";
import { useUserCollections } from "@/src/hooks/useCollection";
import { Move } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";


type NotesListProps = {
    notes?: Array<Notes>;
    collection: { id: number; uuid?: string | null };
    workspace: { id: number; uuid?: string | null };
    searchQuery?: string;
};

export function NotesList({ workspace, collection, notes, searchQuery = "" }: NotesListProps) {
    const { mutate: deleteNote, isPending: isDeleting } = useDeleteNote();
    const { mutate: toggleTrain } = useToggleTrainNote();
    const { mutate: moveNote, isPending: isMoving } = useMoveNote();
    // Fetch all collections (no workspace filter) to show all available collections including private ones
    const { data: collections = [] } = useUserCollections(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [moveDialogOpen, setMoveDialogOpen] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState<number | null>(null);
    const [noteToMove, setNoteToMove] = useState<number | null>(null);
    const [selectedCollectionId, setSelectedCollectionId] = useState<number | "">("");

    // Memoize notes with owner info from API response
    const notesWithOwnerInfo = useMemo(() => {
        return (notes || []).map((note) => {
            // Get owner name from API (now included in response)
            const ownerName = note.owner_name || "Unknown";
            const initials = ownerName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2) || "U";
            return { ...note, ownerInfo: { name: ownerName, email: note.owner_email || "", initials } };
        });
    }, [notes]);

    // Filter notes based on search query
    const filteredNotes = useMemo(() => {
        if (!searchQuery.trim()) return notesWithOwnerInfo;

        const query = searchQuery.toLowerCase().trim();
        return notesWithOwnerInfo.filter(note =>
            note.title.toLowerCase().includes(query) ||
            note.ownerInfo.name.toLowerCase().includes(query)
        );
    }, [notesWithOwnerInfo, searchQuery]);

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

    const handleMoveClick = (noteId: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setNoteToMove(noteId);
        setSelectedCollectionId("");
        setMoveDialogOpen(true);
    };

    const confirmMove = () => {
        if (noteToMove && selectedCollectionId) {
            moveNote(
                {
                    noteId: noteToMove,
                    payload: { collection_id: Number(selectedCollectionId) },
                },
                {
                    onSuccess: (res) => {
                        if (res?.status) {
                            toast.success(res.message || "Article moved successfully!");
                            setMoveDialogOpen(false);
                            setNoteToMove(null);
                            setSelectedCollectionId("");
                            // Refresh the page to show updated notes
                            window.location.reload();
                        } else {
                            toast.error(res?.message || "Could not move note.");
                        }
                    },
                    onError: (err: unknown) => {
                        const error = err as { response?: { data?: { detail?: string } } };
                        toast.error(error?.response?.data?.detail || "Failed to move note.");
                    },
                }
            );
        }
    };

    // Filter out the current collection from available collections
    // Backend already filters collections to only show those visible to the user (including owner's private collections)
    // So we just need to exclude the current collection
    const availableCollections = collections.filter((col) => col.id !== collection.id);

    const confirmDelete = () => {
        if (noteToDelete) {
            deleteNote({ note_id: noteToDelete }, {
                onSuccess: (res) => {
                    if (res?.status) {
                        toast.success(res.message || "Article deleted successfully!");
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
                    filteredNotes.map((note, key) => {
                        return (
                            <div key={key} className="relative">
                                <Link href={`/dashboard/workspaces/${workspace.uuid ?? workspace.id}/collections/${collection.uuid ?? collection.id}/notes/${note.uuid ?? note.id}`} className="no-underline">
                                    {/* Gradient border wrapper for trained articles */}
                                    <div className={`rounded-xl transition-all duration-200 ${note.is_trained ? "p-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500" : ""}`}>
                                        <Card className={`w-[300px] h-[200px] flex flex-col justify-between border border-border hover:border-foreground/30 transition-colors duration-200 ${note.is_trained ? "rounded-[10px]" : ""}`}>
                                            <CardHeader>
                                                <div className="flex items-center gap-2">
                                                    <CardTitle className="truncate max-w-[180px]" title={note.title}>{note.title}</CardTitle>
                                                    {note.is_trained && (
                                                        <span
                                                            title="Trained"
                                                            className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 shadow-lg shadow-purple-500/30"
                                                        >
                                                            <FaBrain size={12} className="text-white" />
                                                        </span>
                                                    )}
                                                    {note.visibility && (
                                                        <span
                                                            title={note.visibility === "private" ? "Only Me" : note.visibility === "public" ? "All (Anyone can edit)" : "Collaborate"}
                                                            className={`text-xs px-2 py-0.5 rounded ${note.visibility === "private"
                                                                ? "bg-gray-500 text-white"
                                                                : note.visibility === "public"
                                                                    ? "bg-blue-500 text-white"
                                                                    : "bg-green-500 text-white"
                                                                }`}
                                                        >
                                                            {note.visibility === "private" ? "Only Me" : note.visibility === "public" ? "All" : "Collaborate"}
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
                                                                    window.location.href = `/dashboard/workspaces/${workspace.uuid ?? workspace.id}/collections/${collection.uuid ?? collection.id}/notes/${note.uuid ?? note.id}`;
                                                                }}
                                                                className="cursor-pointer"
                                                            >
                                                                <FaEye className="mr-2" />
                                                                View Article
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    window.location.href = `/dashboard/articles/new?noteId=${note.id}&collection_id=${collection.id}`;
                                                                }}
                                                                className="cursor-pointer"
                                                            >
                                                                <FaEdit className="mr-2" />
                                                                Edit Article
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={(e) => handleTrainClick(note.id, note.is_trained || false, e)}
                                                                className={`cursor-pointer ${note.is_trained ? "text-cyan-600 focus:text-cyan-600" : ""}`}
                                                            >
                                                                <FaBrain className="mr-2" />
                                                                {note.is_trained ? "Untrain Article" : "Train Article"}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={(e) => handleMoveClick(note.id, e)}
                                                                className="cursor-pointer"
                                                            >
                                                                <Move className="mr-2" />
                                                                Move to Collection
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={(e) => handleDeleteClick(note.id, e)}
                                                                className="text-red-600 focus:text-red-600 cursor-pointer"
                                                            >
                                                                <FaTrash className="mr-2" />
                                                                Delete Article
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </CardAction>
                                            </CardHeader>
                                            <CardFooter>
                                                <TooltipProvider delayDuration={300}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="flex items-center gap-2.5 cursor-pointer pointer-events-auto">
                                                                <Avatar className="h-8 w-8 border-2 border-background shadow-md">
                                                                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-xs font-semibold">
                                                                        {note.ownerInfo.initials}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-medium text-foreground truncate max-w-[180px]">
                                                                        {note.ownerInfo.name}
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground">Owner</span>
                                                                </div>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top" className="z-[100] bg-popover text-popover-foreground border border-border">
                                                            <p className="font-medium text-popover-foreground">{note.ownerInfo.name}</p>
                                                            {note.ownerInfo.email && <p className="text-xs text-muted-foreground">{note.ownerInfo.email}</p>}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </CardFooter>
                                        </Card>
                                    </div>
                                </Link>
                            </div>
                        );
                    })
                }
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Article</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this article? This action cannot be undone.
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

            <AlertDialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Move className="w-5 h-5 text-teal-500" />
                            Move Article to Collection
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Select a collection to move this article to. This action will move the article from the current collection to the selected one.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <label className="text-sm font-medium mb-2 block">
                            Select Collection
                        </label>
                        {availableCollections.length > 0 ? (
                            <select
                                value={selectedCollectionId}
                                onChange={(e) => setSelectedCollectionId(e.target.value === "" ? "" : Number(e.target.value))}
                                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500"
                                disabled={isMoving}
                            >
                                <option value="">-- Select a collection --</option>
                                {availableCollections.map((col) => (
                                    <option key={col.id} value={col.id}>
                                        {col.title} {col.workspaceName ? `(${col.workspaceName})` : ""}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <p className="text-sm text-muted-foreground mt-2">
                                No other collections available to move to.
                            </p>
                        )}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isMoving}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmMove}
                            disabled={!selectedCollectionId || isMoving}
                            className="bg-teal-500 hover:bg-teal-600"
                        >
                            {isMoving ? "Moving..." : "Move Article"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}