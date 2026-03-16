"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Send, Bot, User, Copy, Check, Square, Loader2, Brain, MessageSquare, ChevronDown, Star, RefreshCw, X, FileText, Plus, Upload, Image as ImageIcon, PenTool, AtSign, SlidersHorizontal, Paperclip, ChevronUp, Globe, MessageCircle, Settings as SettingsIcon } from "lucide-react";
import Image from "next/image";
import BlocksLoader from "@/src/components/Loaders/BlocksLoader/BlocksLoader";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ChatMessage, ChatTab } from "../../../types/chat";
import { useRef, useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { streamChat, getChatHistory, getChatTabs, updateChatTabName } from "../../../api/chat";
import { useBrainSpaceStore } from "../../../store/useBrainSpace";
import { useUserWorkspaces } from "../../../hooks/useWorkspace";
import { useUserCollections } from "../../../hooks/useCollection";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../../store/useAuth";
import { useUserProfile } from "../../../hooks/useProfile";
import { useGetUserSettings, useUpdateUserSettings } from "../../../hooks/useUserSettings";
import { ModelSelector } from "../../../components/chat/ModelSelector";
import ChatLandingPage from "../page";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

// 4-pointed star SVG component
function FourPointedStar({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
        >
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
        </svg>
    );
}

interface MessageBubbleProps {
    message: ChatMessage;
    index: number;
    isStreaming?: boolean;
    onAddContext?: (text: string) => void;
    onCreateArticle?: (content: string, messageId?: number) => void;
    isSelectedForArticle?: boolean;
    currentStatus?: string | null;
    messageRef?: (node: HTMLDivElement | null) => void;
    searchQuery?: string;
    currentMatchIndex?: number;
    searchMatches?: Array<{ messageId: number; matchIndex: number; textOffset?: number; isUserMatch?: boolean }>;
}

// Context separator for parsing stored questions
const CONTEXT_SEPARATOR = '\n\n---CONTEXT---\n\n';
// Track cumulative text offset per message to handle ReactMarkdown fragments
const messageTextOffsets = new Map<string, number>();

// Generate a unique key for each message to track fragments
// Include a flag to differentiate user vs AI messages since they share the same ID
function getMessageKey(messageId: number, searchQuery: string, isUserMessage: boolean = false): string {
    return `${messageId}-${isUserMessage ? 'user' : 'ai'}-${searchQuery}`;
}

// Highlight text component for search
function HighlightText({
    text,
    searchQuery,
    messageId,
    currentMatchIndex,
    searchMatches,
    isUserMessage = false
}: {
    text: string;
    searchQuery: string;
    messageId: number;
    currentMatchIndex: number;
    searchMatches: Array<{ messageId: number; matchIndex: number; textOffset?: number; isUserMatch?: boolean }>;
    isUserMessage?: boolean;
}) {
    if (!searchQuery.trim() || !text) {
        return <>{text}</>;
    }

    // Escape special regex characters and match character-by-character (substring matching)
    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match the query as a substring (character-by-character matching)
    const regex = new RegExp(`(${escapedQuery})`, 'gi');

    // Use matchAll to find all matches and their positions
    const allMatches = Array.from(text.matchAll(regex));
    if (allMatches.length === 0) {
        return <>{text}</>;
    }

    // Find all matches for this message AND message type (user vs AI)
    // This is critical because user and AI messages share the same messageId
    const messageMatches = searchMatches
        .filter(m => m.messageId === messageId && m.isUserMatch === isUserMessage)
        .sort((a, b) => a.matchIndex - b.matchIndex);

    if (messageMatches.length === 0) {
        return <>{text}</>;
    }

    // Use a unique key per message type and search query to track which matches we've processed
    // This differentiates between user and AI messages that share the same messageId
    const messageKey = getMessageKey(messageId, searchQuery, isUserMessage);

    // Get the starting match index for this fragment (how many matches we've processed so far)
    // This tracks cumulative matches across all fragments of this message
    const startMatchIndex = messageTextOffsets.get(messageKey) || 0;

    // Build highlighted text by inserting marks at match positions
    const parts: Array<{ text: string; isMatch: boolean; matchIndex?: number }> = [];
    let lastIndex = 0;
    let localMatchCount = 0;

    allMatches.forEach((match) => {
        if (match.index === undefined) return;

        // Add text before match
        if (match.index > lastIndex) {
            parts.push({ text: text.substring(lastIndex, match.index), isMatch: false });
        }

        // Add match - use the full matched text (match[0] contains the full match)
        const matchedText = match[0];
        // Get the global match index from the sorted message matches
        // Use the cumulative index to find the right match
        const matchIndexInMessage = startMatchIndex + localMatchCount;
        const globalMatchIndex = messageMatches[matchIndexInMessage]?.matchIndex ?? -1;
        parts.push({
            text: matchedText,
            isMatch: true,
            matchIndex: globalMatchIndex
        });

        localMatchCount++;
        lastIndex = match.index + matchedText.length;
    });

    // Update the match index counter for this message fragment
    // This ensures the next fragment knows where to start
    messageTextOffsets.set(messageKey, startMatchIndex + localMatchCount);

    // Add remaining text
    if (lastIndex < text.length) {
        parts.push({ text: text.substring(lastIndex), isMatch: false });
    }

    return (
        <>
            {parts.map((part, index) => {
                if (part.isMatch) {
                    const isActive = part.matchIndex === currentMatchIndex;
                    const matchClass = isUserMessage
                        ? isActive
                            ? 'bg-white/30 text-white font-semibold px-0.5 rounded-sm ring-2 ring-white/70 search-match-active'
                            : 'bg-white/20 text-white px-0.5 rounded-sm search-match'
                        : isActive
                            ? 'bg-orange-400 dark:bg-orange-500 text-black dark:text-black font-semibold px-0.5 rounded-sm ring-2 ring-orange-500 dark:ring-orange-400 search-match-active'
                            : 'bg-yellow-200 dark:bg-yellow-300/80 text-black dark:text-black px-0.5 rounded-sm search-match';

                    return (
                        <mark
                            key={index}
                            data-match-index={part.matchIndex}
                            className={matchClass}
                        >
                            {part.text}
                        </mark>
                    );
                }
                return (
                    <span
                        key={index}
                        className={isUserMessage ? 'text-white' : undefined}
                    >
                        {part.text}
                    </span>
                );
            })}
        </>
    );
}

function MessageBubble({
    message,
    index,
    isStreaming = false,
    onAddContext,
    onCreateArticle,
    isSelectedForArticle,
    currentStatus,
    messageRef: externalMessageRef,
    searchQuery = "",
    currentMatchIndex = -1,
    searchMatches = [],
}: MessageBubbleProps) {
    // User message has question, bot message has answer
    const isUser = !!message.question && !message.answer;
    const [copied, setCopied] = useState(false);
    const [selectedText, setSelectedText] = useState<string>("");
    const [showContextPopup, setShowContextPopup] = useState(false);
    const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
    const messageRef = useRef<HTMLDivElement>(null);
    const popupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Set external ref when component mounts/updates
    useEffect(() => {
        if (externalMessageRef && messageRef.current) {
            externalMessageRef(messageRef.current);
        }
    }, [externalMessageRef]);

    const handleCopy = async () => {
        // For user messages, copy the original stored question (which includes context separator)
        // For bot messages, copy the answer
        let textToCopy = message.answer || message.question || "";

        // If it's a user message with context, format it nicely for copying
        if (isUser && contextText) {
            textToCopy = `Context: ${contextText}\n\nQuestion: ${displayQuestion}`;
        }

        try {
            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    };

    // Handle text selection for bot messages
    useEffect(() => {
        if (isUser) return;

        const handleMouseUp = (e: MouseEvent) => {
            // Don't process if clicking on the popup button
            const target = e.target as HTMLElement;
            if (target.closest('[data-context-popup]')) {
                return;
            }

            // Check if ref is available - if not, skip this event
            // The effect will re-run when message changes and ref will be available
            if (!messageRef.current) {
                return;
            }

            // Clear any existing timeout
            if (popupTimeoutRef.current) {
                clearTimeout(popupTimeoutRef.current);
            }

            // Small delay to ensure selection is complete
            setTimeout(() => {
                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0) {
                    // Delay hiding popup to allow clicking the button
                    popupTimeoutRef.current = setTimeout(() => {
                        setShowContextPopup(false);
                    }, 150);
                    return;
                }

                const selectedText = selection.toString().trim();
                if (selectedText.length === 0) {
                    popupTimeoutRef.current = setTimeout(() => {
                        setShowContextPopup(false);
                    }, 150);
                    return;
                }

                // Check if selection is within this message - improved for multi-line
                const range = selection.getRangeAt(0);
                const messageElement = messageRef.current;

                if (!messageElement) {
                    setShowContextPopup(false);
                    return;
                }

                // More robust check: verify selection intersects with message element
                // This works better for ReactMarkdown's nested structure
                const messageRect = messageElement.getBoundingClientRect();
                const selectionRect = range.getBoundingClientRect();

                // Check if selection rectangle overlaps with message rectangle
                const rectsOverlap = !(
                    selectionRect.right < messageRect.left ||
                    selectionRect.left > messageRect.right ||
                    selectionRect.bottom < messageRect.top ||
                    selectionRect.top > messageRect.bottom
                );

                // Also check if common ancestor is within message (for nested structures)
                const commonAncestor = range.commonAncestorContainer;
                const isAncestorInMessage = messageElement.contains(commonAncestor) ||
                    commonAncestor === messageElement ||
                    (commonAncestor.nodeType === Node.TEXT_NODE && messageElement.contains(commonAncestor.parentElement || commonAncestor));

                const isSelectionInMessage = rectsOverlap && isAncestorInMessage;

                if (isSelectionInMessage && selectedText.length > 0) {
                    setSelectedText(selectedText);
                    // Position popup near selection - use getBoundingClientRect for multi-line support
                    const rect = range.getBoundingClientRect();
                    setPopupPosition({
                        x: rect.left + rect.width / 2,
                        y: rect.top - 10
                    });
                    setShowContextPopup(true);
                } else {
                    setShowContextPopup(false);
                }
            }, 10);
        };

        // Also handle clicks outside to close popup
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Don't close if clicking on popup or button
            if (target.closest('[data-context-popup]')) {
                return;
            }
            // Close popup if clicking outside
            if (showContextPopup) {
                setShowContextPopup(false);
                setSelectedText("");
            }
        };

        // Attach listeners - they will check ref availability inside handlers
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('click', handleClickOutside);
            if (popupTimeoutRef.current) {
                clearTimeout(popupTimeoutRef.current);
            }
        };
    }, [isUser, showContextPopup, message.id, message.answer]); // Re-run when message changes

    // For bot messages, show answer even if empty (for streaming)
    // For user messages, parse context and question separately
    let displayContent = isUser ? (message.question || "") : (message.answer !== null && message.answer !== undefined ? message.answer : "");
    let contextText: string | null = null;
    let displayQuestion = displayContent;

    // Parse context from stored question if present
    // Handle both formats:
    // 1. Messages with CONTEXT_SEPARATOR (from frontend state)
    // 2. Messages with \n\n separator (from database - concatenated format)
    if (isUser && displayContent) {
        // First, try parsing with CONTEXT_SEPARATOR (for messages in frontend state)
        if (displayContent.includes(CONTEXT_SEPARATOR)) {
            const parts = displayContent.split(CONTEXT_SEPARATOR);
            if (parts.length === 2) {
                contextText = parts[0].trim();
                displayQuestion = parts[1].trim();
            }
        }
        // Otherwise, try parsing with \n\n separator (for messages from database)
        // Only parse if it looks like context (first part is substantial, > 30 chars)
        // and the question part is reasonable (not too short, > 5 chars)
        else if (displayContent.includes('\n\n')) {
            const parts = displayContent.split('\n\n');
            if (parts.length >= 2) {
                const potentialContext = parts[0].trim();
                const potentialQuestion = parts.slice(1).join('\n\n').trim();

                // Heuristic: If first part is substantial (> 30 chars) and question exists and is reasonable (> 5 chars),
                // treat first part as context. This handles the case where context was concatenated.
                if (potentialContext.length > 30 && potentialQuestion.length > 5) {
                    contextText = potentialContext;
                    displayQuestion = potentialQuestion;
                }
            }
        }
    }

    const timestamp = message.updated_at || message.created_at;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                duration: 0.3,
                delay: index * 0.05,
                type: "spring",
                stiffness: 200
            }}
            className={`flex flex-col gap-2 group ${isUser ? "items-end" : "items-start"}`}
        >
            <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
                {/* Bot Avatar with brand square icon */}
                {!isUser && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-[#DB2B30] via-[#B52227] to-[#8A1B1F] flex items-center justify-center shadow-lg">
                        <Image
                            src="/assets/white-square-Icon.png"
                            alt="AI"
                            width={18}
                            height={18}
                            className="dark:hidden"
                        />
                        <Image
                            src="/assets/black-square-Icon.png"
                            alt="AI"
                            width={18}
                            height={18}
                            className="hidden dark:block"
                        />
                    </div>
                )}

                {/* User Avatar */}
                {isUser && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-[#DB2B30] via-[#B52227] to-[#8A1B1F] flex items-center justify-center shadow-lg">
                        <User className="w-4 h-4 text-white" />
                    </div>
                )}

                {/* Message Content */}
                <div
                    className={`relative max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl rounded-2xl px-4 py-3 ${
                        isUser
                            ? "bg-[#FFE5E6] dark:bg-[#5E0E12] border border-[#DB2B30] dark:border-[#8A1B1F] text-[#1A1A1A] dark:text-[#FDEBEB] shadow-sm"
                            : `bg-card border shadow-sm ${
                                  !isUser && isSelectedForArticle ? "border-[#DB2B30] ring-1 ring-[#DB2B30]/60" : ""
                              }`
                    }`}
                >
                    {/* Subtle shine effect for user messages */}
                    {isUser && (
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-50" />
                    )}

                    {!isUser && isStreaming && (!displayContent || displayContent === "") ? (
                        currentStatus ? (
                            // Show status message instead of 3-dot loader
                            <div className="relative z-10 py-2">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#DB2B30]" />
                                    <span className="text-xs text-muted-foreground">{currentStatus}</span>
                                </div>
                            </div>
                        ) : (
                            // Show 3-dot loader when no status
                            <div className="relative z-10 py-2">
                                <div className="flex gap-1.5">
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            className="w-2 h-2 bg-[#DB2B30] rounded-full"
                                            animate={{ y: [0, -5, 0] }}
                                            transition={{
                                                duration: 0.6,
                                                repeat: Infinity,
                                                delay: i * 0.15
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )
                    ) : (
                        <div
                            className={`relative z-10 text-sm sm:text-base leading-relaxed ${isUser ? "!text-white" : "text-foreground"}`}
                            style={isUser ? { color: "#FFFFFF" } : undefined}
                        >
                            {isUser ? (
                                <div className="space-y-2">
                                    {contextText ? (
                                <>
                                            <blockquote className="border-l-3 border-white/40 pl-3 italic text-white/90 text-sm bg-white/10 rounded-r py-2 mb-2">
                                                <span className="text-xs font-semibold text-white/70 mb-1 block uppercase tracking-wide">Context</span>
                                                <HighlightText
                                                    text={contextText}
                                                    searchQuery={searchQuery}
                                                    messageId={message.id}
                                                    currentMatchIndex={currentMatchIndex}
                                                    searchMatches={searchMatches}
                                                    isUserMessage={true}
                                                />
                                            </blockquote>
                                            <p className="mt-1 text-white">
                                                <HighlightText
                                                    text={displayQuestion}
                                                    searchQuery={searchQuery}
                                                    messageId={message.id}
                                                    currentMatchIndex={currentMatchIndex}
                                                    searchMatches={searchMatches}
                                                    isUserMessage={true}
                                                />
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-white">
                                            <HighlightText
                                                text={displayQuestion}
                                                searchQuery={searchQuery}
                                                messageId={message.id}
                                                currentMatchIndex={currentMatchIndex}
                                                searchMatches={searchMatches}
                                                isUserMessage={true}
                                            />
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div
                                    ref={messageRef}
                                    className={`markdown-content ${isStreaming ? 'streaming-cursor' : ''} select-text`}
                                    onMouseUp={(e) => {
                                        // Allow selection to complete before checking
                                        e.stopPropagation();
                                    }}
                                >
                                    <ReactMarkdown
                                        key={`md-${message.id}-${searchQuery}-${currentMatchIndex}`}
                                        remarkPlugins={[remarkGfm]}
                                        rehypePlugins={[rehypeHighlight]}
                                        components={{
                                            // Helper function to highlight text in children
                                            // This recursively processes children and highlights text strings
                                            // Customize code blocks
                                            code({ node, inline, className, children, ...props }: any) {
                                                const langPattern = 'language-(\\w+)';
                                                const languageRegex = new RegExp(langPattern);
                                                const match = languageRegex.exec(className || '');
                                                return !inline && match ? (
                                                    <pre className="bg-muted rounded-lg p-4 overflow-x-auto border border-border">
                                                        <code className={className} {...props}>
                                                            {children}
                                                        </code>
                                                    </pre>
                                                ) : (
                                                    <code className="bg-muted/50 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                                                        {children}
                                                    </code>
                                                );
                                            },
                                            // Customize paragraphs with text highlighting
                                            p({ children }: any) {
                                                const highlightChildren = (child: any): any => {
                                                    if (typeof child === 'string' && searchQuery.trim()) {
                                                        return (
                                                            <HighlightText
                                                                text={child}
                                                                searchQuery={searchQuery}
                                                                messageId={message.id}
                                                                currentMatchIndex={currentMatchIndex}
                                                                searchMatches={searchMatches}
                                                                isUserMessage={false}
                                                            />
                                                        );
                                                    }
                                                    if (Array.isArray(child)) {
                                                        return child.map((c, i) => <React.Fragment key={i}>{highlightChildren(c)}</React.Fragment>);
                                                    }
                                                    return child;
                                                };
                                                return <p className="mb-2 last:mb-0">{highlightChildren(children)}</p>;
                                            },
                                            // Customize lists
                                            ul({ children }: any) {
                                                return <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>;
                                            },
                                            ol({ children }: any) {
                                                return <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>;
                                            },
                                            // Customize list items with text highlighting
                                            li({ children }: any) {
                                                const highlightChildren = (child: any): any => {
                                                    if (typeof child === 'string' && searchQuery.trim()) {
                                                        return (
                                                            <HighlightText
                                                                text={child}
                                                                searchQuery={searchQuery}
                                                                messageId={message.id}
                                                                currentMatchIndex={currentMatchIndex}
                                                                searchMatches={searchMatches}
                                                                isUserMessage={false}
                                                            />
                                                        );
                                                    }
                                                    if (Array.isArray(child)) {
                                                        return child.map((c, i) => <React.Fragment key={i}>{highlightChildren(c)}</React.Fragment>);
                                                    }
                                                    return child;
                                                };
                                                return <li className="ml-4">{highlightChildren(children)}</li>;
                                            },
                                            // Helper to highlight children
                                            strong({ children }: any) {
                                                const highlightChildren = (child: any): any => {
                                                    if (typeof child === 'string' && searchQuery.trim()) {
                                                        return (
                                                            <HighlightText
                                                                text={child}
                                                                searchQuery={searchQuery}
                                                                messageId={message.id}
                                                                currentMatchIndex={currentMatchIndex}
                                                                searchMatches={searchMatches}
                                                                isUserMessage={false}
                                                            />
                                                        );
                                                    }
                                                    if (Array.isArray(child)) {
                                                        return child.map((c, i) => <React.Fragment key={i}>{highlightChildren(c)}</React.Fragment>);
                                                    }
                                                    return child;
                                                };
                                                return <strong>{highlightChildren(children)}</strong>;
                                            },
                                            em({ children }: any) {
                                                const highlightChildren = (child: any): any => {
                                                    if (typeof child === 'string' && searchQuery.trim()) {
                                                        return (
                                                            <HighlightText
                                                                text={child}
                                                                searchQuery={searchQuery}
                                                                messageId={message.id}
                                                                currentMatchIndex={currentMatchIndex}
                                                                searchMatches={searchMatches}
                                                                isUserMessage={false}
                                                            />
                                                        );
                                                    }
                                                    if (Array.isArray(child)) {
                                                        return child.map((c, i) => <React.Fragment key={i}>{highlightChildren(c)}</React.Fragment>);
                                                    }
                                                    return child;
                                                };
                                                return <em>{highlightChildren(children)}</em>;
                                            },
                                            // Customize headings with text highlighting
                                            h1({ children }: any) {
                                                const highlightChildren = (child: any): any => {
                                                    if (typeof child === 'string' && searchQuery.trim()) {
                                                        return (
                                                            <HighlightText
                                                                text={child}
                                                                searchQuery={searchQuery}
                                                                messageId={message.id}
                                                                currentMatchIndex={currentMatchIndex}
                                                                searchMatches={searchMatches}
                                                                isUserMessage={false}
                                                            />
                                                        );
                                                    }
                                                    if (Array.isArray(child)) {
                                                        return child.map((c, i) => <React.Fragment key={i}>{highlightChildren(c)}</React.Fragment>);
                                                    }
                                                    return child;
                                                };
                                                return <h1 className="text-2xl font-bold mb-2 mt-4 first:mt-0">{highlightChildren(children)}</h1>;
                                            },
                                            h2({ children }: any) {
                                                const highlightChildren = (child: any): any => {
                                                    if (typeof child === 'string' && searchQuery.trim()) {
                                                        return (
                                                            <HighlightText
                                                                text={child}
                                                                searchQuery={searchQuery}
                                                                messageId={message.id}
                                                                currentMatchIndex={currentMatchIndex}
                                                                searchMatches={searchMatches}
                                                                isUserMessage={false}
                                                            />
                                                        );
                                                    }
                                                    if (Array.isArray(child)) {
                                                        return child.map((c, i) => <React.Fragment key={i}>{highlightChildren(c)}</React.Fragment>);
                                                    }
                                                    return child;
                                                };
                                                return <h2 className="text-xl font-bold mb-2 mt-4 first:mt-0">{highlightChildren(children)}</h2>;
                                            },
                                            h3({ children }: any) {
                                                const highlightChildren = (child: any): any => {
                                                    if (typeof child === 'string' && searchQuery.trim()) {
                                                        return (
                                                            <HighlightText
                                                                text={child}
                                                                searchQuery={searchQuery}
                                                                messageId={message.id}
                                                                currentMatchIndex={currentMatchIndex}
                                                                searchMatches={searchMatches}
                                                                isUserMessage={false}
                                                            />
                                                        );
                                                    }
                                                    if (Array.isArray(child)) {
                                                        return child.map((c, i) => <React.Fragment key={i}>{highlightChildren(c)}</React.Fragment>);
                                                    }
                                                    return child;
                                                };
                                                return <h3 className="text-lg font-bold mb-2 mt-4 first:mt-0">{highlightChildren(children)}</h3>;
                                            },
                                            // Customize links with text highlighting
                                            a({ href, children }: any) {
                                                const highlightChildren = (child: any): any => {
                                                    if (typeof child === 'string' && searchQuery.trim()) {
                                                        return (
                                                            <HighlightText
                                                                text={child}
                                                                searchQuery={searchQuery}
                                                                messageId={message.id}
                                                                currentMatchIndex={currentMatchIndex}
                                                                searchMatches={searchMatches}
                                                                isUserMessage={false}
                                                            />
                                                        );
                                                    }
                                                    if (Array.isArray(child)) {
                                                        return child.map((c, i) => <React.Fragment key={i}>{highlightChildren(c)}</React.Fragment>);
                                                    }
                                                    return child;
                                                };
                                                return (
                                                    <a
                                                        href={href}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-violet-600 dark:text-violet-400 hover:underline"
                                                    >
                                                        {highlightChildren(children)}
                                                    </a>
                                                );
                                            },
                                            // Customize blockquotes with text highlighting
                                            blockquote({ children }: any) {
                                                const highlightChildren = (child: any): any => {
                                                    if (typeof child === 'string' && searchQuery.trim()) {
                                                        return (
                                                            <HighlightText
                                                                text={child}
                                                                searchQuery={searchQuery}
                                                                messageId={message.id}
                                                                currentMatchIndex={currentMatchIndex}
                                                                searchMatches={searchMatches}
                                                                isUserMessage={false}
                                                            />
                                                        );
                                                    }
                                                    if (Array.isArray(child)) {
                                                        return child.map((c, i) => <React.Fragment key={i}>{highlightChildren(c)}</React.Fragment>);
                                                    }
                                                    return child;
                                                };
                                                return (
                                                    <blockquote className="border-l-4 border-violet-500 pl-4 italic my-2 text-muted-foreground">
                                                        {highlightChildren(children)}
                                                    </blockquote>
                                                );
                                            },
                                            // Customize tables
                                            table({ children }: any) {
                                                return (
                                                    <div className="overflow-x-auto my-2">
                                                        <table className="min-w-full border-collapse border border-border">
                                                            {children}
                                                        </table>
                                                    </div>
                                                );
                                            },
                                            th({ children }: any) {
                                                return (
                                                    <th className="border border-border px-4 py-2 bg-muted font-semibold">
                                                        {children}
                                                    </th>
                                                );
                                            },
                                            td({ children }: any) {
                                                return (
                                                    <td className="border border-border px-4 py-2">
                                                        {children}
                                                    </td>
                                                );
                                            },
                                        }}
                                    >
                                        {displayContent}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Timestamp - inside bubble at bottom */}
                    {timestamp && (
                        <p className={`relative z-10 text-[10px] mt-2 pt-1 border-t ${isUser ? "border-white/20 text-white/70" : "border-border text-muted-foreground"}`}>
                            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    )}
                </div>
            </div>

            {/* Copy / Article actions for bot messages - appears below bubble on hover */}
            {!isUser && displayContent && (
                <div className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-wrap gap-1 ${isUser ? "mr-11" : "ml-11"}`}>
                    <Button
                        onClick={handleCopy}
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        title={copied ? "Copied!" : "Copy message"}
                    >
                        {copied ? (
                            <>
                                <Check className="h-3 w-3 mr-1 text-[#DB2B30]" />
                                Copied
                            </>
                        ) : (
                            <>
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={() => {
                            if (onCreateArticle && displayContent) {
                                onCreateArticle(displayContent, message.id);
                            }
                        }}
                        size="sm"
                        variant={isSelectedForArticle ? "default" : "ghost"}
                        className={`h-7 px-2 text-xs flex items-center gap-1 ${
                            isSelectedForArticle
                                ? "bg-[#DB2B30] text-white hover:bg-[#B52227]"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                        title={isSelectedForArticle ? "Remove from article selection" : "Add/remove this response in article selection"}
                    >
                        {isSelectedForArticle ? (
                            <>
                                <Check className="h-3 w-3" />
                                Selected
                            </>
                        ) : (
                            <>
                                <PenTool className="h-3 w-3" />
                                Select for Article
                            </>
                        )}
                    </Button>
                </div>
            )}

            {/* Context popup for selected text */}
            {!isUser && showContextPopup && selectedText && (
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    data-context-popup
                    className="fixed z-50 bg-card border rounded-lg shadow-lg p-1.5"
                    style={{
                        left: `${popupPosition.x}px`,
                        top: `${popupPosition.y}px`,
                        transform: 'translate(-50%, -100%)',
                        marginTop: '-8px'
                    }}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                >
                    <Button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (onAddContext && selectedText) {
                                onAddContext(selectedText);
                            }
                            // Clear selection and close popup
                            window.getSelection()?.removeAllRanges();
                            setShowContextPopup(false);
                            setSelectedText("");
                        }}
                        size="sm"
                        variant="default"
                        className="h-7 px-2.5 text-xs bg-[#DB2B30] hover:bg-[#B52227] text-white"
                    >
                        <Plus className="h-3 w-3 mr-1.5" />
                        Add as Context
                    </Button>
                </motion.div>
            )}
        </motion.div>
    );
}

function TypingIndicator() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex gap-3 justify-start"
        >
            <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-[#DB2B30] via-[#B52227] to-[#8A1B1F] flex items-center justify-center shadow-lg">
                <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-card border rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-2 h-2 bg-[#DB2B30] rounded-full"
                            animate={{ y: [0, -5, 0] }}
                            transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: i * 0.15
                            }}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

export default function Chat() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const chatId = params.chatId as string;
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchMatches, setSearchMatches] = useState<Array<{ messageId: number; matchIndex: number; textOffset?: number; isUserMatch?: boolean }>>([]);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
    const [streamingMessageId, setStreamingMessageId] = useState<number | null>(null);
    const streamingMessageIdRef = useRef<number | null>(null);
    const [currentChatTabId, setCurrentChatTabId] = useState<string | null>(null); // UUID as string
    const [agentMode, setAgentMode] = useState(false);
    const [selectedModel, setSelectedModel] = useState<string>("default");
    const [settingsSheetOpen, setSettingsSheetOpen] = useState(false);
    const [enabledTones, setEnabledTones] = useState<string[]>([]);
    const [customInstructions, setCustomInstructions] = useState("");
    const [currentStatus, setCurrentStatus] = useState<string | null>(null);
    const [selectedContext, setSelectedContext] = useState<{
        type: 'text' | null;
        id: number | null;
        name: string | null;
        text?: string | null;
    }>({ type: null, id: null, name: null, text: null });
    const { data: userProfile } = useUserProfile();
    const { data: settingsData, isLoading: settingsLoading } = useGetUserSettings();
    const updateUserSettings = useUpdateUserSettings();
    const hasInitializedModelRef = useRef(false);

    useEffect(() => {
        if (hasInitializedModelRef.current || !settingsData?.data) return;
        hasInitializedModelRef.current = true;
        const pref = settingsData.data.preferred_chat_model;
        if (pref != null && pref !== "") setSelectedModel(pref);
    }, [settingsData]);

    useEffect(() => {
        if (!settingsData?.data) return;
        if (settingsData.data.enabled_tones != null) {
            setEnabledTones(settingsData.data.enabled_tones);
        }
        if (settingsData.data.custom_instructions != null) {
            setCustomInstructions(settingsData.data.custom_instructions);
        }
    }, [settingsData?.data]);

    const handleToneToggle = useCallback(
        (slug: string, checked: boolean) => {
            // Only one tone at a time: selecting one clears any previous selection
            const next = checked ? [slug] : [];
            setEnabledTones(next);
            updateUserSettings.mutate({ enabled_tones: next.length ? next : null });
        },
        [updateUserSettings]
    );

    const toneOptions: { slug: string; label: string; description: string }[] = [
        {
            slug: "informal",
            label: "Informal",
            description: "Loose, conversational wording that sounds like a real-time chat with a colleague, using everyday language and contractions.",
        },
        {
            slug: "professional",
            label: "Professional",
            description: "Polished, confident language that feels business-ready without being stiff, with clear structure and measured wording.",
        },
        {
            slug: "concise",
            label: "Concise",
            description: "Short, efficient sentences that strip away filler and focus on the essential points so readers can scan quickly.",
        },
        {
            slug: "friendly",
            label: "Friendly",
            description: "Warm, welcoming language that feels supportive and encouraging, with soft edges and inclusive phrasing.",
        },
        {
            slug: "formal",
            label: "Formal",
            description: "Structured, respectful language that avoids slang and contractions, similar to a report or official communication.",
        },
        {
            slug: "technical",
            label: "Technical",
            description: "Precise terminology and domain-specific language that focuses on how things work, assuming some subject familiarity.",
        },
        {
            slug: "empathetic",
            label: "Empathetic",
            description: "Gentle, validating language that acknowledges emotions first and then moves into guidance or solutions.",
        },
        {
            slug: "direct",
            label: "Direct",
            description: "Straight-to-the-point language that says what needs to be said clearly, with minimal softening or extra context.",
        },
    ];

    const handleModelChange = useCallback(
        (slug: string) => {
            setSelectedModel(slug);
            updateUserSettings.mutate({ preferred_chat_model: slug });
        },
        [updateUserSettings]
    );

    const getGreeting = () => {
        const hour = new Date().getHours();
        // 5:00–11:59 → morning
        // 12:00–17:59 → afternoon
        // 18:00–4:59 → evening (covers late night / very early hours)
        if (hour >= 5 && hour < 12) return "morning";
        if (hour >= 12 && hour < 18) return "afternoon";
        return "evening";
    };

    const timeOfDay = getGreeting();
    const firstName = userProfile?.data?.full_name
        ? userProfile.data.full_name.split(" ")[0]
        : null;

    const handleAddTextContext = (text: string) => {
        // Truncate long text (max 200 characters for display)
        const maxLength = 200;
        const displayName = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;

        setSelectedContext({
            type: 'text',
            id: null,
            name: displayName,
            text: text // Store full text for API
        });
        // Clear selection
        window.getSelection()?.removeAllRanges();

        // Focus the input after adding context
        setTimeout(() => {
            inputRef.current?.focus();
        }, 0);
    };

    const [selectedArticleMessageIds, setSelectedArticleMessageIds] = useState<number[]>([]);

    // Clicking "Select for Article" on a message now toggles it in the multi-select list.
    // The actual article is created from the bottom selection bar.
    const handleCreateArticle = (_content: string, messageId?: number) => {
        if (typeof messageId !== "number") return;

        setSelectedArticleMessageIds((prev) =>
            prev.includes(messageId)
                ? prev.filter((id) => id !== messageId)
                : [...prev, messageId]
        );
    };

    const handleCreateArticleFromSelection = () => {
        const selectedMessagesInOrder = messages.filter(
            (msg) => msg.answer && !msg.question && selectedArticleMessageIds.includes(msg.id)
        );

        const combinedContent = selectedMessagesInOrder
            .map((msg) => msg.answer || "")
            .filter(Boolean)
            .join("\n\n");

        if (!combinedContent.trim()) {
            toast.error("Please select at least one AI response to create an article.");
            return;
        }

        sessionStorage.setItem("pendingArticleContent", combinedContent);
        setSelectedArticleMessageIds([]);
        router.push("/dashboard/articles/new");
    };

    // Helper function to generate a meaningful title from the first question
    const generateChatTitle = (question: string): string => {
        if (!question || !question.trim()) {
            console.log("generateChatTitle: empty question");
            return "New Chat";
        }

        console.log("generateChatTitle: input question:", question.substring(0, 100));

        // Remove context separator if present
        let cleanQuestion = question;
        if (question.includes(CONTEXT_SEPARATOR)) {
            const parts = question.split(CONTEXT_SEPARATOR);
            cleanQuestion = parts[1]?.trim() || parts[0]?.trim() || question;
            console.log("generateChatTitle: after CONTEXT_SEPARATOR:", cleanQuestion.substring(0, 100));
        }

        // Remove context if it's in the format "context\n\nquestion"
        // Only do this if the first part is clearly context (longer than 30 chars)
        const parts = cleanQuestion.split('\n\n');
        let actualQuestion = cleanQuestion.trim();
        if (parts.length > 1 && parts[0].trim().length > 30) {
            // First part looks like context, use the rest
            actualQuestion = parts.slice(1).join('\n\n').trim();
            console.log("generateChatTitle: after context removal:", actualQuestion.substring(0, 100));
        }

        // If still empty after processing, use the original
        if (!actualQuestion || actualQuestion.length === 0) {
            actualQuestion = cleanQuestion.trim();
        }

        // Take first line if multi-line, or first 60 chars for processing
        const firstLine = actualQuestion.split('\n')[0].trim();
        let title = firstLine.length > 0 && firstLine.length <= 60
            ? firstLine
            : actualQuestion.substring(0, 60).trim();

        // Map common short greetings/questions to meaningful titles
        const shortQuestionMap: Record<string, string> = {
            'hi': 'Introduction',
            'hello': 'Introduction',
            'hey': 'Introduction',
            'hey there': 'Introduction',
            'hi there': 'Introduction',
            'hello there': 'Introduction',
            'what': 'Question',
            'what?': 'Question',
            'why': 'Question',
            'why?': 'Question',
            'how': 'Question',
            'how?': 'Question',
            'who': 'Question',
            'who?': 'Question',
            'when': 'Question',
            'when?': 'Question',
            'where': 'Question',
            'where?': 'Question',
            'help': 'Help',
            'help?': 'Help',
            'thanks': 'Thank You',
            'thank you': 'Thank You',
            'thanks!': 'Thank You',
            'thank you!': 'Thank You',
        };

        // Check if it's a short question that we have a mapping for
        const lowerTitle = title.toLowerCase().trim();
        if (shortQuestionMap[lowerTitle]) {
            console.log("generateChatTitle: mapped short question to:", shortQuestionMap[lowerTitle]);
            return shortQuestionMap[lowerTitle];
        }

        // Remove common question starters and make it more title-like
        // Remove question words at the start if they're standalone
        const questionWordsRegex = new RegExp('^(what|why|how|who|when|where|can|could|should|would|will|is|are|do|does|did)\\s+', 'i');
        title = title.replace(questionWordsRegex, '');

        // Remove trailing punctuation and question marks
        const punctuationRegex = new RegExp('[.,;:!?]+$');
        title = title.replace(punctuationRegex, '');

        // Remove common filler words/phrases at the start
        const fillerWordsRegex = new RegExp('^(can you|could you|please|i want|i need|i would like|tell me|explain|describe)\\s+', 'i');
        title = title.replace(fillerWordsRegex, '');

        // If it starts with "what is" or "what are", remove those
        const whatIsRegex = new RegExp('^what\\s+(is|are)\\s+', 'i');
        title = title.replace(whatIsRegex, '');

        // Capitalize first letter of each word for better title format
        // But preserve acronyms and important capitalization
        const wordsRegex = new RegExp('\\s+');
        const words = title.split(wordsRegex);
        const capitalizedWords = words.map((word, index) => {
            // Keep acronyms (all caps) as-is
            const acronymRegex = new RegExp('^[A-Z]+$');
            if (word === word.toUpperCase() && word.length > 1 && acronymRegex.test(word)) {
                return word;
            }
            // Capitalize first letter, lowercase the rest
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        });
        title = capitalizedWords.join(' ');

        // Truncate to max 50 characters, but try to break at word boundary
        if (title.length > 50) {
            const truncated = title.substring(0, 50);
            const lastSpace = truncated.lastIndexOf(' ');
            // If we can break at a word boundary, do so
            if (lastSpace > 30) {
                title = truncated.substring(0, lastSpace);
            } else {
                title = truncated;
            }
        }

        // Remove trailing punctuation again (in case truncation added some)
        const finalPunctuationRegex = new RegExp('[.,;:!?]+$');
        title = title.replace(finalPunctuationRegex, '').trim();

        console.log("generateChatTitle: final title:", title);

        // If empty or too short (less than 2 chars), use default
        if (!title || title.length < 2) {
            console.log("generateChatTitle: title too short, using default");
            return "New Chat";
        }

        return title;
    };

    // Async function to rename chat tab (only for new chats, first response)
    // This function ensures it only runs once per chat tab, even if called multiple times
    const renameChatTabIfNeeded = async (chatTabId: string, firstQuestion: string, isNewChat: boolean) => { // UUID as string
        // Early return checks - must pass all to proceed
        if (!chatTabId || chatTabId.trim() === "") {
            console.log("Skipping rename - invalid chatTabId:", { chatTabId });
            return;
        }

        // Allow rename for new chats OR if chat was cleared (not in renamed set (e.g., cleared chat)
        // that can be renamed again when user sends first message after clearing)
        const canRename = isNewChat || !hasRenamedChatRef.current.has(chatTabId);
        if (!canRename) {
            console.log("Skipping rename - not a new chat and already renamed:", { chatTabId, isNewChat });
            return;
        }

        // Check if already renamed (completed) - this is now redundant but kept for safety
        if (hasRenamedChatRef.current.has(chatTabId) && !isNewChat) {
            console.log("Skipping rename - already renamed:", { chatTabId });
            return;
        }

        // Check if rename is already in progress
        if (isRenamingChatRef.current.has(chatTabId)) {
            console.log("Skipping rename - already in progress:", { chatTabId });
            return;
        }

        if (!firstQuestion || !firstQuestion.trim()) {
            console.log("Skipping rename - no question provided:", { chatTabId, firstQuestion });
            return;
        }

        // Mark as in-progress immediately to prevent duplicate calls (race condition protection)
        isRenamingChatRef.current.add(chatTabId);

        try {
            const newTitle = generateChatTitle(firstQuestion);
            console.log("Renaming chat tab:", { chatTabId, newTitle, originalQuestion: firstQuestion.substring(0, 100), questionLength: firstQuestion.length });

            // Only rename if the title is different from default
            if (newTitle && newTitle !== "New Chat") {
                // Run asynchronously without blocking
                await updateChatTabName(chatTabId, newTitle);
                console.log("Chat tab renamed successfully:", newTitle);

                // Mark as renamed (completed) - only after successful rename
                hasRenamedChatRef.current.add(chatTabId);

                // Invalidate chat tabs to refresh the list with new name
                // Use predicate to match all chatTabs queries regardless of tenant ID
                queryClient.invalidateQueries({
                    predicate: (query) => {
                        const key = query.queryKey;
                        return Array.isArray(key) && key.length >= 1 && key[0] === "chatTabs";
                    }
                });
            } else {
                console.log("Skipping rename - title is default or empty:", newTitle, "from question:", firstQuestion.substring(0, 50));
                // Mark as renamed even if we skip (to prevent retrying with same question)
                hasRenamedChatRef.current.add(chatTabId);
            }
        } catch (error) {
            // Log error for debugging
            console.error("Failed to rename chat tab:", error);
            // Remove from in-progress set so we can retry if needed (but keep in renamed set to prevent infinite retries)
            isRenamingChatRef.current.delete(chatTabId);
            // Don't add to hasRenamedChatRef on error, so it won't retry automatically
        } finally {
            // Always remove from in-progress set
            isRenamingChatRef.current.delete(chatTabId);
        }
    };
    const lastLoadedChatIdRef = useRef<string | null>(null);
    const isCreatingNewChatRef = useRef<boolean>(false);
    const lastChatHistoryMessageCountRef = useRef<number>(-1);
    const hasRenamedChatRef = useRef<Set<string>>(new Set()); // Track which chats have been renamed (UUID strings)
    const isRenamingChatRef = useRef<Set<string>>(new Set()); // Track which chats are currently being renamed (UUID strings)
    const currentStreamingChatTabIdRef = useRef<string | null>(null); // Track chat tab ID for current stream (UUID string)
    const currentStreamingQuestionRef = useRef<string | null>(null); // Track question for current stream
    const wasNewChatRef = useRef<boolean>(false); // Track if this stream started as a new chat
    const chatCreatedRef = useRef<boolean>(false); // Track if chat has been created (onStart called)

    // Load chat tabs to check if we should show landing page
    const currentTenantId = useAuthStore((s) => s.tenantId);
    const hydrated = useAuthStore((s) => s.hydrated);

    // Get brain space store values
    const { currentBrainSpaceId } = useBrainSpaceStore();

    // Get workspaces and collections for knowledge base filtering
    const { data: workspaces } = useUserWorkspaces();
    const { data: collections } = useUserCollections(currentBrainSpaceId || undefined);

    // Invalidate and refetch chat tabs when tenantId becomes available after hydration
    useEffect(() => {
        console.log("[ChatTabs] useEffect - currentTenantId:", currentTenantId, "hydrated:", hydrated);
        if (currentTenantId && hydrated) {
            console.log("[ChatTabs] TenantId and hydrated available, invalidating query...");
            queryClient.invalidateQueries({
                queryKey: ["chatTabs", currentTenantId],
                refetchType: "active" // Only refetch active queries
            });
        } else if (currentTenantId && !hydrated) {
            console.log("[ChatTabs] WARNING: TenantId available but not hydrated yet. Query will be disabled.");
        }
    }, [currentTenantId, hydrated, queryClient]);

    // Watch for hydration to complete
    useEffect(() => {
        if (hydrated) {
            console.log("[ChatTabs] Hydration completed! currentTenantId:", currentTenantId);
        }
    }, [hydrated, currentTenantId]);

    // Allow query to run if we have tenantId, even if not hydrated yet (hydration might be delayed)
    // This ensures chat tabs load on refresh
    const queryEnabled = !!currentTenantId;
    console.log("[ChatTabs] Query enabled check:", { currentTenantId, hydrated, queryEnabled });

    const { data: chatTabs = [], isLoading: isLoadingChatTabs, isFetching: isFetchingChatTabs } = useQuery({
        queryKey: ["chatTabs", currentTenantId],
        queryFn: async () => {
            console.log("[ChatTabs] Fetching chat tabs, tenantId:", currentTenantId);
            const result = await getChatTabs();
            console.log("[ChatTabs] Fetched chat tabs:", result.length);
            return result;
        },
        enabled: queryEnabled, // Only require tenantId (hydration check removed for now)
        staleTime: 0, // Always consider data stale to ensure refetch
        refetchOnWindowFocus: false, // Don't refetch when window regains focus
        refetchOnMount: true, // Refetch on mount
    });

    // Debug: Log query state
    useEffect(() => {
        console.log("[ChatTabs] Query state:", {
            currentTenantId,
            hydrated,
            enabled: !!currentTenantId && hydrated,
            isLoading: isLoadingChatTabs,
            isFetching: isFetchingChatTabs,
            chatTabsCount: chatTabs.length,
        });
    }, [currentTenantId, hydrated, isLoadingChatTabs, isFetchingChatTabs, chatTabs.length]);


    // Track if we're transitioning from "new" to a chat ID (new chat creation)
    useEffect(() => {
        // Don't update flags if we're currently streaming (onStart already set them)
        if (isStreaming) {
            return;
        }

        // On page refresh, reset flags if we're on an existing chat (not "new")
        // This ensures we don't incorrectly block history loading
        if (chatId !== "new" && lastLoadedChatIdRef.current === null) {
            // This is a page refresh on an existing chat - reset flags
            isCreatingNewChatRef.current = false;
            chatCreatedRef.current = false;
            lastChatHistoryMessageCountRef.current = -1;
        }

        if (chatId === "new") {
            isCreatingNewChatRef.current = true;
            chatCreatedRef.current = false; // Reset when going to "new"
            lastChatHistoryMessageCountRef.current = -1; // Reset when going to "new"
        } else if (chatId !== "new" && lastLoadedChatIdRef.current === "new") {
            // We just transitioned from "new" to a chat ID - this is a new chat creation
            // Only set flag if we're actually creating (not just navigating)
            // The flag should already be set by handleSend or onStart
            if (!isCreatingNewChatRef.current) {
                isCreatingNewChatRef.current = true;
            }
            // Don't reset chatCreatedRef here - it should be set by onStart
            lastChatHistoryMessageCountRef.current = -1; // Reset for new chat
        } else if (chatId !== "new" && lastLoadedChatIdRef.current !== "new" && lastLoadedChatIdRef.current !== chatId && lastLoadedChatIdRef.current !== null) {
            // We're switching from one chat ID to another - this is selecting an existing chat
            // Only do this if lastLoadedChatIdRef is not null (not a page refresh)
            isCreatingNewChatRef.current = false;
            chatCreatedRef.current = false; // Reset when switching chats
            lastChatHistoryMessageCountRef.current = -1; // Reset when switching chats
        }
    }, [chatId, isStreaming]);

    // Load chat history - only when selecting an existing chat tab, not when creating a new chat
    // Only enable if chatId is valid, not "new", tenant exists, and we're not creating a new chat
    const shouldLoadHistory = !!(chatId && chatId !== "new" && currentTenantId && !isCreatingNewChatRef.current);
    const { data: chatHistory, isLoading: isLoadingHistory, isFetching: isFetchingHistory, refetch: refetchHistory } = useQuery({
        queryKey: ["chatHistory", chatId, currentTenantId],
        queryFn: async () => {
            if (chatId && chatId !== "new" && currentTenantId) {
                try {
                    const history = await getChatHistory(chatId); // chatId is already a UUID string
                    // Handle case where chat tab doesn't exist (returns empty list)
                    if (history.chat_tab) {
                        setCurrentChatTabId(history.chat_tab.id);
                    } else {
                        // Chat tab doesn't exist, return empty history
                        return {
                            chat_tab: null,
                            messages: []
                        };
                    }
                    return history;
                } catch (error: any) {
                    console.error("Error loading chat history:", error);
                    // Log the full error for debugging
                    if (error.response?.data) {
                        console.error("Error response data:", error.response.data);
                    }
                    // Don't show error toast for 404/422 - just return empty
                    if (error.response?.status === 404 || error.response?.status === 422) {
                        return {
                            chat_tab: null,
                            messages: []
                        };
                    }
                    toast.error(`Failed to load chat history: ${error.message || "Unknown error"}`);
                    return {
                        chat_tab: null,
                        messages: []
                    };
                }
            }
            return null;
        },
        enabled: shouldLoadHistory,
        retry: false, // Don't retry on 404/422 errors
        refetchOnWindowFocus: false, // Don't refetch when window regains focus
        refetchOnMount: false, // Don't refetch on mount - only load when chatId changes
        staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    });

    // Check for pending question from landing page and auto-send
    useEffect(() => {
        if (chatId === "new") {
            const pendingQuestion = sessionStorage.getItem("pendingChatQuestion");
            const pendingAgentMode = sessionStorage.getItem("pendingChatAgentMode");

            if (pendingQuestion && !isStreaming) {
                // Clear the pending question immediately
                sessionStorage.removeItem("pendingChatQuestion");
                sessionStorage.removeItem("pendingChatAgentMode");

                // Set agent mode if it was set
                if (pendingAgentMode === "true") {
                    setAgentMode(true);
                }

                // Auto-send the message
                const originalQuestion = pendingQuestion.trim();
                if (originalQuestion) {
                    // For pending questions, we don't have knowledge base context yet
                    // Just use selected context if available
                    const contextToSend = selectedContext.type === 'text' && selectedContext.text
                        ? selectedContext.text
                        : null;

                    // Store question with context separator for display parsing
                    const storedQuestion = contextToSend
                        ? `${contextToSend}${CONTEXT_SEPARATOR}${originalQuestion}`
                        : originalQuestion;

                    // Prepare context object for backend API (separate from question)
                    const contextForBackend = contextToSend
                        ? { type: 'text' as const, text: contextToSend }
                        : undefined;

                    // Use original question without concatenation - context will be passed separately
                    const questionForBackend = originalQuestion;

                    // Add user message immediately
                    const userMessage: ChatMessage = {
                        id: Date.now(),
                        chat_tab_id: "", // Will be updated with real UUID
                        question: storedQuestion, // Store with separator for parsing
                        answer: null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    };

                    // Don't create bot message placeholder - will be created when we receive first chunk
                    setMessages([userMessage]);
                    // Don't set streamingMessageId yet - will be set in onStart

                    // Clear context immediately after message is sent
                    setSelectedContext({ type: null, id: null, name: null, text: null });

                    // If we're on a new chat, mark it as creating BEFORE starting stream
                    // This prevents the history query from starting when URL changes
                    if (chatId === "new" || !currentChatTabId) {
                        isCreatingNewChatRef.current = true;
                        lastLoadedChatIdRef.current = "new";
                    }

                    // Start streaming
                    setIsStreaming(true);

                    // Create abort controller for this stream
                    const abortController = new AbortController();
                    abortControllerRef.current = abortController;

                    try {
                        const controller = streamChat(
                            questionForBackend, // Send original question without context concatenation
                            undefined, // No chat_tab_id - will create new one
                            pendingAgentMode === "true",
                            contextForBackend, // Pass context separately so backend can use it in system prompt
                            {
                                onStart: (messageId, chatTabId, streamId) => {
                                    setCurrentStatus(null);
                                    // Mark chat as created
                                    chatCreatedRef.current = true;
                                    // Update with real IDs (chatTabId is UUID string)
                                    const previousChatTabId = currentChatTabId;
                                    setCurrentChatTabId(chatTabId);
                                    setStreamingMessageId(messageId);
                                    streamingMessageIdRef.current = messageId;
                                    currentStreamingChatTabIdRef.current = chatTabId;
                                    currentStreamingQuestionRef.current = originalQuestion;

                                    // Track if this is a new chat (no existing chatTabId before)
                                    const isNewChat = chatId === "new" || !previousChatTabId;
                                    wasNewChatRef.current = isNewChat;
                                    if (isNewChat) {
                                        isCreatingNewChatRef.current = true;
                                    }

                                    // Create bot message when chat is created (onStart)
                                    // Only create if it doesn't exist yet
                                    setMessages((prev) => {
                                        const hasBotMessage = prev.some(msg => msg.id === messageId || (msg.id === streamingMessageIdRef.current && !msg.question));
                                        if (hasBotMessage) {
                                            // Update existing bot message with real ID
                                            return prev.map(msg =>
                                                (msg.id === streamingMessageIdRef.current && !msg.question)
                                                    ? { ...msg, id: messageId, chat_tab_id: chatTabId }
                                                    : msg
                                            );
                                        }
                                        // Create new bot message
                                        const botMessage: ChatMessage = {
                                            id: messageId,
                                            chat_tab_id: chatTabId, // UUID string
                                            question: "",
                                            answer: "",
                                            created_at: new Date().toISOString(),
                                            updated_at: new Date().toISOString(),
                                        };
                                        return [...prev, botMessage];
                                    });

                                    // Update URL without reload (only if we're still on /chat/new)
                                    if (chatId === "new") {
                                        // Mark that we're creating a new chat BEFORE updating URL
                                        // This prevents history from loading when chatId changes
                                        isCreatingNewChatRef.current = true;
                                        lastLoadedChatIdRef.current = "new";
                                        // Use window.history to update URL without reload
                                        window.history.replaceState(null, "", `/chat/${chatTabId}`);
                                    }

                                    // Rename chat tab immediately when first question is sent (don't wait for response)
                                    // This happens asynchronously and doesn't block the stream
                                    if (isNewChat && chatTabId && originalQuestion) {
                                        console.log("onStart - renaming chat tab immediately:", { chatTabId, question: originalQuestion.substring(0, 50) });
                                        renameChatTabIfNeeded(chatTabId, originalQuestion, isNewChat);
                                    }
                                },
                                onChunk: (content) => {
                                    setMessages((prev) => {
                                        const currentStreamingId = streamingMessageIdRef.current;
                                        if (!currentStreamingId) {
                                            // If no streaming ID yet, create bot message (shouldn't happen, but handle it)
                                            const botMessage: ChatMessage = {
                                                id: Date.now(),
                                                chat_tab_id: currentChatTabId || "",
                                                question: "",
                                                answer: content,
                                                created_at: new Date().toISOString(),
                                                updated_at: new Date().toISOString(),
                                            };
                                            streamingMessageIdRef.current = botMessage.id;
                                            return [...prev, botMessage];
                                        }

                                        // Find the message with the streaming ID
                                        const messageIndex = prev.findIndex(msg => msg.id === currentStreamingId);
                                        if (messageIndex === -1) {
                                            // Bot message doesn't exist yet, create it
                                            const botMessage: ChatMessage = {
                                                id: currentStreamingId,
                                                chat_tab_id: currentChatTabId || "",
                                                question: "",
                                                answer: content,
                                                created_at: new Date().toISOString(),
                                                updated_at: new Date().toISOString(),
                                            };
                                            return [...prev, botMessage];
                                        }

                                        // Update existing bot message
                                        const updated = [...prev];
                                        const streamingMsg = updated[messageIndex];
                                        updated[messageIndex] = {
                                            ...streamingMsg,
                                            answer: (streamingMsg.answer || "") + content,
                                        };
                                        return updated;
                                    });
                                },
                                onStatus: (status, step) => {
                                    // Always show status messages (not just in agent mode)
                                    setCurrentStatus(status);
                                },
                                onComplete: () => {
                                    const completedMessageId = streamingMessageIdRef.current;
                                    setIsStreaming(false);
                                    setStreamingMessageId(null);
                                    setCurrentStatus(null);
                                    abortControllerRef.current = null;
                                    // Invalidate chat tabs after completion to update the list (e.g., new chat created)
                                    queryClient.invalidateQueries({
                                        predicate: (query) => {
                                            const key = query.queryKey;
                                            return Array.isArray(key) && key.length >= 1 && key[0] === "chatTabs";
                                        }
                                    });
                                    // Clear refs
                                    currentStreamingChatTabIdRef.current = null;
                                    currentStreamingQuestionRef.current = null;
                                    wasNewChatRef.current = false;
                                    chatCreatedRef.current = false;
                                },
                                onStop: async () => {
                                    setIsStreaming(false);
                                    setStreamingMessageId(null);
                                    setCurrentStatus(null);
                                    abortControllerRef.current = null;
                                    toast.info("Response stopped. Partial response saved.");
                                    // Wait for backend to save, then refetch to get the saved partial response
                                    setTimeout(async () => {
                                        if (chatId && chatId !== "new") {
                                            try {
                                                await refetchHistory();
                                            } catch (error) {
                                                console.error("Error refetching history after stop:", error);
                                            }
                                        }
                                    }, 1000); // Increased delay to ensure backend has time to save
                                },
                                onError: (error) => {
                                    setIsStreaming(false);
                                    setStreamingMessageId(null);
                                    setCurrentStatus(null);
                                    abortControllerRef.current = null;
                                    chatCreatedRef.current = false;
                                    // Clear context even on error (message was attempted to be sent)
                                    setSelectedContext({ type: null, id: null, name: null, text: null });
                                    toast.error(`Error: ${error}`);
                                },
                            },
                            selectedModel
                        );

                        abortControllerRef.current = controller;
                    } catch (error: any) {
                        setIsStreaming(false);
                        setStreamingMessageId(null);
                        chatCreatedRef.current = false;
                        // Clear context even on error (message was attempted to be sent)
                        setSelectedContext({ type: null, id: null, name: null, text: null });
                        toast.error(`Failed to send message: ${error.message}`);
                    }
                }
            }
        }
    }, [chatId, isStreaming, router, queryClient, refetchHistory, selectedModel]);

    // Update messages when history loads (only on initial load or when chatId changes)
    useEffect(() => {
        // Check if this is a new chat (chatId changed)
        const isNewChat = lastLoadedChatIdRef.current !== chatId;

        if (chatHistory && typeof chatHistory === 'object' && 'messages' in chatHistory) {
            const currentMessageCount = chatHistory.messages?.length || 0;
            const previousMessageCount = lastChatHistoryMessageCountRef.current;

            // If chatHistory exists but has no messages (cleared chat), clear local messages
            if (currentMessageCount === 0) {
                // Only clear messages if:
                // 1. We're viewing this chat and not streaming
                // 2. This is a transition from having messages to having no messages (cleared)
                //    OR it's a new chat load with no messages
                // Don't clear if we previously had 0 messages and still have 0 (to avoid clearing newly added local messages)
                if (chatId !== "new" && !isStreaming) {
                    // Clear if: transitioning from messages to empty, OR it's a new chat with no messages
                    if (previousMessageCount > 0 || isNewChat) {
                        setMessages([]);
                        lastLoadedChatIdRef.current = chatId;

                        // If chat was cleared (had messages before, now empty), reset rename flag
                        // This allows the chat to be renamed again when user sends a new message
                        if (previousMessageCount > 0 && chatId && chatId !== "new") {
                            console.log("Chat cleared - resetting rename flag for:", chatId);
                            hasRenamedChatRef.current.delete(chatId);
                            isRenamingChatRef.current.delete(chatId);
                        }
                    }
                    lastChatHistoryMessageCountRef.current = 0;
                } else {
                    lastChatHistoryMessageCountRef.current = 0;
                }
                return;
            }

            // Update the message count reference
            lastChatHistoryMessageCountRef.current = currentMessageCount;

            // Only load/replace history if:
            // 1. We haven't loaded this chat yet (isNewChat)
            // 2. We're not currently streaming (to avoid overwriting streaming messages)
            // 3. We're not creating a new chat (coming from "new")
            if (isNewChat && !isStreaming && chatHistory.messages && !isCreatingNewChatRef.current) {
                const formattedMessages: ChatMessage[] = [];
                chatHistory.messages.forEach((msg: ChatMessage) => {
                    // Add user message (question)
                    if (msg.question) {
                        formattedMessages.push({
                            ...msg,
                            answer: null, // Clear answer for user message display
                        });
                    }
                    // Add bot response (answer) if exists
                    if (msg.answer) {
                        formattedMessages.push({
                            ...msg,
                            question: "", // Clear question for bot message display
                        });
                    }
                });
                setMessages(formattedMessages);
                lastLoadedChatIdRef.current = chatId;
                lastChatHistoryMessageCountRef.current = chatHistory.messages.length;
                // Reset the flag after loading history
                isCreatingNewChatRef.current = false;

                // Update currentChatTabId if available
                if (chatHistory.chat_tab) {
                    setCurrentChatTabId(chatHistory.chat_tab.id);
                }
            } else if (isCreatingNewChatRef.current && chatId !== "new") {
                // If we just created a new chat, reset the flag after a longer delay
                // This allows the rename to complete before resetting
                // The rename happens in onComplete, so we need to wait longer
                // But only if we're not currently streaming (to avoid resetting during stream)
                if (!isStreaming) {
                    setTimeout(() => {
                        isCreatingNewChatRef.current = false;
                        lastLoadedChatIdRef.current = chatId;
                    }, 2000); // Increased delay to allow rename to complete
                }
            }
        }
    }, [chatHistory, chatId, isStreaming]);

    // Search functionality - state declared above

    // Refs to store current values for event handlers (avoid stale closures)
    const searchMatchesRef = useRef(searchMatches);
    const currentMatchIndexRef = useRef(currentMatchIndex);

    // Keep refs in sync with state
    useEffect(() => {
        searchMatchesRef.current = searchMatches;
    }, [searchMatches]);

    useEffect(() => {
        currentMatchIndexRef.current = currentMatchIndex;
        // Clear offset tracking when match index changes to ensure fresh rendering
        messageTextOffsets.clear();
    }, [currentMatchIndex]);

    // Navigate to match - uses refs to get current values
    const navigateToMatch = useCallback((direction: 'next' | 'prev') => {
        const matches = searchMatchesRef.current;
        const currentIndex = currentMatchIndexRef.current;

        if (matches.length === 0) return;

        let newIndex = currentIndex;
        if (direction === 'next') {
            newIndex = (currentIndex + 1) % matches.length;
        } else {
            newIndex = currentIndex <= 0 ? matches.length - 1 : currentIndex - 1;
        }

        // Clear offset tracking before state update to ensure fresh rendering
        messageTextOffsets.clear();

        setCurrentMatchIndex(newIndex);
        currentMatchIndexRef.current = newIndex;

        // Notify layout of current match index change
        window.dispatchEvent(new CustomEvent('searchMatchesUpdate', {
            detail: { count: matches.length, currentIndex: newIndex }
        }));

        // Scroll to the specific match element after state update
        setTimeout(() => {
            // Try to find the specific mark element with the match index
            const markElement = document.querySelector(`mark[data-match-index="${newIndex}"]`);
            if (markElement) {
                markElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                // Fallback: scroll to the message element
                const match = matches[newIndex];
                if (match) {
                    const messageElement = messageRefs.current.get(match.messageId);
                    if (messageElement) {
                        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }
        }, 50); // Small delay to allow React to re-render and update the DOM
    }, []);

    // Listen for search query changes from layout
    useEffect(() => {
        const handleSearchQueryChange = (e: CustomEvent) => {
            setSearchQuery(e.detail || "");
        };
        const handleCloseSearch = () => {
            setSearchQuery("");
            setSearchMatches([]);
            setCurrentMatchIndex(-1);
        };
        const handleSearchNavigate = (e: CustomEvent) => {
            navigateToMatch(e.detail === 'next' ? 'next' : 'prev');
        };

        window.addEventListener('searchQueryChange', handleSearchQueryChange as EventListener);
        window.addEventListener('closeSearch', handleCloseSearch);
        window.addEventListener('searchNavigate', handleSearchNavigate as EventListener);
        return () => {
            window.removeEventListener('searchQueryChange', handleSearchQueryChange as EventListener);
            window.removeEventListener('closeSearch', handleCloseSearch);
            window.removeEventListener('searchNavigate', handleSearchNavigate as EventListener);
        };
    }, [navigateToMatch]);

    // Perform search
    useEffect(() => {
        // Reset text offsets when search query changes
        messageTextOffsets.clear();

        if (!searchQuery.trim()) {
            setSearchMatches([]);
            setCurrentMatchIndex(-1);
            return;
        }

        const matches: Array<{ messageId: number; matchIndex: number; textOffset: number; isUserMatch: boolean }> = [];
        const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Ensure we're matching the full query string, not individual characters
        const regex = new RegExp(escapedQuery, 'gi');
        let globalMatchIndex = 0;

        messages.forEach((msg) => {
            // Search in both question (user) and answer (AI)
            const questionText = msg.question || '';
            const answerText = msg.answer || '';

            // Search in question (user message) - search character-by-character
            if (questionText) {
                const questionMatches = Array.from(questionText.matchAll(regex));
                questionMatches.forEach((match) => {
                    if (match[0] && match[0].length > 0) {
                        matches.push({
                            messageId: msg.id,
                            matchIndex: globalMatchIndex++,
                            textOffset: match.index || 0,
                            isUserMatch: true  // Mark as user message match
                        });
                    }
                });
            }

            // Search in answer (AI response) - search character-by-character
            if (answerText) {
                const answerMatches = Array.from(answerText.matchAll(regex));
                answerMatches.forEach((match) => {
                    if (match[0] && match[0].length > 0) {
                        matches.push({
                            messageId: msg.id,
                            matchIndex: globalMatchIndex++,
                            textOffset: match.index || 0,
                            isUserMatch: false  // Mark as AI message match
                        });
                    }
                });
            }
        });

        // Reset text offsets before setting new matches
        messageTextOffsets.clear();
        setSearchMatches(matches);

        if (matches.length > 0) {
            setCurrentMatchIndex(0);
            // Scroll to first match after state update
            setTimeout(() => {
                const markElement = document.querySelector(`mark[data-match-index="0"]`);
                if (markElement) {
                    markElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    // Fallback: scroll to message
                    const firstMatch = matches[0];
                    const messageElement = messageRefs.current.get(firstMatch.messageId);
                    if (messageElement) {
                        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }, 100);
        } else {
            setCurrentMatchIndex(-1);
        }

        // Notify layout of match count
        window.dispatchEvent(new CustomEvent('searchMatchesUpdate', {
            detail: { count: matches.length, currentIndex: matches.length > 0 ? 0 : -1 }
        }));
    }, [searchQuery, messages]);

    // Update layout when match index changes
    useEffect(() => {
        window.dispatchEvent(new CustomEvent('searchMatchesUpdate', {
            detail: { count: searchMatches.length, currentIndex: currentMatchIndex }
        }));
    }, [currentMatchIndex, searchMatches.length]);

    // Auto-scroll to bottom when messages change (only if not searching)
    useEffect(() => {
        if (!searchQuery.trim()) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, searchQuery]);

    // Scroll once when streaming starts
    useEffect(() => {
        if (isStreaming) {
            // Small delay to ensure DOM is updated
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        }
    }, [isStreaming]);

    const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!inputValue.trim() || isStreaming) {
            return;
        }

        const originalQuestion = inputValue.trim();
        setInputValue("");

        // Backend handles routing and KB search: only runs vector search when category is "kb"
        setIsStreaming(true);

        // Send only user-selected context (e.g. pasted/selected text). No frontend KB search.
        const contextToSend = selectedContext.type === 'text' && selectedContext.text
            ? selectedContext.text
            : null;
        const storedQuestion = originalQuestion;
        const contextForBackend = contextToSend
            ? { type: 'text' as const, text: contextToSend }
            : undefined;

        // Use original question without concatenation - context will be passed separately
        const questionForBackend = originalQuestion;

        // Add user message immediately
        const userMessage: ChatMessage = {
            id: Date.now(), // Temporary ID
            chat_tab_id: currentChatTabId || "", // UUID string
            question: storedQuestion, // Store with separator for parsing
            answer: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        // Don't create bot message placeholder - will be created when we receive first chunk
        setMessages((prev) => [...prev, userMessage]);
        // Don't set streamingMessageId yet - will be set in onStart

        // Clear context immediately after message is sent
        setSelectedContext({ type: null, id: null, name: null, text: null });

        // If we're on a new chat, mark it as creating BEFORE starting stream
        // This prevents the history query from starting when URL changes
        if (chatId === "new" || !currentChatTabId) {
            isCreatingNewChatRef.current = true;
            lastLoadedChatIdRef.current = "new";
        }

        // Start streaming
        setIsStreaming(true);

        // Create abort controller for this stream
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        try {
            console.log("[Chat] Sending to backend:", {
                question: questionForBackend,
                hasContext: !!contextForBackend,
                contextLength: contextForBackend?.text?.length || 0,
                agentMode
            });

            const controller = streamChat(
                questionForBackend, // Send original question without context concatenation
                currentChatTabId || undefined,
                agentMode,
                contextForBackend, // Pass context separately so backend can use it in system prompt
                {
                    onStart: (messageId, chatTabId, streamId) => {
                        setCurrentStatus(null);
                        // Mark chat as created
                        chatCreatedRef.current = true;
                        // Update with real IDs (chatTabId is UUID string)
                        const previousChatTabId = currentChatTabId;
                        setCurrentChatTabId(chatTabId);
                        setStreamingMessageId(messageId);
                        streamingMessageIdRef.current = messageId;
                        currentStreamingChatTabIdRef.current = chatTabId;
                        currentStreamingQuestionRef.current = originalQuestion;

                        // Track if this is a new chat (no existing chatTabId before or we're on /chat/new)
                        const isNewChat = chatId === "new" || !previousChatTabId;
                        wasNewChatRef.current = isNewChat;
                        if (isNewChat) {
                            isCreatingNewChatRef.current = true;
                        }

                        // Create bot message when chat is created (onStart)
                        // Only create if it doesn't exist yet
                        setMessages((prev) => {
                            const hasBotMessage = prev.some(msg => msg.id === messageId || (msg.id === streamingMessageIdRef.current && !msg.question));
                            if (hasBotMessage) {
                                // Update existing bot message with real ID
                                return prev.map(msg =>
                                    (msg.id === streamingMessageIdRef.current && !msg.question)
                                        ? { ...msg, id: messageId, chat_tab_id: chatTabId }
                                        : msg
                                );
                            }
                            // Create new bot message
                            const botMessage: ChatMessage = {
                                id: messageId,
                                chat_tab_id: chatTabId, // UUID string
                                question: "",
                                answer: "",
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString(),
                            };
                            return [...prev, botMessage];
                        });

                        // Update URL without reload (only if we're still on /chat/new)
                        if (chatId === "new") {
                            // Mark that we're creating a new chat BEFORE updating URL
                            // This prevents history from loading when chatId changes
                            isCreatingNewChatRef.current = true;
                            lastLoadedChatIdRef.current = "new";
                            // Use window.history to update URL without reload
                            window.history.replaceState(null, "", `/chat/${chatTabId}`);
                        }

                        // Rename chat tab immediately when first question is sent (don't wait for response)
                        // This happens asynchronously and doesn't block the stream
                        // Allow rename for new chats OR cleared chats (not in renamed set)
                        const shouldRename = isNewChat || !hasRenamedChatRef.current.has(chatTabId);
                        if (shouldRename && chatTabId && originalQuestion) {
                            console.log("onStart - renaming chat tab immediately:", { chatTabId, question: originalQuestion.substring(0, 50), isNewChat });
                            renameChatTabIfNeeded(chatTabId, originalQuestion, isNewChat);
                        }
                    },
                    onChunk: (content) => {
                        setMessages((prev) => {
                            const currentStreamingId = streamingMessageIdRef.current;
                            if (!currentStreamingId) {
                                // If no streaming ID yet, create bot message (shouldn't happen, but handle it)
                                const botMessage: ChatMessage = {
                                    id: currentStreamingId || Date.now(),
                                    chat_tab_id: currentChatTabId || "",
                                    question: "",
                                    answer: content,
                                    created_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString(),
                                };
                                streamingMessageIdRef.current = botMessage.id;
                                return [...prev, botMessage];
                            }

                            // Find the message with the streaming ID
                            const messageIndex = prev.findIndex(msg => msg.id === currentStreamingId);
                            if (messageIndex === -1) {
                                // Bot message doesn't exist yet, create it
                                const botMessage: ChatMessage = {
                                    id: currentStreamingId,
                                    chat_tab_id: currentChatTabId || "",
                                    question: "",
                                    answer: content,
                                    created_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString(),
                                };
                                return [...prev, botMessage];
                            }

                            // Update existing bot message
                            const updated = [...prev];
                            const streamingMsg = updated[messageIndex];
                            updated[messageIndex] = {
                                ...streamingMsg,
                                answer: (streamingMsg.answer || "") + content,
                            };
                            return updated;
                        });
                    },
                    onStatus: (status, step) => {
                        // Always show status messages (not just in agent mode)
                        setCurrentStatus(status);
                    },
                    onComplete: () => {
                        const completedMessageId = streamingMessageIdRef.current;
                        setIsStreaming(false);
                        setStreamingMessageId(null);
                        setCurrentStatus(null);
                        abortControllerRef.current = null;
                        // Invalidate chat tabs after completion to update the list (e.g., new chat created)
                        queryClient.invalidateQueries({
                            predicate: (query) => {
                                const key = query.queryKey;
                                return Array.isArray(key) && key.length >= 1 && key[0] === "chatTabs";
                            }
                        });
                        // Clear refs
                        currentStreamingChatTabIdRef.current = null;
                        currentStreamingQuestionRef.current = null;
                        wasNewChatRef.current = false;
                        chatCreatedRef.current = false;
                    },
                    onStop: async () => {
                        setIsStreaming(false);
                        setStreamingMessageId(null);
                        setCurrentStatus(null);
                        abortControllerRef.current = null;
                        chatCreatedRef.current = false;
                        toast.info("Response stopped. Partial response saved.");
                        // Wait for backend to save, then refetch to get the saved partial response
                        setTimeout(async () => {
                            if (chatId && chatId !== "new") {
                                try {
                                    await refetchHistory();
                                } catch (error) {
                                    console.error("Error refetching history after stop:", error);
                                }
                            }
                        }, 1000); // Increased delay to ensure backend has time to save
                    },
                    onError: (error) => {
                        setIsStreaming(false);
                        setStreamingMessageId(null);
                        setCurrentStatus(null);
                        abortControllerRef.current = null;
                        toast.error(`Error: ${error}`);
                    },
                },
                selectedModel
            );

            abortControllerRef.current = controller;
        } catch (error: any) {
            setIsStreaming(false);
            setStreamingMessageId(null);
            chatCreatedRef.current = false;
            // Clear context even on error (message was attempted to be sent)
            setSelectedContext({ type: null, id: null, name: null, text: null });
            toast.error(`Failed to send message: ${error.message}`);
        }
    };

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    };


    // Show landing page if there are no chat tabs AND no pending question AND no messages
    const pendingQuestion = typeof window !== "undefined" ? sessionStorage.getItem("pendingChatQuestion") : null;
    // If no chat tabs exist and we're not loading, always show landing page (unless streaming or pending)
    // BUT only show landing page if we're on "new" chat page, not on an existing chat
    const shouldShowLandingPage = chatId === "new" &&
        !isLoadingChatTabs &&
        chatTabs.length === 0 &&
        !pendingQuestion &&
        messages.length === 0 &&
        !isStreaming;

    // Show loading state when chat tabs are loading initially (only on "new" page)
    if (isLoadingChatTabs && chatId === "new" && messages.length === 0 && !pendingQuestion) {
        return (
            <div className="flex flex-col h-full w-full items-center justify-center">
                <BlocksLoader />
                <p className="text-sm text-muted-foreground mt-4">Loading chats...</p>
            </div>
        );
    }

    // Show loading state when on an existing chat and either tabs or history are loading
    // BUT only if we're not streaming, not creating a new chat, and chat has been created (to prevent flicker)
    // Don't show loader when creating a new chat until chat is actually created (onStart called)
    if (chatId !== "new" && (isLoadingChatTabs || isLoadingHistory || isFetchingHistory) && messages.length === 0 && !isStreaming && !isCreatingNewChatRef.current && chatCreatedRef.current) {
        return (
            <div className="flex flex-col h-full w-full items-center justify-center">
                <BlocksLoader />
                <p className="text-sm text-muted-foreground mt-4">
                    {isLoadingChatTabs ? "Loading chats..." : "Loading chat history..."}
                </p>
            </div>
        );
    }

    // Show landing page when there are no chat tabs and no pending question (only on "new" page)
    if (shouldShowLandingPage) {
        return (
            <div className="flex flex-col h-full w-full">
                <ChatLandingPage />
            </div>
        );
    }

    // For existing chats with cleared history, show the same full landing layout (no underlying chat UI)
    if (
        !isLoadingChatTabs &&
        !isLoadingHistory &&
        !isFetchingHistory &&
        chatHistory !== undefined &&
        messages.length === 0 &&
        !isStreaming &&
        chatId !== "new"
    ) {
        return (
            <div className="flex flex-col h-full w-full">
                <ChatLandingPage />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
                <div className="max-w-4xl mx-auto space-y-4">
                    {/* Loading State - This should rarely show now since we handle it above, but keep as fallback */}
                    {/* Only show if not streaming, not creating a new chat, and chat has been created to prevent flicker */}
                    {((isLoadingHistory || isFetchingHistory) || (chatId !== "new" && currentTenantId && !chatHistory && !isCreatingNewChatRef.current && !isLoadingChatTabs)) && chatId !== "new" && messages.length === 0 && !isStreaming && !isCreatingNewChatRef.current && chatCreatedRef.current && (
                        <div className="flex flex-col items-center justify-center py-12 min-h-[400px]">
                            <BlocksLoader />
                            <p className="text-sm text-muted-foreground mt-4">Loading chat history...</p>
                        </div>
                    )}
                    <AnimatePresence mode="popLayout">
                        {messages.map((msg, index) => (
                            <MessageBubble
                                key={`${msg.id}-${index}-${searchQuery}-${currentMatchIndex}`}
                                message={msg}
                                index={index}
                                isStreaming={isStreaming && streamingMessageId === msg.id}
                                onAddContext={handleAddTextContext}
                                onCreateArticle={handleCreateArticle}
                                isSelectedForArticle={selectedArticleMessageIds.includes(msg.id)}
                                currentStatus={currentStatus}
                                messageRef={(node) => {
                                    if (node) {
                                        messageRefs.current.set(msg.id, node);
                                    } else {
                                        messageRefs.current.delete(msg.id);
                                    }
                                }}
                                searchQuery={searchQuery}
                                currentMatchIndex={currentMatchIndex}
                                searchMatches={searchMatches}
                            />
                        ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Article selection bar */}
            {selectedArticleMessageIds.length > 0 && (
                <div className="flex-shrink-0 px-4 sm:px-6 pb-2">
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-2 px-3 py-2 rounded-lg border bg-white/80 dark:bg-muted/60 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-black dark:text-muted-foreground">
                                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#DB2B30]" />
                                <span>
                                    {selectedArticleMessageIds.length}{" "}
                                    {selectedArticleMessageIds.length === 1 ? "response selected" : "responses selected"}{" "}
                                    for article
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => setSelectedArticleMessageIds([])}
                                >
                                    Clear
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    className="h-7 px-3 text-xs bg-[#DB2B30] hover:bg-[#B52227] text-white"
                                    onClick={handleCreateArticleFromSelection}
                                >
                                    <PenTool className="h-3 w-3 mr-1" />
                                    Select for Article
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Input */}
            <div className="flex-shrink-0 px-4 sm:px-6 py-4 sm:py-6 border-t bg-background/80 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto">
                    {/* Context Display - Above input (only shows when context is added) */}
                    {selectedContext.type === 'text' && selectedContext.name && (
                        <div className="mb-3 px-3 py-2 bg-muted/50 border rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FileText className="h-4 w-4 text-[#DB2B30] flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium block truncate">{selectedContext.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        (Text context)
                                    </span>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedContext({ type: null, id: null, name: null, text: null })}
                                className="h-6 w-6 p-0 flex-shrink-0 ml-2"
                                disabled={isStreaming}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    )}

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSend(e);
                        }}
                        className="relative"
                        noValidate
                    >
                        {/* Input Container - matching landing page style */}
                        <div className="flex flex-col rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg overflow-hidden">
                            {/* Input Row */}
                            <div className="flex items-center px-5 py-4">
                                <Input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Plan, @ for context, / for commands"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            if (inputValue.trim() && !isStreaming) {
                                                const formEvent = new Event("submit", { bubbles: true, cancelable: true });
                                                handleSend(formEvent as any);
                                            }
                                        }
                                    }}
                                    disabled={isStreaming}
                                    className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-[15px] text-neutral-700 dark:text-neutral-200 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 px-2 py-2"
                                />
                            </div>

                            {/* Bottom Row - Icons and Controls */}
                            <div className="flex items-center justify-between px-4 py-2.5 border-t border-neutral-100 dark:border-neutral-800">
                                {/* Left icons */}
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        disabled={isStreaming}
                                        className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
                                        title="Attach file"
                                    >
                                        <Paperclip className="w-[18px] h-[18px]" />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isStreaming}
                                        className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
                                        title="Add context"
                                    >
                                        <AtSign className="w-[18px] h-[18px]" />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isStreaming}
                                        className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
                                        title="Upload image"
                                    >
                                        <ImageIcon className="w-[18px] h-[18px]" />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isStreaming}
                                        className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
                                        title="Web search"
                                    >
                                        <Globe className="w-[18px] h-[18px]" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSettingsSheetOpen(true)}
                                        disabled={isStreaming}
                                        className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
                                        title="Settings"
                                    >
                                        <SlidersHorizontal className="w-[18px] h-[18px]" />
                                    </button>
                                </div>

                                {/* Right controls */}
                                <div className="flex items-center gap-2">
                                    <ModelSelector
                                        value={selectedModel}
                                        onChange={handleModelChange}
                                        disabled={isStreaming}
                                    />
                                    {/* Agent/Chat Mode Toggle */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                disabled={isStreaming}
                                                className="h-8 px-3 rounded-lg text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                            >
                                                {agentMode ? (
                                                    <>
                                                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                                                        Agent
                                                    </>
                                                ) : (
                                                    <>
                                                        <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                                                        Chat
                                                    </>
                                                )}
                                                <ChevronDown className="w-3.5 h-3.5 ml-1.5 opacity-60" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-36">
                                            <DropdownMenuItem
                                                onClick={() => setAgentMode(false)}
                                                className="flex items-center gap-2 cursor-pointer"
                                            >
                                                <MessageSquare className="w-3.5 h-3.5 text-[#DB2B30]" />
                                                <span>Chat Mode</span>
                                                {!agentMode && <Check className="w-3 h-3 ml-auto text-[#DB2B30]" />}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => setAgentMode(true)}
                                                className="flex items-center gap-2 cursor-pointer"
                                            >
                                                <RefreshCw className="w-3.5 h-3.5 text-[#DB2B30]" />
                                                <span>Agent Mode</span>
                                                {agentMode && <Check className="w-3 h-3 ml-auto text-[#DB2B30]" />}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    {isStreaming ? (
                                        <Button
                                            type="button"
                                            onClick={handleStop}
                                            size="icon"
                                            variant="destructive"
                                            className="h-9 w-9 rounded-full flex-shrink-0"
                                        >
                                            <Square className="h-4 w-4" />
                                        </Button>
                                    ) : (
                                        <Button
                                            type="submit"
                                            size="icon"
                                            disabled={!inputValue.trim()}
                                            className="h-9 w-9 rounded-full bg-[#DB2B30] hover:bg-[#B52227] dark:bg-[#DB2B30] dark:hover:bg-[#B52227] text-white disabled:opacity-30 disabled:bg-neutral-200 dark:disabled:bg-neutral-700 disabled:text-neutral-400 dark:disabled:text-neutral-500 transition-all flex-shrink-0"
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Settings sheet - tone toggles (chat interface) */}
            <Sheet open={settingsSheetOpen} onOpenChange={setSettingsSheetOpen}>
                <SheetContent side="right" className="w-full sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <SettingsIcon className="h-5 w-5" />
                            Tone response
                        </SheetTitle>
                        <SheetDescription>
                            Set how you want your answers to sound. Think about the style, mood, and level of formality that feels right for your brand.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="px-4 pb-4 space-y-6 overflow-y-auto">
                        <div className="space-y-3">
                            <Label htmlFor="chat-custom-instructions" className="text-sm font-medium">
                                Custom instructions
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Tell the assistant how to respond in this chat. This will be included with your messages.
                            </p>
                            <textarea
                                id="chat-custom-instructions"
                                value={customInstructions}
                                onChange={(e) => setCustomInstructions(e.target.value)}
                                rows={4}
                                maxLength={2000}
                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#DB2B30] focus:border-transparent resize-none"
                                disabled={settingsLoading || updateUserSettings.isPending}
                            />
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{2000 - customInstructions.length} characters remaining</span>
                                <Button
                                    type="button"
                                    size="sm"
                                    disabled={settingsLoading || updateUserSettings.isPending}
                                    onClick={() =>
                                        updateUserSettings.mutate({
                                            custom_instructions: customInstructions.trim() || null,
                                        })
                                    }
                                >
                                    Save instructions
                                </Button>
                            </div>
                        </div>
                        <div>
                            <div className="space-y-4">
                                {toneOptions.map(({ slug, label, description }) => (
                                    <div key={slug} className="flex items-center justify-between gap-4">
                                        <div className="flex-1 space-y-0.5">
                                            <Label htmlFor={`chat-tone-${slug}`} className="text-sm font-medium cursor-pointer">
                                                {label}
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                {description}
                                            </p>
                                        </div>
                                        <Switch
                                            id={`chat-tone-${slug}`}
                                            checked={enabledTones.includes(slug)}
                                            onCheckedChange={(checked) => handleToneToggle(slug, checked)}
                                            disabled={settingsLoading || updateUserSettings.isPending}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
