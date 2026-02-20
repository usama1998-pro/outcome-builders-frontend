"use client";

import { Button } from "@/components/ui/button";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FaEdit, FaArrowLeft, FaBrain } from "react-icons/fa";
import { useState, useEffect } from "react";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUpdateNote, useToggleTrainNote, useShareNote, useUnshareNote, useNote } from "@/src/hooks/useNotes";
import { useTenantUsers, useUserCollections } from "@/src/hooks/useCollection";
import { useAuthStore } from "@/src/store/useAuth";
import { useNotePermissions } from "@/src/hooks/useNotePermissions";
import api from "@/src/lib/axios";
import routes from "@/src/lib/routes";
import { X, UserPlus, Search } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDateTime } from "@/src/utils/dateTimeFormat";
import { Badge } from "@/components/ui/badge";
import RequireAuth from "@/src/components/auth/requireAuth";

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
    const [shareDialogOpen, setShareDialogOpen] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [editVisibility, setEditVisibility] = useState<"private" | "public" | "shared">("private");
    const [shareUserIds, setShareUserIds] = useState<number[]>([]);
    const [shareCollectionIds, setShareCollectionIds] = useState<number[]>([]);
    const [editSelectedMembers, setEditSelectedMembers] = useState<number[]>([]);
    const [editSelectedUserId, setEditSelectedUserId] = useState<number | "">("");
    const [editMemberSearchQuery, setEditMemberSearchQuery] = useState("");
    const [selectedUserId, setSelectedUserId] = useState<number | "">("");
    const [memberSearchQuery, setMemberSearchQuery] = useState("");
    const [mounted, setMounted] = useState(false);
    const { mutate: shareNote, isPending: isSharing } = useShareNote();
    const { mutate: unshareNote, isPending: isUnsharing } = useUnshareNote();
    const userId = useAuthStore((state) => state.userId);
    const { data: tenantUsers = [] } = useTenantUsers();
    const { data: collections = [] } = useUserCollections();

    // Use shared permission hook
    const {
        canPerformNoteActions,
        isCollectionPrivate
    } = useNotePermissions(Number(collectionId));

    // Reset visibility if it's "shared" but collection is private
    useEffect(() => {
        if (editVisibility === "shared" && isCollectionPrivate && editDialogOpen) {
            setEditVisibility("private");
            setEditSelectedMembers([]);
            toast.warning("Collection is private. 'Collaborate' option is not available. Please make the collection 'Shared' first.");
        }
    }, [isCollectionPrivate, editVisibility, editDialogOpen]);

    // Filter out current user and already selected users for edit form
    const editAvailableUsers = tenantUsers.filter(
        (user) =>
            user.id !== userId &&
            !editSelectedMembers.includes(user.id) &&
            (editMemberSearchQuery === "" ||
                (user.full_name?.toLowerCase().includes(editMemberSearchQuery.toLowerCase()) ||
                    user.email.toLowerCase().includes(editMemberSearchQuery.toLowerCase())))
    );

    const handleEditAddMember = () => {
        if (!editSelectedUserId) return;
        setEditSelectedMembers([...editSelectedMembers, Number(editSelectedUserId)]);
        setEditSelectedUserId("");
        setEditMemberSearchQuery("");
    };

    const handleEditRemoveMember = (userId: number) => {
        setEditSelectedMembers(editSelectedMembers.filter((id) => id !== userId));
    };

    // Filter out current user and already selected users, and filter by search query
    const availableUsers = tenantUsers.filter(
        (user) =>
            user.id !== userId &&
            !shareUserIds.includes(user.id) &&
            (memberSearchQuery === "" ||
                (user.full_name?.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                    user.email.toLowerCase().includes(memberSearchQuery.toLowerCase())))
    );

    const handleAddMember = () => {
        if (!selectedUserId) return;
        setShareUserIds([...shareUserIds, Number(selectedUserId)]);
        setSelectedUserId("");
        setMemberSearchQuery("");
    };

    const handleRemoveMember = (userId: number) => {
        setShareUserIds(shareUserIds.filter((id) => id !== userId));
    };

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
            // If collection is private and note visibility is "shared", reset to "private"
            const noteVisibility = note.visibility || "private";
            if (noteVisibility === "shared" && isCollectionPrivate) {
                setEditVisibility("private");
                toast.warning("Note visibility was set to 'Only Me' because the collection is private. Please make the collection 'Shared' first to enable collaboration.");
            } else {
                setEditVisibility(noteVisibility);
            }
            // Pre-populate selected members from shared_members if available
            if (note.shared_members && note.shared_members.length > 0) {
                setEditSelectedMembers(note.shared_members.map((m: any) => m.user_id));
            } else {
                setEditSelectedMembers([]);
            }
        }
    }, [note, isCollectionPrivate]);

    // Open edit dialog if ?edit=true is in URL
    useEffect(() => {
        if (searchParams.get("edit") === "true" && (note?.is_owner || canPerformNoteActions) && !editDialogOpen) {
            setEditDialogOpen(true);
            // Remove the query param from URL without navigation
            router.replace(`/dashboard/workspaces/${workspaceId}/collections/${collectionId}/notes/${noteId}`);
        }
    }, [searchParams, note, workspaceId, collectionId, noteId, router, editDialogOpen]);

    const handleEditSubmit = async (e: React.FormEvent) => {
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
                visibility: editVisibility,
            },
            {
                onSuccess: async (res) => {
                    if (res?.status) {
                        // If visibility is "shared" (Collaborate) and there are members, share the note with them
                        if (editVisibility === "shared" && editSelectedMembers.length > 0) {
                            try {
                                await new Promise<void>((resolve, reject) => {
                                    shareNote(
                                        {
                                            noteId: noteId,
                                            payload: {
                                                user_ids: editSelectedMembers,
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
                                toast.success("Note updated and shared with members successfully!");
                            } catch (err: any) {
                                toast.warning("Note updated but some members could not be added. You can share it manually.");
                            }
                        } else {
                            toast.success(res.message || "Note updated successfully!");
                        }

                        setEditDialogOpen(false);
                        setEditSelectedMembers([]);
                        setEditSelectedUserId("");
                        setEditMemberSearchQuery("");
                        // Refetch note to get updated data
                        window.location.reload();
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
                <nav className="sticky top-0 w-[90%] mx-auto self-center flex justify-between items-center bg-background border-b border-border py-5">
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/dashboard/workspaces/${workspaceId}/collections/${collectionId}/notes`)}
                    >
                        <FaArrowLeft className="mr-2" /> Back to Articles
                    </Button>

                    <div className="flex gap-2">
                        {(note?.is_owner || canPerformNoteActions) && (
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
                        {(note?.is_owner || canPerformNoteActions) && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    if (isCollectionPrivate) {
                                        toast.error("Cannot share note. The collection is private. Please make the collection 'Shared' first to enable sharing.");
                                        return;
                                    }
                                    // Pre-populate selected members from shared_members if available
                                    if (note.shared_members && note.shared_members.length > 0) {
                                        setShareUserIds(note.shared_members.map((m: any) => m.user_id));
                                    } else {
                                        setShareUserIds([]);
                                    }
                                    setShareDialogOpen(true);
                                }}
                            >
                                Share
                            </Button>
                        )}
                        {(note?.is_owner || canPerformNoteActions) && (
                            <Button onClick={() => {
                                if (note) {
                                    setEditTitle(note.title);
                                    setEditContent(note.content);
                                    // If collection is private and note visibility is "shared", reset to "private"
                                    const noteVisibility = note.visibility || "private";
                                    if (noteVisibility === "shared" && isCollectionPrivate) {
                                        setEditVisibility("private");
                                        toast.warning("Note visibility was set to 'Only Me' because the collection is private. Please make the collection 'Shared' first to enable collaboration.");
                                    } else {
                                        setEditVisibility(noteVisibility);
                                    }
                                    // Pre-populate selected members from shared_members if available
                                    if (note.shared_members && note.shared_members.length > 0) {
                                        setEditSelectedMembers(note.shared_members.map((m: any) => m.user_id));
                                    } else {
                                        setEditSelectedMembers([]);
                                    }
                                }
                                setEditDialogOpen(true);
                            }}>
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
                                </div>
                                <div className="flex gap-2">
                                    {note.is_pinned && <Badge>Pinned</Badge>}
                                    {note.is_trained && (
                                        <Badge className="bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 text-white border-0">
                                            <FaBrain className="mr-1" size={10} /> Trained
                                        </Badge>
                                    )}
                                    {note.visibility && (
                                        <Badge variant={note.visibility === "private" ? "secondary" : note.visibility === "public" ? "default" : "outline"}>
                                            {note.visibility === "private" ? "Only Me" : note.visibility === "public" ? "All" : "Collaborate"}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <CardDescription>
                                Created {formatDateTime(note.created_at || "")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                                {note.content}
                            </div>

                            {(note.is_owner || canPerformNoteActions) && note.shared_members && note.shared_members.length > 0 && (
                                <div className="mt-6 pt-6 border-t">
                                    <h4 className="text-sm font-medium mb-3">Shared With</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {note.shared_members.map((member) => (
                                            <Badge key={member.id} variant="secondary" className="flex items-center gap-2">
                                                {member.user_name || member.user_email}
                                                <button
                                                    onClick={() => {
                                                        unshareNote(
                                                            { noteId: note.id, userId: member.user_id },
                                                            {
                                                                onSuccess: () => {
                                                                    toast.success("User removed from sharing");
                                                                    window.location.reload();
                                                                },
                                                                onError: () => {
                                                                    toast.error("Failed to remove user");
                                                                },
                                                            }
                                                        );
                                                    }}
                                                    className="ml-1 hover:text-red-500"
                                                >
                                                    <FaTimes size={10} />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Edit Dialog */}
                <AlertDialog
                    open={editDialogOpen}
                    onOpenChange={(isOpen) => {
                        setEditDialogOpen(isOpen);
                        if (!isOpen) {
                            setEditSelectedMembers([]);
                            setEditSelectedUserId("");
                            setEditMemberSearchQuery("");
                        }
                    }}
                >
                    <AlertDialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                        <AlertDialogHeader className="flex-shrink-0">
                            <AlertDialogTitle>Edit Note</AlertDialogTitle>
                            <AlertDialogDescription>
                                Update the title and content of your note.
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <form onSubmit={handleEditSubmit} className="flex flex-col flex-1 min-h-0">
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
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
                                    <Label htmlFor="edit-visibility">Visibility</Label>
                                    <Select
                                        value={editVisibility}
                                        onValueChange={(value: "private" | "public" | "shared") => {
                                            if (value === "shared" && isCollectionPrivate) {
                                                toast.error("Cannot use 'Collaborate' option. The collection is private. Please make the collection 'Shared' first to enable collaboration on notes.");
                                                return;
                                            }
                                            setEditVisibility(value);
                                        }}
                                    >
                                        <SelectTrigger id="edit-visibility">
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
                                        {editVisibility === "private" && "Only you can see and access this note"}
                                        {editVisibility === "shared" && "Share this note with specific people. They will only see this note, not other notes in the collection."}
                                        {editVisibility === "public" && "Anyone in your organization can view and edit this note"}
                                    </p>
                                    {isCollectionPrivate && (
                                        <p className="text-xs text-amber-600 dark:text-amber-500 mt-1 flex items-center gap-1">
                                            <span>⚠️</span>
                                            <span>To use "Collaborate" option, the collection must be set to "Shared". Please update the collection visibility first.</span>
                                        </p>
                                    )}
                                </div>

                                {/* Member Selection Section - Only show when visibility is "shared" (Collaborate) and collection is not private */}
                                {editVisibility === "shared" && !isCollectionPrivate && (
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
                                                    value={editMemberSearchQuery}
                                                    onChange={(e) => setEditMemberSearchQuery(e.target.value)}
                                                    className="pl-9"
                                                />
                                            </div>
                                            <Select
                                                value={editSelectedUserId.toString()}
                                                onValueChange={(value) => setEditSelectedUserId(value === "" ? "" : Number(value))}
                                            >
                                                <SelectTrigger className="w-[200px]">
                                                    <SelectValue placeholder="Select user" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {editAvailableUsers.length === 0 ? (
                                                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                            {editMemberSearchQuery ? "No users found" : "No users available"}
                                                        </div>
                                                    ) : (
                                                        editAvailableUsers.map((user) => (
                                                            <SelectItem key={user.id} value={user.id.toString()}>
                                                                {user.full_name || user.email}
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                type="button"
                                                onClick={handleEditAddMember}
                                                disabled={!editSelectedUserId}
                                                size="sm"
                                                className="shrink-0"
                                            >
                                                <UserPlus className="w-4 h-4 mr-1" />
                                                Add
                                            </Button>
                                        </div>

                                        {/* Members List */}
                                        {editSelectedMembers.length > 0 && (
                                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                                {editSelectedMembers.map((memberId) => {
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
                                                                onClick={() => handleEditRemoveMember(memberId)}
                                                                className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {editSelectedMembers.length === 0 && (
                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                No members added yet. Search and add members to collaborate on this note.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <AlertDialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
                                <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
                                <Button type="submit" disabled={isUpdating}>
                                    {isUpdating ? "Saving..." : "Save Changes"}
                                </Button>
                            </AlertDialogFooter>
                        </form>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Share Dialog */}
                <AlertDialog
                    open={shareDialogOpen}
                    onOpenChange={(isOpen) => {
                        setShareDialogOpen(isOpen);
                        if (!isOpen) {
                            setShareUserIds([]);
                            setShareCollectionIds([]);
                            setSelectedUserId("");
                            setMemberSearchQuery("");
                        }
                    }}
                >
                    <AlertDialogContent className="max-w-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Share Note - Collaborate</AlertDialogTitle>
                            <AlertDialogDescription>
                                {isCollectionPrivate ? (
                                    <span className="text-amber-600 dark:text-amber-500">
                                        ⚠️ Cannot share note. The collection is private. Please make the collection 'Shared' first to enable sharing.
                                    </span>
                                ) : (
                                    "Add members who can view and collaborate on this note. They will only see this note, not other notes in the collection."
                                )}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        {!isCollectionPrivate ? (
                            <div className="space-y-4">
                                {/* Add Member Section */}
                                <div>
                                    <Label className="text-base font-semibold mb-2 block">Add Members</Label>
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
                                            disabled={!selectedUserId || isSharing}
                                            size="sm"
                                            className="shrink-0"
                                        >
                                            <UserPlus className="w-4 h-4 mr-1" />
                                            Add
                                        </Button>
                                    </div>
                                </div>

                                {/* Members List */}
                                {shareUserIds.length > 0 && (
                                    <div className="space-y-2 max-h-60 overflow-y-auto border-t pt-4">
                                        <Label className="text-base font-semibold mb-2 block">Selected Members</Label>
                                        {shareUserIds.map((memberId) => {
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

                                {shareUserIds.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No members added yet. Search and add members to collaborate on this note.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="py-4">
                                <p className="text-sm text-amber-600 dark:text-amber-500 text-center">
                                    Please make the collection 'Shared' first to enable collaboration on notes.
                                </p>
                            </div>
                        )}
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isSharing}>Cancel</AlertDialogCancel>
                            {!isCollectionPrivate && (
                                <Button
                                    onClick={() => {
                                        if (!noteId) return;
                                        shareNote(
                                            {
                                                noteId: noteId,
                                                payload: {
                                                    user_ids: shareUserIds.length > 0 ? shareUserIds : undefined,
                                                    collection_ids: shareCollectionIds.length > 0 ? shareCollectionIds : undefined,
                                                },
                                            },
                                            {
                                                onSuccess: (res) => {
                                                    if (res?.status) {
                                                        toast.success(res.data.message || "Note shared successfully!");
                                                        setShareDialogOpen(false);
                                                        setShareUserIds([]);
                                                        setShareCollectionIds([]);
                                                        setSelectedUserId("");
                                                        setMemberSearchQuery("");
                                                        window.location.reload();
                                                    } else {
                                                        toast.error(res?.message || "Could not share note.");
                                                    }
                                                },
                                                onError: (err: unknown) => {
                                                    const error = err as { message?: string };
                                                    toast.error(error?.message || "Request failed, please try again.");
                                                },
                                            }
                                        );
                                    }}
                                    disabled={isSharing || shareUserIds.length === 0}
                                >
                                    {isSharing ? "Sharing..." : "Share"}
                                </Button>
                            )}
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </RequireAuth>
    );
}

