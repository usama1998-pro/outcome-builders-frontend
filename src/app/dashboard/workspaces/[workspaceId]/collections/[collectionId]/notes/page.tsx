"use client";


import { Button } from "@/components/ui/button";
import { NotesList } from "@/src/components/List/Notes/NotesList";
import { useParams } from "next/navigation";
import { FaPlus, FaFile, FaTimes } from "react-icons/fa";
import { FileText, Plus, Sparkles, BookOpen } from "lucide-react";
import { useState, useRef } from "react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    // BreadcrumbPage,
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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCollectionNotes, useCreateNote } from "@/src/hooks/useNotes";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import BlocksLoader from "@/src/components/Loaders/BlocksLoader/BlocksLoader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RequireAuth from "@/src/components/auth/requireAuth";
import { useUserPermissions, PERMISSIONS } from "@/src/hooks/useUserPermissions";

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
});

type CreateNoteFormValues = z.infer<typeof createNoteSchema>;
export default function NotesPage() {
    const params = useParams();
    const workspaceId = Array.isArray(params.workspaceId) ? params.workspaceId[0] : params.workspaceId; // workspace id from URL
    const collectionId = Array.isArray(params.collectionId) ? params.collectionId[0] : params.collectionId;

    const { data: notes, isLoading, isError, error, refetch } = useCollectionNotes(Number(collectionId));
    const { mutate: createNote, isPending } = useCreateNote();
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Permission checks - hide elements until permissions are loaded and confirmed
    const { hasPermission, isOwnerOrAdmin, isLoading: permissionsLoading } = useUserPermissions();
    const canCreateNote = !permissionsLoading && (
        hasPermission(PERMISSIONS.NOTE_CREATE) || isOwnerOrAdmin
    );

    const form = useForm<CreateNoteFormValues>({
        resolver: zodResolver(createNoteSchema),
        defaultValues: {
            title: "",
            content: "",
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
                collection_id: Number(collectionId),
                file: selectedFile,
            },
            {
                onSuccess: (res) => {
                    if (res?.status) {
                        toast.success(res.message || "Note created successfully!");
                        form.reset();
                        setSelectedFile(null);
                        if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                        }
                        setOpen(false);
                        refetch(); // Refresh the notes list
                    } else {
                        toast.error(res?.message || "Could not create note.");
                    }
                },
                onError: (err: unknown) => {
                    const error = err as { message?: string };
                    toast.error(error?.message || "Request failed, please try again.");
                },
            }
        );
    };



    return (
        <RequireAuth>
        <div className="flex flex-col items-center justify-center p-6">
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
                        <BreadcrumbLink href={`/dashboard/workspaces/${workspaceId}/collections/${collectionId}/notes`}>Articles</BreadcrumbLink>
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

                {canCreateNote && (
                <AlertDialog open={open} onOpenChange={setOpen}>
                    <AlertDialogTrigger asChild>
                        <Button>
                            <FaPlus className="mr-2" /> New Article
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Create a new article</AlertDialogTitle>
                            <AlertDialogDescription>
                                Enter a title and content for your new article below.
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <form
                            id="create-note-form"
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-4"
                        >
                            <div>
                                <Label className="pb-3" htmlFor="title">
                                    Title
                                </Label>
                                <Input
                                    id="title"
                                    placeholder="e.g. Meeting Article"
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
                                    Content
                                </Label>
                                <Textarea
                                    id="content"
                                    placeholder="Write your note content here..."
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
                                <AlertDialogCancel disabled={isPending}>
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

            {isError && (
                <div className="w-full h-full flex items-center justify-center p-5">
                    <Card className="w-[300px] h-[200px] flex flex-col border border-red-500 text-red-800 shadow-md">
                        <CardHeader className="border-b border-red-800">
                            <CardTitle className="text-lg font-semibold text-red-700">Error</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex items-center justify-center">
                            <p>{error?.message || "Something went wrong."}</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {notes && notes.length > 0 && (
                <NotesList notes={notes} collection={{ id: Number(collectionId) }} workspace={{ id: Number(workspaceId) }} searchQuery={searchQuery} />
            )}

            {notes && notes.length === 0 && !isLoading && (
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

                        {canCreateNote && (
                            <Button 
                                onClick={() => setOpen(true)}
                                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Your First Article
                            </Button>
                        )}

                        {!canCreateNote && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <BookOpen className="w-4 h-4" />
                                <span>You don't have permission to create articles in this collection.</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
        </RequireAuth>
    );
}


// const notes = [
//     {
//         id: 1,
//         title: "Notes 1",
//         createdAt: "24 Sep, 2025 at 10:05 PM",
//         createdBy: "usama",
//         description: "This is Notes 1",
//         members: 10,
//         avatarUrl: "https://github.com/shadcn.png",
//         workspaceId: Number(workspaceId),
//         workspaceName: "Workspace"
//     },
//     {
//         id: 2,
//         title: "Notes 2",
//         createdAt: "24 Sep, 2025 at 10:05 PM",
//         createdBy: "usama",
//         description: "This is Notes 2",
//         members: 12,
//         avatarUrl: "https://github.com/shadcn.png",
//         workspaceId: Number(workspaceId),
//         workspaceName: "Workspace"
//     },
//     {
//         id: 3,
//         title: "Notes 3",
//         createdAt: "24 Sep, 2025 at 10:05 PM",
//         createdBy: "usama",
//         description: "This is Notes 3",
//         members: 13,
//         avatarUrl: "https://github.com/shadcn.png",
//         workspaceId: Number(workspaceId),
//         workspaceName: "Workspace"
//     },
//     {
//         id: 4,
//         title: "Notes 4",
//         createdAt: "24 Sep, 2025 at 10:05 PM",
//         createdBy: "usama",
//         description: "This is Notes 4",
//         members: 14,
//         avatarUrl: "https://github.com/shadcn.png",
//         workspaceId: Number(workspaceId),
//         workspaceName: "Workspace"
//     },
//     {
//         id: 5,
//         title: "Notes 5",
//         createdAt: "24 Sep, 2025 at 10:05 PM",
//         createdBy: "usama",
//         description: "This is Notes 5",
//         members: 5,
//         avatarUrl: "https://github.com/shadcn.png",
//         workspaceId: Number(workspaceId),
//         workspaceName: "Workspace"
//     },
//     {
//         id: 6,
//         title: "Notes 6",
//         createdAt: "24 Sep, 2025 at 10:05 PM",
//         createdBy: "usama",
//         description: "This is Notes 6",
//         members: 3,
//         avatarUrl: "https://github.com/shadcn.png",
//         workspaceId: Number(workspaceId),
//         workspaceName: "Workspace"
//     },
//     {
//         id: 7,
//         title: "Notes 7",
//         createdAt: "24 Sep, 2025 at 10:05 PM",
//         createdBy: "usama",
//         description: "This is Notes 7",
//         members: 4,
//         avatarUrl: "https://github.com/shadcn.png",
//         workspaceId: Number(workspaceId),
//         workspaceName: "Workspace"
//     },
//     {
//         id: 8,
//         title: "Notes 8",
//         createdAt: "24 Sep, 2025 at 10:05 PM",
//         createdBy: "usama",
//         description: "This is Notes 8",
//         members: 6,
//         avatarUrl: "https://github.com/shadcn.png",
//         workspaceId: Number(workspaceId),
//         workspaceName: "Workspace"
//     }
// ];
