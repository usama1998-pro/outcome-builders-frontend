"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { useUserCollections } from "@/src/hooks/useCollection";
import { useNotePermissions } from "@/src/hooks/useNotePermissions";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import api from "@/src/lib/axios";
import routes from "@/src/lib/routes";
import Notes from "@/src/types/notes";
import { useAuthStore } from "@/src/store/useAuth";
import { useBrainSpaceStore } from "@/src/store/useBrainSpace";
import BlocksLoader from "@/src/components/Loaders/BlocksLoader/BlocksLoader";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import RequireAuth from "@/src/components/auth/requireAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { BsThreeDotsVertical } from "react-icons/bs";
import { formatDateTime } from "@/src/utils/dateTimeFormat";
import { FaTrash, FaBrain } from "react-icons/fa";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useDeleteNote, useToggleTrainNote, useCreateNote, useMoveNote } from "@/src/hooks/useNotes";
import { useUserWorkspaces } from "@/src/hooks/useWorkspace";
import { FileText, Plus, Sparkles, BookOpen, RefreshCw, FolderKanban, Copy, Pencil, Loader2 } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";

interface NoteWithCollection extends Notes {
    collectionId: number;
    collectionUuid?: string | null;
    workspaceId: number;
    collectionName: string;
    workspaceName: string;
}


const createNoteSchema = z.object({
    title: z.string().min(1, "Title is required").max(200, "Title is too long"),
    content: z.string().min(1, "Content is required"),
    collection_id: z.string().min(1, "Please select a collection"),
});

type CreateNoteFormValues = z.infer<typeof createNoteSchema>;

