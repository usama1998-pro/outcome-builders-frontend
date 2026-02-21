"use client";

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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, UserPlus, X, FolderOpen, Eye, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface User {
    id: number;
    email: string;
    full_name?: string;
}

interface Collection {
    id: number;
    name: string;
    visibility?: string;
}

interface ArticleSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    noteId: number | null;
    currentCollectionId: number;
    currentVisibility: "private" | "public" | "shared";
    currentMembers: number[];
    collections: Collection[];
    tenantUsers: User[];
    userId: number;
    isCollectionPrivate: boolean;
    onUpdate: (data: {
        collectionId?: number;
        visibility?: "private" | "public" | "shared";
        members?: number[];
    }) => Promise<void>;
    onMoveNote?: (noteId: number, targetCollectionId: number) => Promise<void>;
}

export default function ArticleSettingsDialog({
    open,
    onOpenChange,
    noteId,
    currentCollectionId,
    currentVisibility,
    currentMembers,
    collections,
    tenantUsers,
    userId,
    isCollectionPrivate,
    onUpdate,
    onMoveNote,
}: ArticleSettingsDialogProps) {
    const [selectedCollectionId, setSelectedCollectionId] = useState<string>(
        String(currentCollectionId)
    );
    const [visibility, setVisibility] = useState<"private" | "public" | "shared">(
        currentVisibility
    );
    const [selectedMembers, setSelectedMembers] = useState<number[]>(currentMembers);
    const [memberSearchQuery, setMemberSearchQuery] = useState("");
    const [selectedUserId, setSelectedUserId] = useState<number | "">("");
    const [isSaving, setIsSaving] = useState(false);

    // Reset form when dialog opens or props change
    useEffect(() => {
        if (open) {
            console.log("[ArticleSettingsDialog] Opening dialog with:", {
                currentCollectionId,
                currentVisibility,
                currentMembers,
            });
            setSelectedCollectionId(String(currentCollectionId));
            setVisibility(currentVisibility);
            setSelectedMembers(currentMembers);
            setMemberSearchQuery("");
            setSelectedUserId("");
        }
    }, [open, currentCollectionId, currentVisibility, currentMembers]);

    // Filter available users
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

    const handleRemoveMember = (memberId: number) => {
        setSelectedMembers(selectedMembers.filter((id) => id !== memberId));
    };

    const handleSave = async () => {
        if (!noteId) return;

        setIsSaving(true);
        try {
            const updates: {
                collectionId?: number;
                visibility?: "private" | "public" | "shared";
                members?: number[];
            } = {};

            // Check if collection changed
            const newCollectionId = Number(selectedCollectionId);
            if (newCollectionId !== currentCollectionId && onMoveNote) {
                await onMoveNote(noteId, newCollectionId);
                updates.collectionId = newCollectionId;
            }

            // Check if visibility changed
            if (visibility !== currentVisibility) {
                updates.visibility = visibility;
            }

            // Check if members changed
            const membersChanged =
                selectedMembers.length !== currentMembers.length ||
                selectedMembers.some((id) => !currentMembers.includes(id));
            if (membersChanged) {
                updates.members = selectedMembers;
            }

            // Only call onUpdate if there are actual changes
            if (Object.keys(updates).length > 0) {
                await onUpdate(updates);
            }

            toast.success("Article settings updated successfully!");
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error?.message || "Failed to update article settings");
        } finally {
            setIsSaving(false);
        }
    };

    const handleVisibilityChange = (value: "private" | "public" | "shared") => {
        if (value === "shared" && isCollectionPrivate) {
            toast.error(
                "Cannot use 'Collaborate' option. The collection is private. Please make the collection 'Shared' first."
            );
            return;
        }
        setVisibility(value);
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <AlertDialogHeader className="flex-shrink-0">
                    <AlertDialogTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Article Settings
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Manage collection, visibility, and collaboration settings for this article.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                    {/* Collection Selection */}
                    <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-base font-semibold">
                            <FolderOpen className="w-4 h-4" />
                            Collection
                        </Label>
                        <Select
                            value={selectedCollectionId}
                            onValueChange={setSelectedCollectionId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a collection" />
                            </SelectTrigger>
                            <SelectContent>
                                {collections.length === 0 ? (
                                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                        No collections available
                                    </div>
                                ) : (
                                    collections.map((collection) => (
                                        <SelectItem
                                            key={collection.id}
                                            value={String(collection.id)}
                                        >
                                            {collection.name}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Move this article to a different collection
                        </p>
                    </div>

                    <Separator />

                    {/* Visibility Selection */}
                    <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-base font-semibold">
                            <Eye className="w-4 h-4" />
                            Visibility
                        </Label>
                        <Select value={visibility} onValueChange={handleVisibilityChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select visibility" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="private">
                                    Only Me (Only visible to me)
                                </SelectItem>
                                <SelectItem
                                    value="shared"
                                    disabled={isCollectionPrivate}
                                    className={isCollectionPrivate ? "opacity-50 cursor-not-allowed" : ""}
                                >
                                    Collaborate (Specified people)
                                </SelectItem>
                                <SelectItem value="public">
                                    All (Anyone can edit)
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {visibility === "private" &&
                                "Only you can see and access this article"}
                            {visibility === "shared" &&
                                "Share this article with specific people. They will only see this article, not other articles in the collection."}
                            {visibility === "public" &&
                                "Anyone in your organization can view and edit this article"}
                        </p>
                        {isCollectionPrivate && (
                            <p className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1">
                                <span>⚠️</span>
                                <span>
                                    To use "Collaborate" option, the collection must be set to
                                    "Shared". Please update the collection visibility first.
                                </span>
                            </p>
                        )}
                    </div>

                    {/* Member Selection - Only show when visibility is "shared" */}
                    {visibility === "shared" && !isCollectionPrivate && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <Label className="flex items-center gap-2 text-base font-semibold">
                                    <UserPlus className="w-4 h-4" />
                                    Collaborate Members
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Add members who can view and collaborate on this article. They
                                    will only see this article, not other articles in the collection.
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
                                        onValueChange={(value) =>
                                            setSelectedUserId(value === "" ? "" : Number(value))
                                        }
                                    >
                                        <SelectTrigger className="w-[200px]">
                                            <SelectValue placeholder="Select user" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableUsers.length === 0 ? (
                                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                    {memberSearchQuery
                                                        ? "No users found"
                                                        : "No users available"}
                                                </div>
                                            ) : (
                                                availableUsers.map((user) => (
                                                    <SelectItem
                                                        key={user.id}
                                                        value={user.id.toString()}
                                                    >
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
                                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-muted/30">
                                        {selectedMembers.map((memberId) => {
                                            const member = tenantUsers.find((u) => u.id === memberId);
                                            if (!member) return null;
                                            return (
                                                <Badge
                                                    key={memberId}
                                                    variant="secondary"
                                                    className="flex items-center gap-2 w-fit"
                                                >
                                                    <span>{member.full_name || member.email}</span>
                                                    <button
                                                        onClick={() => handleRemoveMember(memberId)}
                                                        className="ml-1 hover:text-destructive"
                                                        type="button"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                )}

                                {selectedMembers.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg bg-muted/30">
                                        No members added yet. Search and add members to collaborate
                                        on this article.
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <AlertDialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
                    <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

