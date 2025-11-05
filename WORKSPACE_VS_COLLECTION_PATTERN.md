# Workspace vs Collection Pattern Comparison

This document shows the **exact pattern** used for both features, demonstrating consistency in implementation.

---

## 1. Custom Hooks Pattern

### Workspaces (`useWorkspace.ts`)
```typescript
export function useUserWorkspaces() {
    const { data, isLoading, isError, error } = useQuery<WorkSpaceList[], Error>({
        queryKey: ["userWorkspaces"],
        queryFn: fetchUserWorkspaces,
    });
    return { data, isLoading, isError, error };
}

export function useCreateUserWorkspace() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createUserWorkspace,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["userWorkspaces"] });
        },
    });
}
```

### Collections (`useCollection.ts`)
```typescript
export function useUserCollections() {
    const { data, isLoading, isError, error, refetch } = useQuery<Collections[], Error>({
        queryKey: ["userCollections"],
        queryFn: fetchUserCollections,
    });
    return { data, isLoading, isError, error, refetch };
}

export function useCreateUserCollection() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createUserCollection,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["userCollections"] });
        },
    });
}
```

**Pattern:** Identical structure with different query keys and function names.

---

## 2. Page Component Pattern

### Workspaces Page
```typescript
export default function DashboardWorkspace() {
    const { mutate: createWorkspace, isPending } = useCreateUserWorkspace();
    const [open, setOpen] = useState(false);

    const form = useForm<CreateWorkspaceFormValues>({
        resolver: zodResolver(createWorkspaceSchema),
        defaultValues: { name: "" },
    });

    const onSubmit = (values: CreateWorkspaceFormValues) => {
        createWorkspace(values.name, {
            onSuccess: (res) => {
                if (res?.status) {
                    toast.success(res.message);
                    form.reset();
                    setOpen(false);
                } else {
                    toast.error(res?.message);
                }
            },
            onError: (err: any) => {
                toast.error(err?.message);
            },
        });
    };

    return (
        // UI with AlertDialog form
    );
}
```

### Collections Page
```typescript
export default function WorkspacePage() {
    const { data: collections, isLoading, isError, error, refetch } = useUserCollections();
    const { mutate: createCollection, isPending } = useCreateUserCollection();
    const [open, setOpen] = useState(false);

    const form = useForm<CreateCollectionFormValues>({
        resolver: zodResolver(createCollectionSchema),
        defaultValues: { name: "", description: "", visibility: "private" },
    });

    const onSubmit = (values: CreateCollectionFormValues) => {
        createCollection({...values, workspace_id: Number(workspaceId)}, {
            onSuccess: (res) => {
                if (res?.status) {
                    toast.success(res.message);
                    form.reset();
                    setOpen(false);
                    refetch();
                } else {
                    toast.error(res?.message);
                }
            },
            onError: (err: any) => {
                toast.error(err?.message);
            },
        });
    };

    return (
        // UI with AlertDialog form
    );
}
```

**Pattern:** Same structure, same form handling, same toast notifications.

---

## 3. List Component Pattern

### WorkSpacesList
```typescript
export default function WorkSpacesList() {
    const { data: workspaceData, isLoading, isError, error } = useUserWorkspaces()

    return (
        <div className="w-full h-full flex flex-row flex-wrap gap-5">
            {isLoading && <BlocksLoader />}
            {isError && <ErrorCard message={error?.message} />}
            {workspaceData && workspaceData.map((workspace, key) => (
                <Link href={`/dashboard/workspaces/${workspace.id}/collections`}>
                    <Card>
                        <CardHeader>
                            <CardTitle>{workspace.title}</CardTitle>
                            <CardDescription>{formatDateTime(workspace.createdAt)}</CardDescription>
                        </CardHeader>
                        {/* ... */}
                    </Card>
                </Link>
            ))}
        </div>
    );
}
```

### CollectionList
```typescript
export function CollectionList({ collections, workspace }: CollectionListProps) {
    return (
        <div className="w-full h-full flex flex-row flex-wrap gap-5">
            {collections.map((collection, key) => (
                <Link href={`/dashboard/workspaces/${workspace.id}/collections/${collection.id}/notes`}>
                    <Card>
                        <CardHeader>
                            <CardTitle>{collection.title}</CardTitle>
                            <CardDescription>{formatDateTime(collection.createdAt)}</CardDescription>
                        </CardHeader>
                        {/* ... */}
                    </Card>
                </Link>
            ))}
        </div>
    );
}
```

