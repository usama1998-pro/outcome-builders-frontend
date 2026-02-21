"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Quote, Undo, Redo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const TiptapEditor = () => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const editor = useEditor({
        extensions: [StarterKit],
        content: "<p>Start writing...</p>",
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: "focus:outline-none min-h-full p-4 text-foreground",
            },
        },
    });

    if (!mounted || !editor) {
        return (
            <div className="flex flex-col h-full w-full">
                <div className="border-b p-2 flex items-center gap-1 flex-wrap bg-background">
                    <div className="h-9 w-9 bg-muted animate-pulse rounded" />
                </div>
                <div className="flex-1 overflow-auto min-h-0 bg-background">
                    <div className="max-w-4xl mx-auto p-4">
                        <div className="h-64 bg-muted animate-pulse rounded" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full">
            {/* Toolbar */}
            <div className="border-b p-2 flex items-center gap-1 flex-wrap bg-background">
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
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                >
                    <Heading1 className="h-4 w-4" />
                </Button>
                <Button
                    variant={editor.isActive("heading", { level: 2 }) ? "default" : "ghost"}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
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
    );
};

export default TiptapEditor;