function AllNotesList({ notes, searchQuery = "" }: { notes: NoteWithCollection[]; searchQuery?: string }) {
    const { mutate: deleteNote, isPending: isDeleting } = useDeleteNote();
    const { mutate: toggleTrain, isPending: isTraining } = useToggleTrainNote();
    const { mutate: moveNote, isPending: isMoving } = useMoveNote();
    const [trainingNoteId, setTrainingNoteId] = useState<number | null>(null);
    const { data: workspaces } = useUserWorkspaces();
    const getWorkspaceUuid = (id: number) => workspaces?.find((w) => w.id === id)?.uuid ?? id;
    // Fetch all collections (no workspace filter) to show all available collections including private ones
    const { data: collections = [] } = useUserCollections(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [moveDialogOpen, setMoveDialogOpen] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState<number | null>(null);
    const [noteToMove, setNoteToMove] = useState<NoteWithCollection | null>(null);
    const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");

    // Memoize notes with owner info from API response
    const notesWithOwnerInfo = useMemo(() => {
        return notes.map((note) => {
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

    const handleDeleteClick = (noteId: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setNoteToDelete(noteId);
        setDeleteDialogOpen(true);
    };

    const handleTrainClick = (noteId: number, isTrained: boolean, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setTrainingNoteId(noteId);
        toggleTrain(noteId, {
            onSuccess: (res) => {
                if (res?.status) {
                    toast.success(res.data.message);
                } else {
                    toast.error("Could not update training status.");
                }
                setTrainingNoteId(null);
            },
            onError: (err: unknown) => {
                const error = err as { message?: string };
                toast.error(error?.message || "Request failed, please try again.");
                setTrainingNoteId(null);
            },
        });
    };

    const handleMoveClick = (note: NoteWithCollection, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setNoteToMove(note);
        setSelectedCollectionId("");
        setMoveDialogOpen(true);
    };

    const confirmMove = () => {
        if (noteToMove && selectedCollectionId) {
            moveNote(
                {
                    noteId: noteToMove.id,
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

    // Filter out the current collection from available collections for the note being moved
    // Backend already filters collections to only show those visible to the user (including owner's private collections)
    // So we just need to exclude the current collection
    const availableCollections = noteToMove
        ? collections.filter((col) => col.id !== noteToMove.collectionId)
        : [];

    const confirmDelete = () => {
        if (noteToDelete) {
            deleteNote({ note_id: noteToDelete }, {
                onSuccess: (res) => {
                    if (res?.status) {
                        toast.success(res.message || "Article deleted successfully!");
                        setDeleteDialogOpen(false);
                        setNoteToDelete(null);
                    } else {
                        toast.error(res?.message || "Could not delete article.");
                    }
                },
                onError: (err: unknown) => {
                    const error = err as { response?: { data?: { detail?: string } } };
                    toast.error(error?.response?.data?.detail || "Failed to delete article.");
                },
            });
        }
    };

    // Filter notes based on search query (matching NotesList behavior)
    const filteredNotes = useMemo(() => {
        if (!searchQuery.trim()) return notesWithOwnerInfo;

        const query = searchQuery.toLowerCase().trim();
        return notesWithOwnerInfo.filter(note =>
            note.title.toLowerCase().includes(query) ||
            note.ownerInfo.name.toLowerCase().includes(query)
        );
    }, [notesWithOwnerInfo, searchQuery]);

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

                {filteredNotes.map((note) => {
                    return (
                        <div key={note.id} className="relative">
                            <Link
                                href={`/dashboard/workspaces/${getWorkspaceUuid(note.workspaceId)}/collections/${note.collectionUuid ?? note.collectionId}/notes/${note.uuid ?? note.id}`}
                                className="no-underline"
                            >
                                {/* Card wrapper with red border to match collection article styling */}
                                <div className="rounded-xl border border-[#DB2B30] bg-transparent transition-all duration-200 hover:border-[#FF3B3B]">
                                    <Card className="w-[300px] h-[200px] flex flex-col justify-between bg-card border-0">
                                        <CardHeader>
                                            <div className="flex items-center gap-2">
                                                <CardTitle className="truncate max-w-[180px]" title={note.title}>
                                                    {note.title}
                                                </CardTitle>
                                                {note.is_trained && (
                                                    <span
                                                        title="Trained"
                                                        className="flex items-center justify-center w-6 h-6 rounded-full bg-[#DB2B30] shadow-lg shadow-red-500/30"
                                                    >
                                                        <FaBrain size={12} className="text-white" />
                                                    </span>
                                                )}
                                                {note.visibility && (
                                                    <span
                                                        title={
                                                            note.visibility === "private"
                                                                ? "Only Me"
                                                                : note.visibility === "public"
                                                                ? "All (Anyone can edit)"
                                                                : "Collaborate"
                                                        }
                                                        className={`text-xs px-2 py-0.5 rounded text-white ${
                                                            note.visibility === "private"
                                                                ? "bg-[#DB2B30]"
                                                                : note.visibility === "public"
                                                                ? "bg-[#DB2B30]"
                                                                : "bg-[#059669]"
                                                        }`}
                                                    >
                                                        {note.visibility === "private"
                                                            ? "Only Me"
                                                            : note.visibility === "public"
                                                            ? "All"
                                                            : "Collaborate"}
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
                                                                    window.open(
                                                                        `/dashboard/workspaces/${getWorkspaceUuid(note.workspaceId)}/collections/${note.collectionUuid ?? note.collectionId}/notes/${note.uuid ?? note.id}`,
                                                                        "_blank",
                                                                        "noopener,noreferrer"
                                                                    );
                                                                }}
                                                                className="cursor-pointer"
                                                            >
                                                                <Copy className="mr-2 h-4 w-4" />
                                                                Open in new pane
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    toast.info("Ask AI for this article is coming soon.");
                                                                }}
                                                                className="cursor-pointer"
                                                            >
                                                                <Sparkles className="mr-2 h-4 w-4" />
                                                                Ask AI
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    window.location.href = `/dashboard/articles/new?noteId=${note.id}&collection_id=${note.collectionId}`;
                                                                }}
                                                                className="cursor-pointer"
                                                            >
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Edit Article
                                                            </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={(e) => handleTrainClick(note.id, note.is_trained || false, e)}
                                                            className={`cursor-pointer ${note.is_trained ? "text-cyan-600 focus:text-cyan-600" : ""} ${trainingNoteId === note.id && isTraining ? "opacity-50 cursor-not-allowed" : ""}`}
                                                            disabled={trainingNoteId === note.id && isTraining}
                                                        >
                                                            {trainingNoteId === note.id && isTraining ? (
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <FaBrain className="mr-2" />
                                                            )}
                                                            {trainingNoteId === note.id && isTraining ? "Processing..." : note.is_trained ? "Untrain Article" : "Train Article"}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={(e) => handleMoveClick(note, e)}
                                                            className="cursor-pointer"
                                                        >
                                                            <FolderKanban className="mr-2 h-4 w-4" />
                                                            Move to
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
                                                                <AvatarFallback className="bg-[#DB2B30] text-white text-xs font-semibold">
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
                })}
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

            <AlertDialog
                open={moveDialogOpen}
                onOpenChange={(isOpen) => {
                    setMoveDialogOpen(isOpen);
                    if (!isOpen) {
                        setNoteToMove(null);
                        setSelectedCollectionId("");
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <FolderKanban className="w-5 h-5 text-teal-500" />
                            Move Article to Collection
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Select a collection to move this article to. This action will move the article from the current collection to the selected one.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <Label htmlFor="move-collection-select" className="text-sm font-medium mb-2 block">
                            Select Collection
                        </Label>
                        {availableCollections.length > 0 ? (
                            <Select
                                value={selectedCollectionId}
                                onValueChange={setSelectedCollectionId}
                            >
                                <SelectTrigger id="move-collection-select" className="w-full" disabled={isMoving}>
                                    <SelectValue placeholder="-- Select a collection --" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableCollections.map((col) => (
                                        <SelectItem key={col.id} value={String(col.id)}>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{col.title}</span>
                                                {col.workspaceName && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {col.workspaceName}
                                                    </span>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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

interface NotesApiResponse {
    status: boolean;
    message: string;
    data: {
        notes: Array<{
            id: number;
            uuid?: string | null;
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
            visibility?: "private" | "public" | "shared";
            user_id?: number;
            owner_name?: string;
            owner_email?: string;
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
        uuid: n.uuid ?? null,
        title: n.title,
        createdAt: n.created_at ?? "",
        createdBy: String(n.created_by),
        fileName: n.file_name,
        fileSize: n.file_size,
        fileType: n.file_type,
        hasFile: n.has_file,
        is_trained: n.is_trained,
        is_pinned: n.is_pinned,
        visibility: n.visibility,
        user_id: n.created_by || n.user_id,
        owner_name: n.owner_name,
        owner_email: n.owner_email,
    }));
}

export default function AllNotesPage() {
    const router = useRouter();
    const { currentBrainSpaceId } = useBrainSpaceStore();
    const { data: collections, isLoading: collectionsLoading } = useUserCollections(currentBrainSpaceId);
    const [searchQuery, setSearchQuery] = useState("");
    const tenantId = useAuthStore((state) => state.tenantId);
    const hydrated = useAuthStore((state) => state.hydrated);
    const userId = useAuthStore((state) => state.userId);
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const { mutate: createNote, isPending } = useCreateNote();

    // Collections are already filtered by backend based on workspace_id
    const filteredCollections = collections || [];

    // Use shared permission hook (no collectionId for side menu - checks global permissions)
    const { canCreateNote, permissionsLoading, hasAnyNotePermission, isOwnerOrAdmin, permissions, refetchPermissions } = useNotePermissions();

    const form = useForm<CreateNoteFormValues>({
        resolver: zodResolver(createNoteSchema),
        defaultValues: {
            title: "",
            content: "",
            collection_id: "",
        },
    });

    const onSubmit = (values: CreateNoteFormValues) => {
        // Redirect to the new article editor instead of creating directly
        setOpen(false);
        router.push(`/dashboard/articles/new?collection_id=${values.collection_id}`);
    };

    // Fetch notes for filtered collections using useQueries
    const noteQueries = useQueries({
        queries: (filteredCollections || []).map((collection) => ({
            queryKey: ["collectionNotes", collection.id, tenantId],
            queryFn: () => fetchCollectionNotes(collection.id),
            enabled: !!collection.id && !!tenantId && hydrated && !!filteredCollections && filteredCollections.length > 0,
        })),
    });

    const isLoading = collectionsLoading || noteQueries.some(q => q.isLoading);
    const hasError = noteQueries.some(q => q.isError);

    // Combine all notes with collection and workspace info
    const allNotes: NoteWithCollection[] = useMemo(() => {
        if (!filteredCollections) return [];

        const notes: NoteWithCollection[] = [];
        noteQueries.forEach((query, index) => {
            if (query.data && filteredCollections[index]) {
                query.data.forEach((note) => {
                    const collection = filteredCollections[index];
                    notes.push({
                        ...note,
                        collectionId: collection.id,
                        collectionUuid: collection.uuid ?? null,
                        workspaceId: collection.workspaceId,
                        collectionName: collection.title,
                        workspaceName: collection.workspaceName,
                    });
                });
            }
        });
        return notes;
    }, [filteredCollections, noteQueries]);

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
            <div className="flex flex-col items-center justify-center p-4">

                <nav className="sticky top-0 z-[60] w-[90%] mx-auto self-center px-15 flex justify-between items-center bg-background border-b border-border py-3">
                    <Input
                        type="text"
                        placeholder="Search articles..."
                        className="w-64"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />

                    {filteredCollections && filteredCollections.length > 0 && !permissionsLoading && canCreateNote && (
                        <Button
                            className="gap-2"
                            onClick={() => {
                                // If only one collection, redirect with it pre-selected
                                if (filteredCollections.length === 1) {
                                    router.push(`/dashboard/articles/new?collection_id=${filteredCollections[0].id}`);
                                } else {
                                    // Otherwise, just go to editor and let user select
                                    router.push(`/dashboard/articles/new`);
                                }
                            }}
                        >
                            <Plus className="h-4 w-4" />
                            Create Article
                        </Button>
                    )}
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
                                <p>Something went wrong while loading articles.</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {filteredNotes.length > 0 && (
                    <AllNotesList notes={filteredNotes} searchQuery={searchQuery} />
                )}

                {filteredNotes.length === 0 && !isLoading && (
                    <div className="w-full flex items-center justify-center p-10 mt-10">
                        <div className="flex flex-col items-center text-center max-w-lg">
                            <div className="relative mb-8">
                                {/* Animated background gradient */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B6B]/25 via-[#FF3B3B]/25 to-[#E10000]/25 rounded-full blur-3xl animate-pulse"></div>
                                {/* Main icon container */}
                                <div className="relative w-32 h-32 bg-gradient-to-br from-[#FF6B6B]/15 via-[#FF3B3B]/15 to-[#E10000]/15 dark:from-[#7F1D1D]/60 dark:via-[#991B1B]/60 dark:to-[#7F1D1D]/60 rounded-2xl flex items-center justify-center border border-[#DB2B30]/40 dark:border-[#DB2B30]/60 shadow-lg">
                                    <FileText className="w-16 h-16 text-[#DB2B30] dark:text-[#FDEBEB]" />
                                </div>
                                {/* Decorative sparkles */}
                                <div className="absolute -top-2 -right-2">
                                    <Sparkles className="w-6 h-6 text-[#FFB3B3] animate-pulse" />
                                </div>
                                <div className="absolute -bottom-2 -left-2">
                                    <Sparkles className="w-5 h-5 text-[#FF8A8A] animate-pulse delay-300" />
                                </div>
                            </div>

                            <h3 className="text-2xl font-bold text-foreground mb-3">
                                No Content Yet
                            </h3>

                            <p className="text-muted-foreground mb-8 text-base leading-relaxed">
No content has been created yet. Start documenting your knowledge by creating your first article.
                                    You can add content and train it for your AI assistant.
                            </p>

                            {filteredCollections && filteredCollections.length > 0 && canCreateNote && (
                                <Button
                                    onClick={() => {
                                        // If only one collection, redirect with it pre-selected
                                        if (filteredCollections.length === 1) {
                                            router.push(`/dashboard/articles/new?collection_id=${filteredCollections[0].id}`);
                                        } else {
                                            // Otherwise, just go to editor and let user select
                                            router.push(`/dashboard/articles/new`);
                                        }
                                    }}
                                    className="bg-[#DB2B30] hover:bg-[#B52227] text-white shadow-lg hover:shadow-xl transition-all"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Your First Article
                                </Button>
                            )}

                            {filteredCollections && filteredCollections.length > 0 && !canCreateNote && !permissionsLoading && (
                                <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="w-4 h-4" />
                                        <span>You don't have permission to create articles. Please contact an administrator or become a member of a collection with editor/owner role.</span>
                                    </div>
                                    {permissions && permissions.length === 0 && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-amber-600">No permissions found. If you just added permissions, try refreshing:</span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => refetchPermissions()}
                                                className="h-7"
                                            >
                                                <RefreshCw className="w-3 h-3 mr-1" />
                                                Refresh Permissions
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {(!filteredCollections || filteredCollections.length === 0) && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <BookOpen className="w-4 h-4" />
                                    <span>
                                        {currentBrainSpaceId
                                            ? "No collections found in the selected brain space. Create a collection first before creating articles."
                                            : "You need to create a collection first before creating articles. Select a brain space to filter collections."
                                        }
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </RequireAuth>
    );
}

