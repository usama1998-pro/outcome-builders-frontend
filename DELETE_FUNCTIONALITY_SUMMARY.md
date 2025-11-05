# Delete Functionality for Workspaces & Collections

## Summary

Added complete delete functionality for both Workspaces and Collections with dropdown menus on the 3-dot icons.

---

## Features Implemented

### ✅ Backend (Python/FastAPI)

#### Workspace Delete
- **Endpoint**: `DELETE /api/v1/workspace/delete/{workspace_id}`
- **Authorization**: Only workspace owners can delete
- **Cascade**: Deletes workspace members automatically
- **Validation**: Checks user membership and role before deletion

#### Collection Delete
- **Endpoint**: `DELETE /api/v1/collection/delete/{collection_id}`
- **Authorization**: Only collection owners can delete
- **Cascade**: Deletes collection members and notes automatically
- **Validation**: Multi-tenant aware with schema isolation

### ✅ Frontend (Next.js/React)

#### UI Components
- **Dropdown Menu**: Added to 3-dot icon with delete option
- **Confirmation Dialog**: AlertDialog asks for confirmation before deletion
- **Toast Notifications**: Success/error messages after deletion
- **Loading States**: Shows "Deleting..." during API call
- **Auto Refresh**: List automatically updates after deletion

#### Delete Hooks
- `useDeleteUserWorkspace()` - Workspace deletion with cache invalidation
- `useDeleteUserCollection()` - Collection deletion with cache invalidation

---

## How to Use

### Delete a Workspace

1. Navigate to `/dashboard/workspaces`
2. Click the **3-dot icon** on any workspace card
3. Click "**Delete Workspace**" in the dropdown
4. Confirm deletion in the dialog
5. Workspace is deleted and list refreshes automatically

### Delete a Collection

1. Navigate to `/dashboard/workspaces/{workspaceId}/collections`
2. Click the **3-dot icon** on any collection card
3. Click "**Delete Collection**" in the dropdown
4. Confirm deletion in the dialog
5. Collection is deleted and list refreshes automatically

---

## Files Modified

### Backend Files

1. **`app/api/workspace/v1/controllers.py`**
   - Added `DELETE /delete/{workspace_id}` endpoint
   - Imported `delete_workspace_service`

2. **`app/api/workspace/v1/services.py`**
   - Added `delete_workspace_service()` function
   - Validates user is workspace owner
   - Handles cascade deletion

3. **`app/api/collection/v1/controllers.py`**
   - Added `DELETE /delete/{collection_id}` endpoint
   - Imported `delete_collection_service`

4. **`app/api/collection/v1/services.py`**
   - Added `delete_collection_service()` function
   - Validates user is collection owner
   - Multi-tenant schema support

### Frontend Files

1. **`src/lib/routes.ts`**
   - Added `workspace.delete(id)` route
   - Added `collection.delete(id)` route

2. **`src/hooks/useWorkspace.ts`**
   - Added `deleteUserWorkspace()` function
   - Added `useDeleteUserWorkspace()` hook
   - Auto-invalidates query cache

3. **`src/hooks/useCollection.ts`**
   - Added `deleteUserCollection()` function
   - Added `useDeleteUserCollection()` hook
   - Auto-invalidates query cache

4. **`src/components/List/WorkSpaces/WorkSpacesList.tsx`**
   - Added dropdown menu with delete option
   - Added delete confirmation dialog
   - Added delete state management
   - Integrated toast notifications

5. **`src/components/List/Collection/CollectionList.tsx`**
   - Added dropdown menu with delete option
   - Added delete confirmation dialog
   - Added delete state management
   - Integrated toast notifications

---

## Technical Details

### Backend Authorization Flow

```python
async def delete_workspace_service(
    session: AsyncSession,
    workspace_id: int,
    user: User
):
    # 1. Check if user is a member
    member = await get_member(workspace_id, user.id)
    
    # 2. Verify user is owner
    if member.role != "owner":
        raise HTTPException(status_code=403, detail="Only owners can delete")
    
    # 3. Delete workspace (cascade deletes members)
    await session.execute(delete(Workspace).where(Workspace.id == workspace_id))
    await session.commit()
```

### Frontend Delete Flow

```typescript
// 1. User clicks 3-dot menu → Delete option
handleDeleteClick(workspaceId, e)

// 2. Confirmation dialog opens
setDeleteDialogOpen(true)

// 3. User confirms
deleteWorkspace(workspaceId, {
  onSuccess: (res) => {
    toast.success("Deleted!")
    // Query cache automatically invalidates
  },
  onError: (err) => {
    toast.error("Failed to delete")
  }
})

// 4. List automatically refreshes (React Query)
```

---

## UI Components Used

