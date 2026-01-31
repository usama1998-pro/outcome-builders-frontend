"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
} from "@/components/ui/breadcrumb";
import { useUserCollections } from "@/src/hooks/useCollection";
import { useQueries } from "@tanstack/react-query";
import api from "@/src/lib/axios";
import routes from "@/src/lib/routes";
import Notes from "@/src/types/notes";
import { useAuthStore } from "@/src/store/useAuth";
import BlocksLoader from "@/src/components/Loaders/BlocksLoader/BlocksLoader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RequireAuth from "@/src/components/auth/requireAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Card as NoteCard,
    CardAction,
    CardDescription,
    CardFooter,
    CardHeader as NoteCardHeader,
    CardTitle as NoteCardTitle
} from "@/components/ui/card";
import Notes from "@/src/types/notes";
import Link from "next/link";
import { BsThreeDotsVertical } from "react-icons/bs";
import { formatDateTime } from "@/src/utils/dateTimeFormat";
import { FaTrash, FaPaperclip, FaEdit, FaEye, FaBrain } from "react-icons/fa";
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
import { FileText } from "lucide-react";

interface NoteWithCollection extends Notes {
    collectionId: number;
    workspaceId: number;
    collectionName: string;
    workspaceName: string;
}

function AllNotesList({ notes }: { notes: NoteWithCollection[] }) {
    const { mutate: deleteNote, isPending: isDeleting } = useDeleteNote();
    const { mutate: toggleTrain } = useToggleTrainNote();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState<number | null>(null);

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
                {notes.map((note) => (
                    <div key={note.id} className="relative">
                        <Link 
                            href={`/dashboard/workspaces/${note.workspaceId}/collections/${note.collectionId}/notes/${note.id}`} 
                            className="no-underline"
                        >
                            <NoteCard className="w-[300px] h-[220px] flex flex-col justify-between">
                                <NoteCardHeader>
                                    <div className="flex items-center gap-2">
                                        <NoteCardTitle className="truncate max-w-[180px]" title={note.title}>
                                            {note.title}
                                        </NoteCardTitle>
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
                                    <CardDescription className="text-xs">
                                        {note.collectionName} • {note.workspaceName}
                                    </CardDescription>
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
                                                        window.location.href = `/dashboard/workspaces/${note.workspaceId}/collections/${note.collectionId}/notes/${note.id}`;
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
                                                        window.location.href = `/dashboard/workspaces/${note.workspaceId}/collections/${note.collectionId}/notes/${note.id}?edit=true`;
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
                                </NoteCardHeader>
                                <CardFooter>
                                    <Avatar>
                                        <AvatarImage src={note.createdBy} />
                                        <AvatarFallback>CN</AvatarFallback>
                                    </Avatar>
                                </CardFooter>
                            </NoteCard>
                        </Link>
                    </div>
                ))}
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

interface NotesApiResponse {
    status: boolean;
    message: string;
    data: {
        notes: Array<{
            id: number;
            title: string;
            content: string;
            collection_id: number;
            created_at: string | null;
            created_by: number;
            file_name: string | null;
            file_size: number | null;
            file_type: string | null;
            has_file: boolean;
            is_trained: boolean;
            is_pinned: boolean;
        }>;
    };
    pagination: number | null;
}

async function fetchCollectionNotes(collectionId: number): Promise<Notes[]> {
    const { data } = await api.get<NotesApiResponse>(routes.notes.get, {
        params: { collection_id: collectionId },
    });
    return data.data.notes.map((n) => ({
        id: n.id,
        title: n.title,
        createdAt: n.created_at ?? "",
        createdBy: String(n.created_by),
        fileName: n.file_name,
        fileSize: n.file_size,
        fileType: n.file_type,
        hasFile: n.has_file,
        is_trained: n.is_trained,
        is_pinned: n.is_pinned,
    }));
}

export default function AllNotesPage() {
    const { data: collections, isLoading: collectionsLoading } = useUserCollections();
    const [searchQuery, setSearchQuery] = useState("");
    const tenantId = useAuthStore((state) => state.tenantId);
    const hydrated = useAuthStore((state) => state.hydrated);

    // Fetch notes for all collections using useQueries
    const noteQueries = useQueries({
        queries: (collections || []).map((collection) => ({
            queryKey: ["collectionNotes", collection.id, tenantId],
            queryFn: () => fetchCollectionNotes(collection.id),
            enabled: !!collection.id && !!tenantId && hydrated && !!collections && collections.length > 0,
        })),
    });

    const isLoading = collectionsLoading || noteQueries.some(q => q.isLoading);
    const hasError = noteQueries.some(q => q.isError);

    // Combine all notes with collection and workspace info
    const allNotes: NoteWithCollection[] = useMemo(() => {
        if (!collections) return [];
        
        const notes: NoteWithCollection[] = [];
        noteQueries.forEach((query, index) => {
            if (query.data && collections[index]) {
                query.data.forEach((note) => {
                    const collection = collections[index];
                    notes.push({
                        ...note,
                        collectionId: collection.id,
                        workspaceId: collection.workspaceId,
                        collectionName: collection.title,
                        workspaceName: collection.workspaceName,
                    });
                });
            }
        });
        return notes;
    }, [collections, noteQueries]);

    // Filter notes based on search query
    const filteredNotes = useMemo(() => {
        if (!searchQuery.trim()) return allNotes;
        
        const query = searchQuery.toLowerCase().trim();
        return allNotes.filter(note => 
            note.title.toLowerCase().includes(query) ||
            note.collectionName.toLowerCase().includes(query) ||
            note.workspaceName.toLowerCase().includes(query) ||
            note.createdBy?.toLowerCase().includes(query)
        );
    }, [allNotes, searchQuery]);

    return (
        <RequireAuth>
            <div className="flex flex-col items-center justify-center p-6">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard/notes">
                                Notes
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <nav className="sticky top-0 w-[90%] mx-auto self-center px-15 flex justify-between items-center bg-background border-b border-border py-5">
                    <Input
                        type="text"
                        placeholder="Search notes..."
                        className="w-64"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </nav>

                {isLoading && (
                    <div className="w-full h-full flex items-center justify-center p-5">
                        <BlocksLoader />
                    </div>
                )}

                {hasError && (
                    <div className="w-full h-full flex items-center justify-center p-5">
                        <Card className="w-[300px] h-[200px] flex flex-col border border-red-500 text-red-800 shadow-md">
                            <CardHeader className="border-b border-red-800">
                                <CardTitle className="text-lg font-semibold text-red-700">Error</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 flex items-center justify-center">
                                <p>Something went wrong while loading notes.</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {filteredNotes.length > 0 && (
                    <AllNotesList notes={filteredNotes} />
                )}

                {filteredNotes.length === 0 && !isLoading && (
                    <div className="w-full flex items-center justify-center p-10 mt-10">
                        <div className="flex flex-col items-center text-center max-w-md">
                            <div className="relative mb-6">
                                <div className="w-24 h-24 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
                                    <FileText className="w-12 h-12 text-violet-500 dark:text-violet-400" />
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                                {searchQuery ? "No Notes Found" : "No Notes Yet"}
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                {searchQuery 
                                    ? `No notes found matching "${searchQuery}".`
                                    : "You don't have any notes yet. Create a collection and add notes to get started!"}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </RequireAuth>
    );
}

