"use client";

import RequireAuth from "@/src/components/auth/requireAuth";
import TiptapEditor from "@/src/components/editor/TiptapEditor";

export default function EditorPage() {
    return (
        <RequireAuth>
            <div className="flex flex-col w-full h-full bg-background">
                {/* Header */}
                <div className="px-8 pt-8 pb-4 border-b flex-shrink-0">
                    <h1 className="text-2xl font-bold">Editor</h1>
                    <p className="text-muted-foreground mt-1">
                        Create and edit your content with a rich text editor
                    </p>
                </div>

                {/* Editor - Takes full remaining space */}
                <div className="flex-1 overflow-hidden min-h-0">
                    <TiptapEditor />
                </div>
            </div>
        </RequireAuth>
    );
}

