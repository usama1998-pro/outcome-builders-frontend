"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Quote, Undo, Redo, ArrowLeft, Save, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useUserCollections } from "@/src/hooks/useCollection";
import { useCreateNote, useUpdateNote, useNote } from "@/src/hooks/useNotes";
import { useBrainSpaceStore } from "@/src/store/useBrainSpace";
import { toast } from "sonner";
import RequireAuth from "@/src/components/auth/requireAuth";
import { useTenantUsers } from "@/src/hooks/useCollection";
import { useNotePermissions } from "@/src/hooks/useNotePermissions";
import { Search, UserPlus, X } from "lucide-react";
import { useAuthStore } from "@/src/store/useAuth";

export default function NewArticlePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { currentBrainSpaceId } = useBrainSpaceStore();
    const { data: collections = [] } = useUserCollections(currentBrainSpaceId);
    const { mutate: createNote, isPending: isCreating } = useCreateNote();
    const { mutate: updateNote, isPending: isUpdating } = useUpdateNote();
    const { data: tenantUsers = [] } = useTenantUsers();
    const userId = useAuthStore((state) => state.userId);

    // Get noteId from URL if editing
    const noteIdParam = searchParams.get("noteId");
    const editingNoteId = noteIdParam ? Number(noteIdParam) : null;
    
    // Fetch note data if editing
    const { data: existingNote, isLoading: isLoadingNote } = useNote(editingNoteId);
    
    const [title, setTitle] = useState("");
    const [selectedCollectionId, setSelectedCollectionId] = useState<string>(
        searchParams.get("collection_id") || ""
    );
    const [visibility, setVisibility] = useState<"private" | "public" | "shared">("private");
    const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | "">("");
    const [memberSearchQuery, setMemberSearchQuery] = useState("");
    const [noteId, setNoteId] = useState<number | null>(editingNoteId); // Track created note ID for updates
    const noteIdRef = useRef<number | null>(editingNoteId); // Ref to track latest noteId for callbacks
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [editorContentHash, setEditorContentHash] = useState("");
    const isSavingRef = useRef(false); // Prevent multiple simultaneous saves

    // Update noteId when URL param changes
    useEffect(() => {
        if (noteIdParam && Number(noteIdParam) !== noteId) {
            const newNoteId = Number(noteIdParam);
            setNoteId(newNoteId);
            noteIdRef.current = newNoteId;
        }
    }, [noteIdParam, noteId]);

    // Keep ref in sync with state
    useEffect(() => {
        noteIdRef.current = noteId;
    }, [noteId]);

    // Get collection permissions
    const collectionIdNum = selectedCollectionId ? Number(selectedCollectionId) : null;
    const { isCollectionPrivate } = useNotePermissions(collectionIdNum || 0);

    const editor = useEditor({
        extensions: [StarterKit],
        content: existingNote?.content || "<p>Start writing...</p>",
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: "focus:outline-none min-h-full p-4 text-foreground",
            },
        },
        onUpdate: ({ editor }) => {
            setHasUnsavedChanges(true);
            // Update content hash for autosave tracking
            const content = editor.getHTML();
            setEditorContentHash(content);
        },
    });

    // Load existing note data when editing
    useEffect(() => {
        if (existingNote) {
            setTitle(existingNote.title || "");
            setSelectedCollectionId(String(existingNote.collection_id || ""));
            setVisibility(existingNote.visibility || "private");
            if (editor && existingNote.content) {
                editor.commands.setContent(existingNote.content);
            }
            // Load shared members if any
            if (existingNote.shared_members && existingNote.shared_members.length > 0) {
                setSelectedMembers(existingNote.shared_members.map((m: any) => m.user_id));
            }
        }
    }, [existingNote, editor]);

    // Filter available users for sharing
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

    // Auto-save as draft
    const saveAsDraft = useCallback(async () => {
        // Prevent multiple simultaneous saves
        if (isSavingRef.current) {
            return;
        }

        if (!selectedCollectionId) {
            // Don't show error for autosave, only for manual save
            return;
        }

        const content = editor?.getHTML() || "<p></p>";
        const articleTitle = title.trim() || "Untitled Article";

        // Don't save if completely empty
        if (!articleTitle && !editor?.getText().trim()) {
            return;
        }

        // Set saving flag
        isSavingRef.current = true;

        const payload = {
            title: articleTitle,
            content: content,
            collection_id: Number(selectedCollectionId),
            visibility: visibility,
        };

        // Use ref to get the latest noteId value (important for callbacks)
        const currentNoteId = noteIdRef.current;

        if (currentNoteId) {
            // Update existing draft
            updateNote(
                {
                    note_id: currentNoteId,
                    ...payload,
                },
                {
                    onSuccess: (res) => {
                        isSavingRef.current = false;
                        if (res?.status) {
                            setHasUnsavedChanges(false);
                        }
                    },
                    onError: () => {
                        isSavingRef.current = false;
                        // Silent fail for autosave
                    },
                }
            );
        } else {
            // Create new draft
            createNote(payload, {
                onSuccess: (res) => {
                    if (res?.status) {
                        // Extract note ID from response - check multiple possible structures
                        const responseData = res.data as any;
                        
                        // Log the full response for debugging
                        console.log("Create note response:", res);
                        console.log("Response data:", responseData);
                        
                        // Try various response structures
                        let newNoteId = responseData?.id || 
                                       responseData?.note?.id || 
                                       responseData?.data?.id ||
                                       responseData?.data?.note?.id ||
                                       (responseData?.note && typeof responseData.note === 'object' && responseData.note.id) ||
                                       (responseData?.data?.note && typeof responseData.data.note === 'object' && responseData.data.note.id);
                        
                        // If still not found, check the entire response object
                        if (!newNoteId && (res as any).id) {
                            newNoteId = (res as any).id;
                        }
                        
                        // Also check if the response has a nested structure
                        if (!newNoteId && responseData) {
                            // Try to find id in any nested object
                            const findId = (obj: any): number | null => {
                                if (!obj || typeof obj !== 'object') return null;
                                if (obj.id && typeof obj.id === 'number') return obj.id;
                                for (const key in obj) {
                                    if (obj.hasOwnProperty(key)) {
                                        const found = findId(obj[key]);
                                        if (found) return found;
                                    }
                                }
                                return null;
                            };
                            newNoteId = findId(responseData);
                        }
                        
                        if (newNoteId) {
                            const noteIdNum = Number(newNoteId);
                            console.log("Extracted note ID:", noteIdNum);
                            setNoteId(noteIdNum);
                            noteIdRef.current = noteIdNum; // Update ref immediately
                            // Update URL to include noteId for future saves
                            const newUrl = `/dashboard/articles/new?noteId=${noteIdNum}&collection_id=${selectedCollectionId}`;
                            router.replace(newUrl, { scroll: false });
                            setHasUnsavedChanges(false);
                            isSavingRef.current = false;
                        } else {
                            // Log for debugging if we can't find the ID
                            console.error("Could not extract note ID from create response. Full response:", JSON.stringify(res, null, 2));
                            setHasUnsavedChanges(false);
                            isSavingRef.current = false;
                        }
                    } else {
                        isSavingRef.current = false;
                    }
                },
                onError: (error) => {
                    isSavingRef.current = false;
                    // Silent fail for autosave, but log for debugging
                    console.error("Autosave failed:", error);
                },
            });
        }
    }, [title, editor, selectedCollectionId, visibility, createNote, updateNote, router]);

    // Manual save with toast notification
    const handleSaveDraft = useCallback(async () => {
        // Prevent multiple simultaneous saves
        if (isSavingRef.current) {
            toast.info("Save already in progress...");
            return;
        }

        if (!selectedCollectionId) {
            toast.error("Please select a collection before saving");
            return;
        }

        const content = editor?.getHTML() || "<p></p>";
        const articleTitle = title.trim() || "Untitled Article";

        if (!articleTitle && !editor?.getText().trim()) {
            toast.error("Please add a title or content before saving");
            return;
        }

        // Set saving flag
        isSavingRef.current = true;

        const payload = {
            title: articleTitle,
            content: content,
            collection_id: Number(selectedCollectionId),
            visibility: visibility,
        };

        // Use ref to get the latest noteId value (important for callbacks)
        const currentNoteId = noteIdRef.current;

        if (currentNoteId) {
            // Update existing draft
            updateNote(
                {
                    note_id: currentNoteId,
                    ...payload,
                },
                {
                    onSuccess: (res) => {
                        isSavingRef.current = false;
                        if (res?.status) {
                            setHasUnsavedChanges(false);
                            toast.success("Article saved");
                        } else {
                            toast.error(res?.message || "Failed to save article");
                        }
                    },
                    onError: () => {
                        isSavingRef.current = false;
                        toast.error("Failed to save article");
                    },
                }
            );
        } else {
            // Create new draft
            createNote(payload, {
                onSuccess: (res) => {
                    if (res?.status) {
                        // Extract note ID from response - check multiple possible structures
                        const responseData = res.data as any;
                        
                        // Log the full response for debugging
                        console.log("Create note response (manual save):", res);
                        console.log("Response data:", responseData);
                        
                        // Try various response structures
                        let newNoteId = responseData?.id || 
                                       responseData?.note?.id || 
                                       responseData?.data?.id ||
                                       responseData?.data?.note?.id ||
                                       (responseData?.note && typeof responseData.note === 'object' && responseData.note.id) ||
                                       (responseData?.data?.note && typeof responseData.data.note === 'object' && responseData.data.note.id);
                        
                        // If still not found, check the entire response object
                        if (!newNoteId && (res as any).id) {
                            newNoteId = (res as any).id;
                        }
                        
                        // Also check if the response has a nested structure
                        if (!newNoteId && responseData) {
                            // Try to find id in any nested object
                            const findId = (obj: any): number | null => {
                                if (!obj || typeof obj !== 'object') return null;
                                if (obj.id && typeof obj.id === 'number') return obj.id;
                                for (const key in obj) {
                                    if (obj.hasOwnProperty(key)) {
                                        const found = findId(obj[key]);
                                        if (found) return found;
                                    }
                                }
                                return null;
                            };
                            newNoteId = findId(responseData);
                        }
                        
                        if (newNoteId) {
                            const noteIdNum = Number(newNoteId);
                            console.log("Extracted note ID (manual save):", noteIdNum);
                            setNoteId(noteIdNum);
                            noteIdRef.current = noteIdNum; // Update ref immediately
                            // Update URL to include noteId for future saves
                            router.replace(`/dashboard/articles/new?noteId=${noteIdNum}&collection_id=${selectedCollectionId}`, { scroll: false });
                            setHasUnsavedChanges(false);
                            isSavingRef.current = false;
                            toast.success("Article saved");
                        } else {
                            // If we can't extract ID, log for debugging
                            console.error("Could not extract note ID from create response (manual save). Full response:", JSON.stringify(res, null, 2));
                            setHasUnsavedChanges(false);
                            isSavingRef.current = false;
                            toast.success("Article saved (but couldn't track ID for updates)");
                        }
                    } else {
                        isSavingRef.current = false;
                        toast.error(res?.message || "Failed to save article");
                    }
                },
                onError: () => {
                    isSavingRef.current = false;
                    toast.error("Failed to save article");
                },
            });
        }
    }, [title, editor, selectedCollectionId, visibility, createNote, updateNote, router]);

    // Handle back button - save as draft
    const handleBack = useCallback(() => {
        if (hasUnsavedChanges) {
            saveAsDraft();
        }
        router.back();
    }, [hasUnsavedChanges, saveAsDraft, router]);

    // Track title changes
    useEffect(() => {
        if (title) {
            setHasUnsavedChanges(true);
        }
    }, [title]);

    // Auto-save functionality - triggers after 5 seconds of inactivity
    useEffect(() => {
        // Don't autosave if already saving
        if (isSavingRef.current) {
            return;
        }

        if (!selectedCollectionId || !hasUnsavedChanges || !editor) {
            return;
        }

        // Only autosave if there's actual content
        const currentTitle = title.trim();
        const currentContent = editor.getText().trim();
        if (!currentTitle && !currentContent) {
            return;
        }

        const autoSaveTimer = setTimeout(() => {
            // Double-check we're not already saving before executing
            if (!isSavingRef.current) {
                saveAsDraft();
            }
        }, 5000); // Auto-save after 5 seconds of no changes (increased to prevent race conditions)

        return () => clearTimeout(autoSaveTimer);
    }, [title, editorContentHash, hasUnsavedChanges, selectedCollectionId, visibility, saveAsDraft, editor]);

    // Also auto-save on visibility change if article exists
    useEffect(() => {
        // Don't autosave if already saving
        if (isSavingRef.current) {
            return;
        }

        const currentNoteId = noteIdRef.current;
        if (currentNoteId && hasUnsavedChanges && selectedCollectionId) {
            const timer = setTimeout(() => {
                // Double-check we're not already saving
                if (!isSavingRef.current) {
                    saveAsDraft();
                }
            }, 2000); // Debounce auto-save
            return () => clearTimeout(timer);
        }
    }, [visibility, hasUnsavedChanges, selectedCollectionId, saveAsDraft]);

    // Handle visibility change for private collections
    useEffect(() => {
        if (visibility === "shared" && isCollectionPrivate) {
            setVisibility("private");
            toast.warning("Collection is private. 'Collaborate' option is not available. Please make the collection 'Shared' first.");
        }
    }, [isCollectionPrivate, visibility]);

    const handlePublish = () => {
        if (!title.trim()) {
            toast.error("Please enter a title");
            return;
        }

        if (!selectedCollectionId) {
            toast.error("Please select a collection");
            return;
        }

        const content = editor?.getHTML() || "<p></p>";

        const payload = {
            title: title.trim(),
            content: content,
            collection_id: Number(selectedCollectionId),
            visibility: visibility,
        };

        if (noteId) {
            // Update existing article
            updateNote(
                {
                    note_id: noteId,
                    ...payload,
                },
                {
                    onSuccess: async (res) => {
                        if (res?.status) {
                            // If visibility is "shared" and there are members, share the note
                            if (visibility === "shared" && selectedMembers.length > 0) {
                                try {
                                    const api = (await import("@/src/lib/axios")).default;
                                    const routes = (await import("@/src/lib/routes")).default;
                                    await api.post(routes.notes.share(noteId), {
                                        user_ids: selectedMembers,
                                    });
                                    toast.success("Article published and shared!");
                                } catch (err) {
                                    toast.success("Article published!");
                                }
                            } else {
                                toast.success("Article published!");
                            }
                            setHasUnsavedChanges(false);
                            // Navigate to the article
                            const collection = collections.find(c => c.id === Number(selectedCollectionId));
                            if (collection) {
                                router.push(`/dashboard/workspaces/${collection.workspaceId}/collections/${selectedCollectionId}/notes/${noteId}`);
                            } else {
                                router.back();
                            }
                        } else {
                            toast.error(res?.message || "Could not publish article.");
                        }
                    },
                    onError: (err: unknown) => {
                        const error = err as { message?: string };
                        toast.error(error?.message || "Request failed, please try again.");
                    },
                }
            );
        } else {
            // Create new article
            createNote(payload, {
                onSuccess: async (res) => {
                    if (res?.status) {
                        const newNoteId = (res.data as any)?.id || (res.data as any)?.note?.id;
                        if (newNoteId) {
                            setNoteId(newNoteId);
                            // If visibility is "shared" and there are members, share the note
                            if (visibility === "shared" && selectedMembers.length > 0) {
                                try {
                                    const api = (await import("@/src/lib/axios")).default;
                                    const routes = (await import("@/src/lib/routes")).default;
                                    await api.post(routes.notes.share(newNoteId), {
                                        user_ids: selectedMembers,
                                    });
                                    toast.success("Article published and shared!");
                                } catch (err) {
                                    toast.success("Article published!");
                                }
                            } else {
                                toast.success("Article published!");
                            }
                            setHasUnsavedChanges(false);
                            // Navigate to the article
                            const collection = collections.find(c => c.id === Number(selectedCollectionId));
                            if (collection) {
                                router.push(`/dashboard/workspaces/${collection.workspaceId}/collections/${selectedCollectionId}/notes/${newNoteId}`);
                            }
                        } else {
                            toast.success("Article published!");
                            router.back();
                        }
                    } else {
                        toast.error(res?.message || "Could not publish article.");
                    }
                },
                onError: (err: unknown) => {
                    const error = err as { message?: string };
                    toast.error(error?.message || "Request failed, please try again.");
                },
            });
        }
    };

    if (!editor || (editingNoteId && isLoadingNote)) {
        return (
            <RequireAuth>
                <div className="flex flex-col items-center justify-center min-h-screen">
                    <div className="relative w-16 h-16">
                        <PenTool className="w-12 h-12 text-primary absolute inset-0 m-auto animate-bounce" style={{ animationDuration: '1.5s' }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        </div>
                    </div>
                    <div className="mt-6 text-muted-foreground animate-pulse text-sm">Loading editor...</div>
                </div>
            </RequireAuth>
        );
    }

    return (
        <RequireAuth>
            <div className="flex flex-col w-full h-screen bg-background">
                {/* Header with Title and Actions */}
                <div className="px-8 pt-3 pb-3 border-b flex-shrink-0">
                    {editingNoteId && (
                        <div className="mb-1">
                            <span className="text-sm text-muted-foreground">Editing Article</span>
                        </div>
                    )}
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={handleBack}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <div className="flex-1 flex justify-center">
                            <Input
                                placeholder="Article Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="text-2xl font-bold border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-center max-w-2xl"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            {hasUnsavedChanges && (
                                <span className="text-xs text-muted-foreground">Unsaved changes</span>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSaveDraft}
                                disabled={isCreating || isUpdating || !selectedCollectionId}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {isCreating || isUpdating ? "Saving..." : "Save Draft"}
                            </Button>
                            {/* Publish button disabled for now */}
                            {/* <Button
                                onClick={handlePublish}
                                disabled={isCreating || isUpdating || !title.trim() || !selectedCollectionId}
                            >
                                {isCreating || isUpdating ? "Publishing..." : "Publish"}
                            </Button> */}
                        </div>
                    </div>

                </div>

                {/* Editor - Takes full remaining space */}
                <div className="flex-1 overflow-hidden min-h-0">
                    <div className="flex flex-col h-full w-full">
                        {/* Toolbar */}
                        <div className="border-b p-2 flex items-center justify-center gap-1 flex-wrap bg-background flex-shrink-0">
                            <Button
                                variant={editor.isActive("bold") ? "default" : "ghost"}
                                size="sm"
                                onClick={() => editor.chain().focus().toggleBold().run()}
                                disabled={!editor.can().chain().focus().toggleBold().run()}
                            >
                                <Bold className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={editor.isActive("italic") ? "default" : "ghost"}
                                size="sm"
                                onClick={() => editor.chain().focus().toggleItalic().run()}
                                disabled={!editor.can().chain().focus().toggleItalic().run()}
                            >
                                <Italic className="h-4 w-4" />
                            </Button>
                            <div className="w-px h-6 bg-border mx-1" />
                            <Button
                                variant={editor.isActive("heading", { level: 1 }) ? "default" : "ghost"}
                                size="sm"
                                onClick={(e) => {
                                    e.preventDefault();
                                    // Get current selection
                                    const { from, to, empty } = editor.state.selection;
                                    
                                    if (editor.isActive("heading", { level: 1 })) {
                                        // If already H1, toggle it off to paragraph
                                        editor.chain().focus().setParagraph().run();
                                    } else {
                                        // If there's a selection, collapse it to just the cursor position
                                        // This ensures we only affect the current block
                                        if (!empty) {
                                            editor.chain().focus().setTextSelection(from).setHeading({ level: 1 }).run();
                                        } else {
                                            // No selection, just apply to current block
                                            editor.chain().focus().setHeading({ level: 1 }).run();
                                        }
                                    }
                                }}
                            >
                                <Heading1 className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={editor.isActive("heading", { level: 2 }) ? "default" : "ghost"}
                                size="sm"
                                onClick={(e) => {
                                    e.preventDefault();
                                    // Get current selection
                                    const { from, to, empty } = editor.state.selection;
                                    
                                    if (editor.isActive("heading", { level: 2 })) {
                                        // If already H2, toggle it off to paragraph
                                        editor.chain().focus().setParagraph().run();
                                    } else {
                                        // If there's a selection, collapse it to just the cursor position
                                        // This ensures we only affect the current block
                                        if (!empty) {
                                            editor.chain().focus().setTextSelection(from).setHeading({ level: 2 }).run();
                                        } else {
                                            // No selection, just apply to current block
                                            editor.chain().focus().setHeading({ level: 2 }).run();
                                        }
                                    }
                                }}
                            >
                                <Heading2 className="h-4 w-4" />
                            </Button>
                            <div className="w-px h-6 bg-border mx-1" />
                            <Button
                                variant={editor.isActive("bulletList") ? "default" : "ghost"}
                                size="sm"
                                onClick={() => editor.chain().focus().toggleBulletList().run()}
                            >
                                <List className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={editor.isActive("orderedList") ? "default" : "ghost"}
                                size="sm"
                                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                            >
                                <ListOrdered className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={editor.isActive("blockquote") ? "default" : "ghost"}
                                size="sm"
                                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                            >
                                <Quote className="h-4 w-4" />
                            </Button>
                            <div className="w-px h-6 bg-border mx-1" />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => editor.chain().focus().undo().run()}
                                disabled={!editor.can().chain().focus().undo().run()}
                            >
                                <Undo className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => editor.chain().focus().redo().run()}
                                disabled={!editor.can().chain().focus().redo().run()}
                            >
                                <Redo className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Editor Content */}
                        <div className="flex-1 overflow-auto min-h-0 bg-background">
                            <div className="max-w-4xl mx-auto p-4">
                                <EditorContent editor={editor} className="h-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </RequireAuth>
    );
}