### Dropdown Menu
```tsx
<DropdownMenu>
  <DropdownMenuTrigger>
    <BsThreeDotsVertical />
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={handleDeleteClick}>
      <FaTrash className="mr-2" />
      Delete Workspace
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Confirmation Dialog
```tsx
<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure? This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={confirmDelete}>
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Security Features

### ✅ Backend Security
- **Role-based authorization** - Only owners can delete
- **Membership verification** - User must be a member
- **Multi-tenant isolation** - Collections use tenant schema
- **404 on unauthorized** - Returns "not found" if no access
- **403 on forbidden** - Returns "forbidden" if not owner

### ✅ Frontend Security
- **Confirmation required** - No accidental deletions
- **Loading state** - Prevents double-clicks
- **Error handling** - Displays backend error messages
- **Auto-refresh** - Ensures UI is in sync

---

## Error Handling

### Backend Errors

```python
# User not found
raise HTTPException(
    status_code=404,
    detail="Workspace not found or you don't have access"
)

# Not owner
raise HTTPException(
    status_code=403,
    detail="Only workspace owners can delete workspaces"
)

# Database error
raise HTTPException(
    status_code=400,
    detail=f"Database error: {str(e)}"
)
```

### Frontend Error Handling

```typescript
onError: (err: any) => {
  // Extract error message from response
  const message = err?.response?.data?.detail || "Failed to delete";
  toast.error(message);
}
```

---

## Testing Checklist

### Workspace Delete
- [ ] Click 3-dot menu on workspace card
- [ ] Dropdown menu appears
- [ ] Click "Delete Workspace"
- [ ] Confirmation dialog appears
- [ ] Click "Cancel" - dialog closes, nothing deleted
- [ ] Click "Delete" - workspace is deleted
- [ ] Success toast appears
- [ ] Workspace list refreshes
- [ ] Workspace is gone from list
- [ ] Can delete another workspace

### Collection Delete
- [ ] Navigate to workspace collections
- [ ] Click 3-dot menu on collection card
- [ ] Dropdown menu appears
- [ ] Click "Delete Collection"
- [ ] Confirmation dialog appears
- [ ] Click "Cancel" - dialog closes, nothing deleted
- [ ] Click "Delete" - collection is deleted
- [ ] Success toast appears
- [ ] Collection list refreshes
- [ ] Collection is gone from list
- [ ] Can delete another collection

### Error Scenarios
- [ ] Try to delete workspace you don't own (403)
- [ ] Try to delete non-existent workspace (404)
- [ ] Backend offline - shows error toast
- [ ] Multiple rapid clicks - handled by loading state

---

## API Endpoints

### Workspace

```bash
# Delete workspace
DELETE /api/v1/workspace/delete/{workspace_id}

Headers:
  Authorization: Bearer <token>

Response:
{
  "status": true,
  "message": "Workspace deleted successfully!",
  "data": {
    "message": "Workspace deleted successfully"
  }
}
```

### Collection

```bash
# Delete collection
DELETE /api/v1/collection/delete/{collection_id}

Headers:
  Authorization: Bearer <token>
  x-tenant: <tenant_id>

Response:
{
  "status": true,
  "message": "Collection deleted successfully!",
  "data": {
    "message": "Collection deleted successfully"
  }
}
```

---

## Benefits

### User Experience
- ✅ Intuitive dropdown menu on 3-dot icon
- ✅ Clear confirmation dialog prevents accidents
- ✅ Immediate visual feedback with toast
- ✅ Automatic list refresh
- ✅ Loading states during deletion

### Code Quality
- ✅ Reusable delete pattern
- ✅ Consistent with create functionality
- ✅ Proper error handling
- ✅ Type-safe TypeScript
- ✅ React Query cache management

### Security
- ✅ Backend authorization checks
- ✅ Role-based access control
- ✅ Multi-tenant isolation
- ✅ Cascade deletion handled safely

---

## Next Steps (Optional Enhancements)

1. **Soft Delete**: Archive instead of permanently delete
2. **Bulk Delete**: Select multiple items to delete
3. **Undo**: Allow undo within time window
4. **Recycle Bin**: Move to trash before permanent deletion
5. **Delete History**: Log who deleted what and when
6. **Edit Option**: Add "Edit" to dropdown menu
7. **Share Option**: Add "Share" to dropdown menu
8. **Duplicate**: Add "Duplicate" option

---

## Summary

✅ **Complete delete functionality implemented**
- Backend endpoints with proper authorization
- Frontend dropdown menus on 3-dot icons
- Confirmation dialogs to prevent accidents
- Toast notifications for feedback
- Automatic list refresh after deletion
- Proper error handling
- Security checks (owner-only deletion)

**Ready to use! Test by deleting workspaces and collections.**

