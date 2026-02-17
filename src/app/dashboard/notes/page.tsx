"use client";

import { useState, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
} from "@/components/ui/breadcrumb";
import { useUserCollections } from "@/src/hooks/useCollection";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import api from "@/src/lib/axios";
import routes from "@/src/lib/routes";
import Notes from "@/src/types/notes";
import { useAuthStore } from "@/src/store/useAuth";
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
import { useUserPermissions, PERMISSIONS } from "@/src/hooks/useUserPermissions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { BsThreeDotsVertical } from "react-icons/bs";
import { formatDateTime } from "@/src/utils/dateTimeFormat";
import { FaTrash, FaPaperclip, FaEdit, FaEye, FaBrain, FaFile, FaTimes } from "react-icons/fa";
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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useDeleteNote, useToggleTrainNote, useCreateNote } from "@/src/hooks/useNotes";
import { FileText, Plus, Search, FolderOpen, Sparkles, BookOpen } from "lucide-react";
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

interface NoteWithCollection extends Notes {
    collectionId: number;
    workspaceId: number;
    collectionName: string;
    workspaceName: string;
}


const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB
const ALLOWED_FILE_TYPES = [".pdf", ".txt", ".doc", ".docx"];
const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const createNoteSchema = z.object({
    title: z.string().min(1, "Title is required").max(200, "Title is too long"),
    content: z.string().min(1, "Content is required"),
    collection_id: z.string().min(1, "Please select a collection"),
});

type CreateNoteFormValues = z.infer<typeof createNoteSchema>;