**Pattern:** Same card layout, same styling, same navigation pattern.

---

## 4. Backend Service Pattern

### Workspace Service
```python
async def create_workspace_service(
    session: AsyncSession,
    payload: WorkspaceCreateRequest,
    current_user: User,
    tenant: Tenant
):
    schema_name = tenant.schema_name
    Workspace.with_schema(schema_name)
    WorkspaceMember.with_schema(schema_name)

    workspace = Workspace(
        name=payload.name,
        owner_id=int(current_user.id)
    )
    session.add(workspace)
    await session.flush()

    member = WorkspaceMember(
        user_id=int(workspace.owner_id),
        workspace_id=workspace.id,
        role="owner"
    )
    session.add(member)
    await session.commit()
    return {"message": "workspace created!"}
```

### Collection Service
```python
async def create_collection_service(
    session: AsyncSession,
    payload: CollectionCreateRequest,
    current_user: User,
    tenant: Tenant
):
    schema_name = tenant.schema_name
    Collection.with_schema(schema_name)
    CollectionMember.with_schema(schema_name)

    collection = Collection(
        name=payload.name,
        description=payload.description or "",
        visibility=payload.visibility,
        owner_id=int(current_user.id),
        workspace_id=payload.workspace_id
    )
    session.add(collection)
    await session.flush()

    member = CollectionMember(
        user_id=int(collection.owner_id),
        collection_id=collection.id,
        role="owner"
    )
    session.add(member)
    await session.commit()
    return {"message": "collection created!"}
```

**Pattern:** Same multi-tenant schema handling, same member creation, same transaction management.

---

## 5. API Response Pattern

### Both Features Use:
```typescript
interface ApiResponse {
    status: boolean;
    message: string;
    data: any;
    pagination: number | null;
}
```

**Pattern:** Consistent API response structure across all endpoints.

---

## 6. Form Validation Pattern

### Workspaces
```typescript
const createWorkspaceSchema = z.object({
    name: z.string().min(1, "Name is required").max(100, "Name is too long"),
});
```

### Collections
```typescript
const createCollectionSchema = z.object({
    name: z.string().min(1, "Name is required").max(100, "Name is too long"),
    description: z.string().max(500, "Description is too long").optional(),
    visibility: z.enum(["private", "public", "shared"]).default("private"),
});
```

**Pattern:** Same Zod validation approach with descriptive error messages.

---

## 7. UI Component Pattern

Both use:
- ✅ Same AlertDialog for forms
- ✅ Same Button components
- ✅ Same Card components for display
- ✅ Same Breadcrumb navigation
- ✅ Same Input/Label components
- ✅ Same error/loading states
- ✅ Same toast notifications (sonner)

---

## Benefits of This Pattern

1. **Consistency**: Developers can predict code structure
2. **Maintainability**: Easy to fix bugs across features
3. **Scalability**: Easy to add new similar features (notes, tasks, etc.)
4. **Testing**: Same test patterns can be reused
5. **Learning Curve**: New developers understand the pattern quickly
6. **Code Reviews**: Easier to review with consistent patterns

---

## How to Extend This Pattern

When adding a new resource (e.g., Notes, Tasks, etc.):

1. **Backend**:
   - Create model in `app/models/`
   - Add schema in `app/api/<resource>/schema.py`
   - Create service in `app/api/<resource>/v1/services.py`
   - Add controller in `app/api/<resource>/v1/controllers.py`
   - Register router in `main.py`

2. **Frontend**:
   - Add type in `src/types/<resource>.ts`
   - Create hook in `src/hooks/use<Resource>.ts`
   - Create page in `src/app/dashboard/.../page.tsx`
   - Create list component in `src/components/List/<Resource>/`
   - Add routes in `src/lib/routes.ts`

3. **Follow the Pattern**:
   - Copy workspace or collection implementation
   - Replace resource names
   - Adjust fields as needed
   - Keep the same structure!

---

## Summary

The implementation demonstrates **excellent software engineering practices** by:
- Following DRY (Don't Repeat Yourself) principle
- Maintaining consistent patterns
- Using TypeScript for type safety
- Implementing proper error handling
- Using React Query for state management
- Following RESTful API design
- Implementing proper multi-tenancy

This pattern makes your codebase **professional, scalable, and maintainable**.

