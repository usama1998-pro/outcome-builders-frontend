"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";

interface TiptapViewerProps {
    content: string;
    className?: string;
}

export default function TiptapViewer({ content, className = "" }: TiptapViewerProps) {
    const [mounted, setMounted] = useState(false);

    const editor = useEditor({
        extensions: [StarterKit],
        content: content || "<p></p>",
        editable: false, // Read-only mode
        immediatelyRender: false,
    });

    // Track client-side mounting
    useEffect(() => {
        setMounted(true);
    }, []);

    // Update content when it changes
    useEffect(() => {
        if (editor && mounted) {
            const contentToSet = content || "<p></p>";
            editor.commands.setContent(contentToSet);
        }
    }, [editor, content, mounted]);

    if (!mounted) {
        return (
            <div className={`min-h-[200px] ${className}`}>
                <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                </div>
            </div>
        );
    }

    if (!editor) {
        return (
            <div className={`min-h-[200px] ${className}`}>
                <div className="text-muted-foreground">Loading content...</div>
            </div>
        );
    }

    return (
        <div className={`tiptap-viewer ${className}`}>
            <EditorContent editor={editor} />
        </div>
    );
}

