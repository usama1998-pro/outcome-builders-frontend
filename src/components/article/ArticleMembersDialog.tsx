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
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FaTimes } from "react-icons/fa";

interface Member {
    id: number;
    user_id: number;
    user_name?: string;
    user_email?: string;
}

interface User {
    id: number;
    email: string;
    full_name?: string;
}

interface ArticleMembersDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    members: Member[];
    tenantUsers: User[];
    onRemoveMember: (userId: number) => void;
    isRemoving?: boolean;
}

export default function ArticleMembersDialog({
    open,
    onOpenChange,
    members,
    tenantUsers,
    onRemoveMember,
    isRemoving = false,
}: ArticleMembersDialogProps) {
    const [searchQuery, setSearchQuery] = useState("");

    // Reset search when dialog closes
    useEffect(() => {
        if (!open) {
            setSearchQuery("");
        }
    }, [open]);

    // Filter members based on search query
    const filteredMembers = members.filter((member) => {
        if (!searchQuery) return true;
        const searchLower = searchQuery.toLowerCase();
        const userName = member.user_name?.toLowerCase() || "";
        const userEmail = member.user_email?.toLowerCase() || "";
        return userName.includes(searchLower) || userEmail.includes(searchLower);
    });

    // Get full user details for each member
    const membersWithDetails = filteredMembers.map((member) => {
        const user = tenantUsers.find((u) => u.id === member.user_id);
        const fullName = user?.full_name || member.user_name || null;
        const email = user?.email || member.user_email || `User ${member.user_id}`;
        return {
            ...member,
            full_name: fullName,
            email: email,
            displayName: fullName || email,
        };
    });

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle>Collaborate Members</AlertDialogTitle>
                    <AlertDialogDescription>
                        Members who can view and collaborate on this article.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search members by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {/* Members List */}
                    {membersWithDetails.length > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {membersWithDetails.map((member) => (
                                <Badge
                                    key={member.id}
                                    variant="secondary"
                                    className="flex items-center justify-between w-full p-2"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {member.displayName}
                                        </p>
                                        {member.full_name && member.email && (
                                            <p className="text-xs text-muted-foreground truncate">
                                                {member.email}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => onRemoveMember(member.user_id)}
                                        disabled={isRemoving}
                                        className="ml-2 hover:text-destructive transition-colors"
                                        type="button"
                                    >
                                        <FaTimes size={12} />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            {searchQuery ? (
                                <p>No members found matching "{searchQuery}"</p>
                            ) : (
                                <p>No members added yet</p>
                            )}
                        </div>
                    )}
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel>Close</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

