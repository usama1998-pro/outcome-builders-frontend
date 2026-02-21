"use client";


import { Button } from "@/components/ui/button";
import { NotesList } from "@/src/components/List/Notes/NotesList";
import { useParams, useRouter } from "next/navigation";
import { FaPlus } from "react-icons/fa";
import { FileText, Plus, Sparkles, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { useCollectionNotes } from "@/src/hooks/useNotes";
import BlocksLoader from "@/src/components/Loaders/BlocksLoader/BlocksLoader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RequireAuth from "@/src/components/auth/requireAuth";
import { useNotePermissions } from "@/src/hooks/useNotePermissions";
import { Input } from "@/components/ui/input";
import { useBrainSpaceStore } from "@/src/store/useBrainSpace";

export default function NotesPage() {
    const router = useRouter();
    const params = useParams();
    const workspaceId = Array.isArray(params.workspaceId) ? params.workspaceId[0] : params.workspaceId; // workspace id from URL
    const collectionId = Array.isArray(params.collectionId) ? params.collectionId[0] : params.collectionId;
    const { setCurrentBrainSpaceId, currentBrainSpaceId } = useBrainSpaceStore();

    const { data: notes, isLoading, isError, error, refetch } = useCollectionNotes(Number(collectionId));
    const [searchQuery, setSearchQuery] = useState("");

    // Set the workspace from URL when page loads
    useEffect(() => {
        if (workspaceId) {
            const workspaceIdNum = Number(workspaceId);
            if (workspaceIdNum && workspaceIdNum !== currentBrainSpaceId) {
                setCurrentBrainSpaceId(workspaceIdNum);
            }
        }
    }, [workspaceId, currentBrainSpaceId, setCurrentBrainSpaceId]);

    // Use shared permission hook
    const {
        canCreateNote,
        permissionsLoading
    } = useNotePermissions(Number(collectionId));



    return (
        <RequireAuth>
            <div className="flex flex-col items-center justify-center p-4">
                <nav className="sticky top-0 z-[60] w-[90%] mx-auto self-center px-15 flex justify-between items-center bg-background border-b border-border py-3">
                    <Input
                        type="text"
                        placeholder="Search articles..."
                        className="w-64"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />

                    {canCreateNote && (
                        <Button
                            onClick={() => {
                                router.push(`/dashboard/articles/new?collection_id=${collectionId}`);
                            }}
                        >
                            <FaPlus className="mr-2" /> New Article
                        </Button>
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
                                    onClick={() => {
                                        router.push(`/dashboard/articles/new?collection_id=${collectionId}`);
                                    }}
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