function AllNotesList({ notes, searchQuery = "" }: { notes: NoteWithCollection[]; searchQuery?: string }) {
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
        if (!searchQuery.trim()) return notes;
        
        const query = searchQuery.toLowerCase().trim();
        return notes.filter(note => 
            note.title.toLowerCase().includes(query) ||
            note.createdBy?.toLowerCase().includes(query)
        );
    }, [notes, searchQuery]);

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

                {filteredNotes.map((note) => (
                    <div key={note.id} className="relative">
                        <Link 
                            href={`/dashboard/workspaces/${note.workspaceId}/collections/${note.collectionId}/notes/${note.id}`} 
                            className="no-underline"
                        >
                            <Card className="w-[300px] h-[200px] flex flex-col justify-between">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="truncate max-w-[180px]" title={note.title}>
                                            {note.title}
                                        </CardTitle>
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
    const [open, setOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();
    const { mutate: createNote, isPending } = useCreateNote();

    const form = useForm<CreateNoteFormValues>({
        resolver: zodResolver(createNoteSchema),
        defaultValues: {
            title: "",
            content: "",
            collection_id: "",
        },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setFileError(null);
        
        if (file) {
            // Check file extension
            const fileExt = "." + file.name.split(".").pop()?.toLowerCase();
            if (!ALLOWED_FILE_TYPES.includes(fileExt)) {
                setFileError("Only PDF, TXT, DOC, and DOCX files are allowed.");
                setSelectedFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                return;
            }
            
            // Check MIME type
            if (!ALLOWED_MIME_TYPES.includes(file.type)) {
                setFileError("Only PDF, TXT, DOC, and DOCX files are allowed.");
                setSelectedFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                return;
            }
            
            // Check file size
            if (file.size > MAX_FILE_SIZE) {
                setFileError(`File size exceeds 1 MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)} MB`);
                setSelectedFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                return;
            }
            setSelectedFile(file);
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
        setFileError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    };

    const onSubmit = (values: CreateNoteFormValues) => {
        createNote(
            {
                title: values.title,
                content: values.content,
                collection_id: Number(values.collection_id),
                file: selectedFile,
            },
            {
                onSuccess: (res) => {
                    if (res?.status) {
                        toast.success(res.message || "Article created successfully!");
                        form.reset();
                        setSelectedFile(null);
                        if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                        }
                        setOpen(false);
                        // Invalidate all collection notes queries to refresh the list
                        queryClient.invalidateQueries({ queryKey: ["collectionNotes"] });
                    } else {
                        toast.error(res?.message || "Could not create article.");
                    }
                },
                onError: (err: unknown) => {
                    const error = err as { message?: string };
                    toast.error(error?.message || "Request failed, please try again.");
                },
            }
        );
    };

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
                                Articles
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <nav className="sticky top-0 w-[90%] mx-auto self-center px-15 flex justify-between items-center bg-background border-b border-border py-5">
                    <Input
                        type="text"
                        placeholder="Search articles..."
                        className="w-64"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    
                    {collections && collections.length > 0 && (
                        <AlertDialog open={open} onOpenChange={setOpen}>
                            <AlertDialogTrigger asChild>
                                <Button className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Create Article
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-2xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Create a new article</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Enter a title and content for your new article below. Select a collection to add it to.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>

                                <form
                                    id="create-note-form"
                                    onSubmit={form.handleSubmit(onSubmit)}
                                    className="space-y-4"
                                >
                                    <div>
                                        <Label className="pb-3" htmlFor="collection_id">
                                            Collection *
                                        </Label>
                                        <Select
                                            value={form.watch("collection_id")}
                                            onValueChange={(value) => form.setValue("collection_id", value)}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select a collection" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {collections.map((collection) => (
                                                    <SelectItem key={collection.id} value={String(collection.id)}>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{collection.title}</span>
                                                            {collection.workspaceName && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    {collection.workspaceName}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {form.formState.errors.collection_id && (
                                            <p className="text-sm !text-red-500 mt-1">
                                                {form.formState.errors.collection_id.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label className="pb-3" htmlFor="title">
                                            Title *
                                        </Label>
                                        <Input
                                            id="title"
                                            placeholder="e.g. Meeting Notes"
                                            {...form.register("title")}
                                            aria-invalid={!!form.formState.errors.title}
                                        />
                                        {form.formState.errors.title && (
                                            <p className="text-sm !text-red-500 mt-1">
                                                {form.formState.errors.title.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label className="pb-3" htmlFor="content">
                                            Content *
                                        </Label>
                                        <Textarea
                                            id="content"
                                            placeholder="Write your article content here..."
                                            rows={8}
                                            {...form.register("content")}
                                            aria-invalid={!!form.formState.errors.content}
                                        />
                                        {form.formState.errors.content && (
                                            <p className="text-sm !text-red-500 mt-1">
                                                {form.formState.errors.content.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label className="pb-3" htmlFor="file">
                                            Attachment (optional, max 1 MB - PDF, TXT, DOC, DOCX only)
                                        </Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="file"
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileChange}
                                                className="flex-1"
                                                accept=".pdf,.txt,.doc,.docx,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                            />
                                        </div>
                                        {fileError && (
                                            <p className="text-sm !text-red-500 mt-1">
                                                {fileError}
                                            </p>
                                        )}
                                        {selectedFile && !fileError && (
                                            <div className="mt-2 flex items-center gap-2 p-2 bg-muted rounded-md">
                                                <FaFile className="text-blue-500" />
                                                <span className="text-sm truncate flex-1">{selectedFile.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatFileSize(selectedFile.size)}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={removeFile}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <AlertDialogFooter>
                                        <AlertDialogCancel disabled={isPending} onClick={() => {
                                            form.reset();
                                            setSelectedFile(null);
                                            if (fileInputRef.current) {
                                                fileInputRef.current.value = "";
                                            }
                                        }}>
                                            Cancel
                                        </AlertDialogCancel>
                                        <Button
                                            type="submit"
                                            disabled={isPending}
                                            className="ml-2"
                                        >
                                            {isPending ? "Creating..." : "Create"}
                                        </Button>
                                    </AlertDialogFooter>
                                </form>
                            </AlertDialogContent>
                        </AlertDialog>
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
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-red-500/20 rounded-full blur-3xl animate-pulse"></div>
                                {/* Main icon container */}
                                <div className="relative w-32 h-32 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 dark:from-amber-900/30 dark:via-orange-900/30 dark:to-red-900/30 rounded-2xl flex items-center justify-center border border-amber-500/20 dark:border-amber-500/30 shadow-lg">
                                    <FileText className="w-16 h-16 text-amber-500 dark:text-amber-400" />
                                </div>
                                {/* Decorative sparkles */}
                                <div className="absolute -top-2 -right-2">
                                    <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
                                </div>
                                <div className="absolute -bottom-2 -left-2">
                                    <Sparkles className="w-5 h-5 text-orange-400 animate-pulse delay-300" />
                                </div>
                            </div>
                            
                            <h3 className="text-2xl font-bold text-foreground mb-3">
                                No Articles Yet
                            </h3>
                            
                            <p className="text-muted-foreground mb-8 text-base leading-relaxed">
                                This collection is empty. Start documenting your knowledge by creating your first article. 
                                You can add content, attach files, and train articles for your AI assistant.
                            </p>

                            {collections && collections.length > 0 && (
                                <Button 
                                    onClick={() => setOpen(true)}
                                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Your First Article
                                </Button>
                            )}

                            {(!collections || collections.length === 0) && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <BookOpen className="w-4 h-4" />
                                    <span>You need to create a collection first before creating articles.</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </RequireAuth>
    );
}

