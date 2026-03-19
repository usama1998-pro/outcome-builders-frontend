"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
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
import { useUserCollections, useCreateUserCollection } from "@/src/hooks/useCollection";
import { useCreateNote, useUpdateNote, useNote } from "@/src/hooks/useNotes";
import { useUserWorkspaces } from "@/src/hooks/useWorkspace";
import { useBrainSpaceStore } from "@/src/store/useBrainSpace";
import { toast } from "sonner";
import RequireAuth from "@/src/components/auth/requireAuth";

function NewArticlePageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { currentBrainSpaceId } = useBrainSpaceStore();
    const { data: workspaces } = useUserWorkspaces();
    const { data: collections = [], refetch: refetchCollections } = useUserCollections(currentBrainSpaceId);
    const { mutate: createNote, isPending: isCreating } = useCreateNote();
    const { mutate: updateNote, isPending: isUpdating } = useUpdateNote();
    const { mutate: createCollection, isPending: isCreatingCollection } = useCreateUserCollection();

    // Get noteId from URL if editing
    const noteIdParam = searchParams.get("noteId");
    const editingNoteId = noteIdParam ? Number(noteIdParam) : null;
    
    // Fetch note data if editing
    const { data: existingNote, isLoading: isLoadingNote } = useNote(editingNoteId);
    
    const [title, setTitle] = useState("");
    // Check if collection_id is provided in URL (coming from collection page)
    const urlCollectionId = searchParams.get("collection_id") || "";
    const isFromCollection = !!urlCollectionId;
    const [selectedCollectionId, setSelectedCollectionId] = useState<string>(urlCollectionId);
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

    const editor = useEditor({
        extensions: [StarterKit],
        content: existingNote?.content || "<p>Start writing...</p>",
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: "focus:outline-none text-foreground prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto",
            },
        },
        onUpdate: ({ editor }) => {
            setHasUnsavedChanges(true);
            // Update content hash for autosave tracking
            const content = editor.getHTML();
            setEditorContentHash(content);
        },
    });

    // Prevent body scrolling when component mounts
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    // Simple markdown to HTML converter
    const markdownToHtml = (markdown: string): string => {
        let html = markdown;
        
        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        
        // Bold
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
        
        // Italic
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/_(.*?)_/g, '<em>$1</em>');
        
        // Code blocks
        html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
            return `<pre><code>${code.trim()}</code></pre>`;
        });
        
        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
        
        // Lists - unordered
        html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
        html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
        // Wrap consecutive list items in ul
        html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
            return `<ul>${match}</ul>`;
        });
        
        // Lists - ordered
        html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
        // Note: This is simplified - in real markdown, ordered lists need special handling
        
        // Blockquotes
        html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
        
        // Horizontal rules
        html = html.replace(/^---$/gim, '<hr>');
        html = html.replace(/^\*\*\*$/gim, '<hr>');
        
        // Split by double newlines for paragraphs
        const blocks = html.split(/\n\n+/).filter(b => b.trim());
        html = blocks.map(block => {
            const trimmed = block.trim();
            // If already an HTML tag, use as-is
            if (trimmed.startsWith('<')) {
                return trimmed;
            }
            // Otherwise wrap in paragraph
            return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
        }).join("");
        
        return html || `<p>${markdown.trim()}</p>`;
    };

    // Load pending content from sessionStorage (from chat)
    useEffect(() => {
        if (editor && !existingNote) {
            const pendingContent = sessionStorage.getItem("pendingContent");
            if (pendingContent) {
                // Convert markdown to HTML
                let htmlContent = pendingContent;
                
                // If content doesn't look like HTML, convert markdown to HTML
                if (!pendingContent.trim().startsWith("<")) {
                    htmlContent = markdownToHtml(pendingContent);
                }
                
                editor.commands.setContent(htmlContent);
                // Clear the pending content after loading
                sessionStorage.removeItem("pendingContent");
                setHasUnsavedChanges(true);
            }
        }
    }, [editor, existingNote]);

    // Load existing note data when editing
    useEffect(() => {
        if (existingNote) {
            setTitle(existingNote.title || "");
            setSelectedCollectionId(String(existingNote.collection_id || ""));
            if (editor && existingNote.content) {
                editor.commands.setContent(existingNote.content);
            }
        }
    }, [existingNote, editor]);

    // Helper function to ensure a collection exists, create one if needed
    const ensureCollectionExists = useCallback((): Promise<string> => {
        return new Promise((resolve, reject) => {
            // If a collection is already selected, use it
            if (selectedCollectionId) {
                resolve(selectedCollectionId);
                return;
            }

            // If collections exist but none selected, use the first one
            if (collections.length > 0) {
                const firstCollectionId = String(collections[0].id);
                setSelectedCollectionId(firstCollectionId);
                resolve(firstCollectionId);
                return;
            }

            // No collections exist, create one
            if (!currentBrainSpaceId) {
                reject(new Error("No workspace selected. Please select a workspace first."));
                return;
            }

            const collectionName = title.trim() || "My Content";
            
            createCollection(
                {
                    name: collectionName,
                    description: null,
                    visibility: "private",
                    workspace_id: currentBrainSpaceId,
                },
                {
                    onSuccess: async (res) => {
                        if (res?.status) {
                            // Extract collection ID from response
                            const collectionId = (res?.data as any)?.message?.collection?.id ||
                                (res?.data as any)?.collection?.id ||
                                (res?.data as any)?.id;

                            if (collectionId) {
                                // Refetch collections to get the new one
                                const { data: updatedCollections } = await refetchCollections();
                                const newCollectionId = String(collectionId);
                                setSelectedCollectionId(newCollectionId);
                                resolve(newCollectionId);
                            } else {
                                // If we can't get the ID, refetch and use the first collection
                                const { data: updatedCollections } = await refetchCollections();
                                if (updatedCollections && updatedCollections.length > 0) {
                                    const firstCollectionId = String(updatedCollections[0].id);
                                    setSelectedCollectionId(firstCollectionId);
                                    resolve(firstCollectionId);
                                } else {
                                    reject(new Error("Collection created but could not be retrieved."));
                                }
                            }
                        } else {
                            reject(new Error(res?.message || "Failed to create collection"));
                        }
                    },
                    onError: (err: any) => {
                        reject(new Error(err?.message || "Failed to create collection"));
                    },
                }
            );
        });
    }, [selectedCollectionId, collections, currentBrainSpaceId, title, createCollection, refetchCollections]);

    // Auto-save as draft
    const saveAsDraft = useCallback(async () => {
        // Prevent multiple simultaneous saves
        if (isSavingRef.current) {
            return;
        }

        // Ensure a collection exists
        let collectionIdToUse = selectedCollectionId;
        if (!collectionIdToUse) {
            try {
                collectionIdToUse = await ensureCollectionExists();
            } catch (error: any) {
                // Silent fail for autosave
                console.error("Autosave failed - could not ensure collection:", error);
                return;
            }
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
            collection_id: Number(collectionIdToUse),
            visibility: "private" as const, // Articles are private by default (draft mode)
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
                            const newUrl = `/dashboard/articles/new?noteId=${noteIdNum}&collection_id=${collectionIdToUse}`;
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
    }, [title, editor, selectedCollectionId, createNote, updateNote, router, ensureCollectionExists]);

    // Manual save with toast notification
    const handleSaveDraft = useCallback(async () => {
        // Prevent multiple simultaneous saves
        if (isSavingRef.current) {
            toast.info("Save already in progress...");
            return;
        }

        // Ensure a collection exists
        let collectionIdToUse = selectedCollectionId;
        if (!collectionIdToUse) {
            try {
                toast.loading("Creating collection...");
                collectionIdToUse = await ensureCollectionExists();
                toast.dismiss();
            } catch (error: any) {
                toast.dismiss();
                toast.error(error?.message || "Failed to create collection. Please try again.");
                return;
            }
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
            collection_id: Number(collectionIdToUse),
            visibility: "private" as const, // Articles are private by default (draft mode)
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
                            router.replace(`/dashboard/articles/new?noteId=${noteIdNum}&collection_id=${collectionIdToUse}`, { scroll: false });
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
    }, [title, editor, selectedCollectionId, createNote, updateNote, router, ensureCollectionExists]);

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
    }, [title, editorContentHash, hasUnsavedChanges, selectedCollectionId, saveAsDraft, editor]);


    const handlePublish = async () => {
        if (!title.trim()) {
            toast.error("Please enter a title");
            return;
        }

        // Ensure a collection exists
        let collectionIdToUse = selectedCollectionId;
        if (!collectionIdToUse) {
            try {
                toast.loading("Creating collection...");
                collectionIdToUse = await ensureCollectionExists();
                toast.dismiss();
            } catch (error: any) {
                toast.dismiss();
                toast.error(error?.message || "Failed to create collection. Please try again.");
                return;
            }
        }

        const content = editor?.getHTML() || "<p></p>";

        const payload = {
            title: title.trim(),
            content: content,
            collection_id: Number(collectionIdToUse),
            visibility: "private" as const, // Articles are private by default
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
                            toast.success("Article published!");
                            setHasUnsavedChanges(false);
                            // Navigate to the article
                            const collection = collections.find(c => c.id === Number(collectionIdToUse));
                            if (collection) {
                                const wsUuid = workspaces?.find(w => w.id === collection.workspaceId)?.uuid ?? collection.workspaceId;
                                router.push(`/dashboard/workspaces/${wsUuid}/collections/${collectionIdToUse}/notes/${noteId}`);
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
                            toast.success("Article published!");
                            setHasUnsavedChanges(false);
                            // Navigate to the article
                            const collection = collections.find(c => c.id === Number(collectionIdToUse));
                            if (collection) {
                                const wsUuid = workspaces?.find(w => w.id === collection.workspaceId)?.uuid ?? collection.workspaceId;
                                router.push(`/dashboard/workspaces/${wsUuid}/collections/${collectionIdToUse}/notes/${newNoteId}`);
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
            <div className="flex flex-col w-full h-screen bg-background overflow-hidden">
                {/* Header with Title and Actions */}
                <div className="px-8 pt-3 pb-3 border-b flex-shrink-0 bg-background z-10">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={handleBack}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        
                        {/* Collection selector - only show when coming from side menu (no collection_id in URL) */}
                        {!isFromCollection && (
                            <div className="flex items-center gap-2">
                                <Label htmlFor="collection-select" className="text-sm text-muted-foreground whitespace-nowrap">
                                    Save to:
                                </Label>
                                <Select
                                    value={selectedCollectionId}
                                    onValueChange={setSelectedCollectionId}
                                >
                                    <SelectTrigger id="collection-select" className="w-[200px]">
                                        <SelectValue placeholder="Select collection" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {collections.map((collection) => (
                                            <SelectItem key={collection.id} value={String(collection.id)}>
                                                {collection.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

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
                                disabled={isCreating || isUpdating || isCreatingCollection || !currentBrainSpaceId}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {isCreating || isUpdating ? "Saving..." : "Save Draft"}
                            </Button>
                        </div>
                    </div>

                </div>

                {/* Editor - Takes full remaining space */}
                <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
                    {/* Toolbar */}
                    <div className="border-b p-2 flex items-center justify-center gap-1 flex-wrap bg-background flex-shrink-0 z-10">
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

                        {/* Editor Content - Scrollable */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 bg-background">
                            <div className="max-w-4xl mx-auto p-4 py-8">
                                <div className="min-h-[calc(100vh-300px)]">
                                    <EditorContent editor={editor} />
                                </div>
                            </div>
                        </div>
                </div>
            </div>
        </RequireAuth>
    );
}

export default function NewArticlePage() {
    return (
        <Suspense
            fallback={
                <RequireAuth>
                    <div className="flex flex-col items-center justify-center min-h-screen">
                        <div className="relative w-16 h-16">
                            <PenTool
                                className="w-12 h-12 text-primary absolute inset-0 m-auto animate-bounce"
                                style={{ animationDuration: "1.5s" }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                            </div>
                        </div>
                        <div className="mt-6 text-muted-foreground animate-pulse text-sm">
                            Loading editor...
                        </div>
                    </div>
                </RequireAuth>
            }
        >
            <NewArticlePageContent />
        </Suspense>
    );
}

