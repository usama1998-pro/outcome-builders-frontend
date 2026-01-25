"use client";

import { Button } from "@/components/ui/button";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FaEdit, FaArrowLeft, FaPaperclip, FaFile, FaTimes, FaBrain } from "react-icons/fa";
import { useState, useRef, useEffect } from "react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUpdateNote, useToggleTrainNote } from "@/src/hooks/useNotes";
import api from "@/src/lib/axios";
import routes from "@/src/lib/routes";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import BlocksLoader from "@/src/components/Loaders/BlocksLoader/BlocksLoader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDateTime } from "@/src/utils/dateTimeFormat";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/src/store/useAuth";
import RequireAuth from "@/src/components/auth/requireAuth";

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB
const ALLOWED_FILE_TYPES = [".pdf", ".txt", ".doc", ".docx"];
const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export default function NoteViewPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const workspaceId = Array.isArray(params.workspaceId) ? params.workspaceId[0] : params.workspaceId;
    const collectionId = Array.isArray(params.collectionId) ? params.collectionId[0] : params.collectionId;
    const noteIdParam = Array.isArray(params.noteId) ? params.noteId[0] : params.noteId;
    const noteId = noteIdParam ? Number(noteIdParam) : null;

    const tenantId = useAuthStore((s) => s.tenantId);
    
    const [note, setNote] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const { mutate: updateNote, isPending: isUpdating } = useUpdateNote();
    const { mutate: toggleTrain, isPending: isTraining } = useToggleTrainNote();
    
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [mounted, setMounted] = useState(false);

    // Track client-side mounting
    useEffect(() => {
        setMounted(true);
    }, []);
    
    // Fetch note when tenantId is available (RequireAuth handles hydration)
    useEffect(() => {
        if (!mounted || !tenantId || !noteId) return;
        
        const fetchNote = async () => {
            setIsLoading(true);
            setIsError(false);
            setError(null);
            
            try {
                const response = await api.get(routes.notes.getById(noteId));
                setNote(response.data.data.note);
            } catch (err: any) {
                console.error("[NoteViewPage] Error fetching note:", err);
                setIsError(true);
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchNote();
    }, [mounted, tenantId, noteId]);

    // Populate edit form when note loads
    useEffect(() => {
        if (note) {
            setEditTitle(note.title);
            setEditContent(note.content);
        }
    }, [note]);
    
    // Open edit dialog if ?edit=true is in URL
    useEffect(() => {
        if (searchParams.get("edit") === "true" && note?.is_owner && !editDialogOpen) {
            setEditDialogOpen(true);
            // Remove the query param from URL without navigation
            router.replace(`/dashboard/workspaces/${workspaceId}/collections/${collectionId}/notes/${noteId}`);
        }
    }, [searchParams, note, workspaceId, collectionId, noteId, router, editDialogOpen]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setFileError(null);
        
        if (file) {
            const fileExt = "." + file.name.split(".").pop()?.toLowerCase();
            if (!ALLOWED_FILE_TYPES.includes(fileExt)) {
                setFileError("Only PDF, TXT, DOC, and DOCX files are allowed.");
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                return;
            }
            
            if (!ALLOWED_MIME_TYPES.includes(file.type)) {
                setFileError("Only PDF, TXT, DOC, and DOCX files are allowed.");
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                return;
            }
            
            if (file.size > MAX_FILE_SIZE) {
                setFileError(`File size exceeds 1 MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)} MB`);
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                return;
            }
            setSelectedFile(file);
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
        setFileError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!editTitle.trim()) {
            toast.error("Title is required");
            return;
        }
        if (!editContent.trim()) {
            toast.error("Content is required");
            return;
        }

        if (!noteId) return;
        
        updateNote(
            {
                note_id: noteId,
                title: editTitle,
                content: editContent,
                file: selectedFile,
            },
            {
                onSuccess: (res) => {
                    if (res?.status) {
                        toast.success(res.message || "Note updated successfully!");
                        setEditDialogOpen(false);
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                    } else {
                        toast.error(res?.message || "Could not update note.");
                    }
                },
                onError: (err: unknown) => {
                    const error = err as { message?: string };
                    toast.error(error?.message || "Request failed, please try again.");
                },
            }
        );
    };

    const openEditDialog = () => {
        if (note) {
            setEditTitle(note.title);
            setEditContent(note.content);
        }
        setEditDialogOpen(true);
    };

    const handleToggleTrain = () => {
        if (!noteId) return;
        
        toggleTrain(noteId, {
            onSuccess: (res) => {
                if (res?.status) {
                    toast.success(res.data.message);
                    // Update local state
                    setNote((prev: any) => prev ? { ...prev, is_trained: res.data.is_trained } : prev);
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

    return (
        <RequireAuth>
        <div className="flex flex-col items-center p-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard/workspaces">Brainspaces</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href={`/dashboard/workspaces/${workspaceId}/collections`}>Collections</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href={`/dashboard/workspaces/${workspaceId}/collections/${collectionId}/notes`}>Notes</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href={`/dashboard/workspaces/${workspaceId}/collections/${collectionId}/notes/${noteId}`}>
                            View Note
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <nav className="sticky top-0 w-[90%] mx-auto self-center flex justify-between items-center bg-background border-b border-border py-5 mt-4">
                <Button
                    variant="outline"
                    onClick={() => router.push(`/dashboard/workspaces/${workspaceId}/collections/${collectionId}/notes`)}
                >
                    <FaArrowLeft className="mr-2" /> Back to Notes
                </Button>

                <div className="flex gap-2">
                    {note?.is_owner && (
                        <Button 
                            variant={note?.is_trained ? "default" : "outline"}
                            onClick={handleToggleTrain}
                            disabled={isTraining}
                            className={note?.is_trained ? "bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 text-white border-0 hover:opacity-90" : ""}
                        >
                            <FaBrain className="mr-2" /> 
                            {isTraining ? "Processing..." : note?.is_trained ? "Trained" : "Train"}
                        </Button>
                    )}
                    {note?.is_owner && (
                        <Button onClick={openEditDialog}>
                            <FaEdit className="mr-2" /> Edit Note
                        </Button>
                    )}
                </div>
            </nav>

            {(!mounted || isLoading) && (
                <div className="w-full h-full flex items-center justify-center p-10">
                    <BlocksLoader />
                </div>
            )}

            {mounted && !isLoading && isError && (
                <div className="w-full h-full flex items-center justify-center p-10">
                    <Card className="w-[400px] border border-red-500 text-red-800 shadow-md">
                        <CardHeader className="border-b border-red-800">
                            <CardTitle className="text-lg font-semibold text-red-700">Error</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <p>{error?.message || "Something went wrong."}</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {mounted && !isLoading && note && (
                <Card className="w-[90%] max-w-4xl mt-6">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CardTitle className="text-2xl">{note.title}</CardTitle>
                                {note.has_file && (
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                        <FaPaperclip size={12} />
                                        {note.file_name}
                                    </Badge>
                                )}
                            </div>
                            <div className="flex gap-2">
                                {note.is_pinned && <Badge>Pinned</Badge>}
                                {note.is_trained && (
                                    <Badge className="bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 text-white border-0">
                                        <FaBrain className="mr-1" size={10} /> Trained
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <CardDescription>
                            Created {formatDateTime(note.created_at || "")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {note.has_file && note.file_size && (
                            <div className="mb-6 p-4 bg-muted rounded-lg">
                                <h4 className="text-sm font-medium mb-2">Attachment</h4>
                                <div className="flex items-center gap-2">
                                    <FaFile className="text-blue-500" />
                                    <span>{note.file_name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        ({formatFileSize(note.file_size)})
                                    </span>
                                </div>
                            </div>
                        )}
                        
                        <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                            {note.content}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Edit Dialog */}
            <AlertDialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <AlertDialogContent className="max-w-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Edit Note</AlertDialogTitle>
                        <AlertDialogDescription>
                            Update the title and content of your note.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="edit-title">Title</Label>
                            <Input
                                id="edit-title"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                placeholder="Note title"
                            />
                        </div>

                        <div>
                            <Label htmlFor="edit-content">Content</Label>
                            <Textarea
                                id="edit-content"
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                placeholder="Note content..."
                                rows={10}
                            />
                        </div>

                        <div>
                            <Label htmlFor="edit-file">
                                Replace Attachment (optional, max 1 MB - PDF, TXT, DOC, DOCX only)
                            </Label>
                            <Input
                                id="edit-file"
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".pdf,.txt,.doc,.docx"
                            />
                            {fileError && (
                                <p className="text-sm text-red-500 mt-1">{fileError}</p>
                            )}
                            {selectedFile && !fileError && (
                                <div className="mt-2 flex items-center gap-2 p-2 bg-muted rounded-md">
                                    <FaFile className="text-blue-500" />
                                    <span className="text-sm truncate flex-1">{selectedFile.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatFileSize(selectedFile.size)}
                                    </span>
                                    <button type="button" onClick={removeFile} className="text-red-500 hover:text-red-700">
                                        <FaTimes />
                                    </button>
                                </div>
                            )}
                        </div>

                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
                            <Button type="submit" disabled={isUpdating}>
                                {isUpdating ? "Saving..." : "Save Changes"}
                            </Button>
                        </AlertDialogFooter>
                    </form>
                </AlertDialogContent>
            </AlertDialog>
        </div>
        </RequireAuth>
    );
}

