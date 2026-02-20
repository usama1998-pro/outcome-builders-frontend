import { useUserPermissions, PERMISSIONS } from "./useUserPermissions";
import { useCollectionMembers, useUserCollections } from "./useCollection";
import { useAuthStore } from "../store/useAuth";
import { useEffect } from "react";

/**
 * Shared hook for checking note/article permissions
 * This ensures consistent permission logic across all note/article pages
 */
export function useNotePermissions(collectionId?: number) {
    const userId = useAuthStore((state) => state.userId);
    const { hasAnyPermission, isOwnerOrAdmin, isLoading: permissionsLoading, permissions, data: permissionsData, refetch: refetchPermissions } = useUserPermissions();
    const { data: collections = [] } = useUserCollections();
    
    // Get current collection if collectionId is provided
    const currentCollection = collectionId 
        ? collections.find((col) => col.id === Number(collectionId))
        : null;
    
    const isCollectionPrivate = currentCollection?.visibility === "private";
    const isCollectionShared = currentCollection?.visibility === "shared";
    
    // Fetch collection members if collectionId is provided
    const { data: collectionMembers = [] } = useCollectionMembers(collectionId || 0);
    
    // Check if user has ANY note-related permission (create, edit, delete, view, train)
    const notePermissions = [
        PERMISSIONS.NOTE_CREATE,
        PERMISSIONS.NOTE_EDIT,
        PERMISSIONS.NOTE_DELETE,
        PERMISSIONS.NOTE_VIEW,
        PERMISSIONS.NOTE_TRAIN,
    ];
    const hasAnyNotePermission = hasAnyPermission(notePermissions);
    
    // Check if user is a collection member (any role for shared collections)
    const isCollectionMember = collectionId 
        ? collectionMembers.some((member) => member.user_id === userId)
        : false;
    
    // Check if user is a collection member with editor or owner role
    const isCollectionEditorOrOwner = collectionId
        ? collectionMembers.some(
              (member) => member.user_id === userId && (member.role === "editor" || member.role === "owner")
          )
        : false;
    
    // Check if user is the collection owner
    const isCollectionOwner = currentCollection?.createdBy === String(userId);
    
    // User can perform note actions ONLY if:
    // 1. They have ANY note-related permission (REQUIRED for members) OR
    // 2. They are owner/admin (bypasses permission check)
    // 
    // Note: Collection membership alone is NOT sufficient - users MUST have note permissions assigned
    // This ensures that permission changes in roles take effect immediately
    // Owner/admin can always perform actions regardless of permissions
    const canPerformNoteActions = !permissionsLoading && (
        hasAnyNotePermission || 
        isOwnerOrAdmin
    );
    
    // Debug logging - enabled to troubleshoot permission issues
    useEffect(() => {
        if (!permissionsLoading) {
            console.log("=== Note Permissions Debug ===");
            console.log("Collection ID:", collectionId);
            console.log("User ID:", userId);
            console.log("Permissions Loading:", permissionsLoading);
            console.log("Permissions Data:", permissionsData);
            console.log("All User Permissions Array:", permissions);
            console.log("Note Permissions Check:", notePermissions);
            console.log("Has Any Note Permission:", hasAnyNotePermission);
            console.log("Is Owner/Admin:", isOwnerOrAdmin);
            console.log("Can Perform Actions:", canPerformNoteActions);
            if (permissions && permissions.length > 0) {
                notePermissions.forEach(perm => {
                    const hasPerm = permissions.includes(perm);
                    console.log(`  - Has "${perm}":`, hasPerm);
                });
            } else {
                console.log("  - No permissions array or empty permissions");
            }
        }
    }, [permissionsLoading, permissions, permissionsData, hasAnyNotePermission, isOwnerOrAdmin, canPerformNoteActions, collectionId, userId, notePermissions]);
    
    // Alias for consistency
    const canCreateNote = canPerformNoteActions;
    
    return {
        canPerformNoteActions,
        canCreateNote,
        hasAnyNotePermission,
        isOwnerOrAdmin,
        isCollectionMember,
        isCollectionEditorOrOwner,
        isCollectionOwner,
        isCollectionPrivate,
        isCollectionShared,
        permissionsLoading,
        permissions,
        notePermissions,
        refetchPermissions, // Expose refetch function to manually refresh permissions
    };
}

