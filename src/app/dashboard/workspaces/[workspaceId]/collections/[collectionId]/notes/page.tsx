"use client";


import { Button } from "@/components/ui/button";
import { NotesList } from "@/src/components/List/Notes/NotesList";
import { useParams } from "next/navigation";
import { FaPlus } from "react-icons/fa";
import { FileText, Plus, Sparkles, BookOpen, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
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
import { useCollectionNotes, useCreateNote, useShareNote } from "@/src/hooks/useNotes";
import { useTenantUsers, useUserCollections } from "@/src/hooks/useCollection";
import { useAuthStore } from "@/src/store/useAuth";
import { X, UserPlus, Search } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import BlocksLoader from "@/src/components/Loaders/BlocksLoader/BlocksLoader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RequireAuth from "@/src/components/auth/requireAuth";
import { useNotePermissions } from "@/src/hooks/useNotePermissions";

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
    const { data: collections = [] } = useUserCollections();
    const { mutate: createNote, isPending } = useCreateNote();
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [visibility, setVisibility] = useState<"private" | "public" | "shared">("private");
    const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | "">("");
    const [memberSearchQuery, setMemberSearchQuery] = useState("");
    const userId = useAuthStore((state) => state.userId);
    const { data: tenantUsers = [] } = useTenantUsers();
    const { mutate: shareNote, isPending: isSharing } = useShareNote();

    // Use shared permission hook
    const {
        canCreateNote,
        isCollectionPrivate,
        permissionsLoading
    } = useNotePermissions(Number(collectionId));

    // Reset visibility if it's "shared" but collection is private
    useEffect(() => {
        if (visibility === "shared" && isCollectionPrivate) {
            setVisibility("private");
            setSelectedMembers([]);
        }
    }, [isCollectionPrivate, visibility]);

    // Filter out current user and already selected users, and filter by search query
    const availableUsers = tenantUsers.filter(
        (user) =>
            user.id !== userId &&
            !selectedMembers.includes(user.id) &&
            (memberSearchQuery === "" ||
                (user.full_name?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                    user.email.toLowerCase().includes(memberSearchQuery.toLowerCase())))
    );

    const handleAddMember = () => {
        if (!selectedUserId) return;
        setSelectedMembers([...selectedMembers, Number(selectedUserId)]);
        setSelectedUserId("");
        setMemberSearchQuery("");
    };

    const handleRemoveMember = (userId: number) => {
        setSelectedMembers(selectedMembers.filter((id) => id !== userId));
    };

    const form = useForm<CreateNoteFormValues>({
        resolver: zodResolver(createNoteSchema),
        defaultValues: {
            title: "",
            content: "",
        },
    });

    const onSubmit = async (values: CreateNoteFormValues) => {
        createNote(
            {
                title: values.title,
                content: values.content,
                collection_id: Number(collectionId),
                visibility: visibility,
            },
            {
                onSuccess: async (res) => {
                    if (res?.status) {
                        // If visibility is "shared" (Collaborate) and there are members, share the note with them
                        if (visibility === "shared" && selectedMembers.length > 0) {
                            // Get the note ID from the response
                            const noteId = (res?.data as any)?.note?.id || (res?.data as any)?.id;

                            if (noteId) {
                                // Share note with selected members
                                try {
                                    await new Promise<void>((resolve, reject) => {
                                        shareNote(
                                            {
                                                noteId,
                                                payload: {
                                                    user_ids: selectedMembers,
                                                },
                                            },
                                            {
                                                onSuccess: () => {
                                                    resolve();
                                                },
                                                onError: (err) => reject(err),
                                            }
                                        );
                                    });
                                    toast.success("Note created and shared with members successfully!");
                                } catch (err: any) {
                                    toast.warning("Note created but some members could not be added. You can share it manually.");
                                }
                            } else {
                                toast.success(res.message || "Note created successfully!");
                                toast.info("Please share the note manually from the note view page.");
                            }
                        } else {
                            toast.success(res.message || "Note created successfully!");
                        }

                        form.reset();
                        setVisibility("private");
                        setSelectedMembers([]);
                        setSelectedUserId("");
                        setMemberSearchQuery("");
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
                <nav className="sticky top-0 w-[90%] mx-auto self-center px-15 flex justify-between items-center bg-background border-b border-border py-5">
                    <Input
                        type="text"
                        placeholder="Search articles..."
                        className="w-64"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />

                    {canCreateNote && (
                        <AlertDialog
                            open={open}
                            onOpenChange={(isOpen) => {
                                setOpen(isOpen);
                                if (!isOpen) {
                                    form.reset();
                                    setVisibility("private");
                                    setSelectedMembers([]);
                                    setSelectedUserId("");
                                    setMemberSearchQuery("");
                                }
                            }}
                        >
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
                                        <Label className="pb-3" htmlFor="visibility">
                                            Visibility
                                        </Label>
                                        <Select
                                            value={visibility}
                                            onValueChange={(value: "private" | "public" | "shared") => {
                                                if (value === "shared" && isCollectionPrivate) {
                                                    toast.error("Cannot use 'Collaborate' option. The collection is private. Please make the collection 'Shared' first to enable collaboration on notes.");
                                                    return;
                                                }
                                                setVisibility(value);
                                            }}
                                        >
                                            <SelectTrigger id="visibility">
                                                <SelectValue placeholder="Select visibility" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="private">Only Me (Only visible to me)</SelectItem>
                                                <SelectItem
                                                    value="shared"
                                                    disabled={isCollectionPrivate}
                                                    className={isCollectionPrivate ? "opacity-50 cursor-not-allowed" : ""}
                                                >
                                                    Collaborate (Specified people)
                                                </SelectItem>
                                                <SelectItem value="public">All (Anyone can edit)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {visibility === "private" && "Only you can see and access this note"}
                                            {visibility === "shared" && "Share this note with specific people. They will only see this note, not other notes in the collection."}
                                            {visibility === "public" && "Anyone in your organization can view and edit this note"}
                                        </p>
                                        {isCollectionPrivate && (
                                            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1 flex items-center gap-1">
                                                <span>⚠️</span>
                                                <span>To use "Collaborate" option, the collection must be set to "Shared". Please update the collection visibility first.</span>
                                            </p>
                                        )}
                                    </div>

                                    {/* Member Selection Section - Only show when visibility is "shared" (Collaborate) and collection is not private */}
                                    {visibility === "shared" && !isCollectionPrivate && (
                                        <div className="space-y-3 pt-4 border-t border-border">
                                            <Label className="text-base font-semibold">Collaborate Members</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Add members who can view and collaborate on this note. They will only see this note, not other notes in the collection.
                                            </p>

                                            {/* Add Member Section */}
                                            <div className="flex gap-2">
                                                <div className="flex-1 relative">
                                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="Search by name or email..."
                                                        value={memberSearchQuery}
                                                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                                                        className="pl-9"
                                                    />
                                                </div>
                                                <Select
                                                    value={selectedUserId.toString()}
                                                    onValueChange={(value) => setSelectedUserId(value === "" ? "" : Number(value))}
                                                >
                                                    <SelectTrigger className="w-[200px]">
                                                        <SelectValue placeholder="Select user" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableUsers.length === 0 ? (
                                                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                                {memberSearchQuery ? "No users found" : "No users available"}
                                                            </div>
                                                        ) : (
                                                            availableUsers.map((user) => (
                                                                <SelectItem key={user.id} value={user.id.toString()}>
                                                                    {user.full_name || user.email}
                                                                </SelectItem>
                                                            ))
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    type="button"
                                                    onClick={handleAddMember}
                                                    disabled={!selectedUserId}
                                                    size="sm"
                                                    className="shrink-0"
                                                >
                                                    <UserPlus className="w-4 h-4 mr-1" />
                                                    Add
                                                </Button>
                                            </div>

                                            {/* Members List */}
                                            {selectedMembers.length > 0 && (
                                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                                    {selectedMembers.map((memberId) => {
                                                        const member = tenantUsers.find((u) => u.id === memberId);
                                                        if (!member) return null;
                                                        return (
                                                            <div
                                                                key={memberId}
                                                                className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                                                            >
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium truncate">
                                                                        {member.full_name || member.email}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {member.email}
                                                                    </p>
                                                                </div>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleRemoveMember(memberId)}
                                                                    className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {selectedMembers.length === 0 && (
                                                <p className="text-sm text-muted-foreground text-center py-4">
                                                    No members added yet. Search and add members to collaborate on this note.
                                                </p>
                                            )}
                                        </div>
                                    )}

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
                                You can add content and train articles for your AI assistant.
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

                            {!canCreateNote && !permissionsLoading && (
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
