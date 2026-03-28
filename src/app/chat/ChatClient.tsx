"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Send, Bot, User, Copy, Check, Square, Loader2, Brain, Star, X, FileText, Plus, Upload, Image as ImageIcon, PenTool, AtSign, SlidersHorizontal, Paperclip, ChevronUp, Globe, MessageCircle, Settings as SettingsIcon, AlertCircle, FolderOpen, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import BlocksLoader from "@/src/components/Loaders/BlocksLoader/BlocksLoader";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
    ChatMessage,
    ChatTab,
    ChatResourceLink,
    CHAT_TAB_NAME_MIN_LENGTH,
    deriveAutomaticChatTabTitle,
    isPlaceholderChatTabName,
    DEFAULT_CHAT_TAB_DISPLAY_NAME,
} from "../../types/chat";
import { useRef, useEffect, useState, useCallback, useMemo, startTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
    streamChat,
    getChatHistory,
    getChatTabs,
    updateChatTabName,
    createChatTab,
} from "../../api/chat";
import { useBrainSpaceStore } from "../../store/useBrainSpace";
import { useUserWorkspaces } from "../../hooks/useWorkspace";
import { useUserCollections } from "../../hooks/useCollection";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../store/useAuth";
import { useUserProfile } from "../../hooks/useProfile";
import { useGetUserSettings, useUpdateUserSettings } from "../../hooks/useUserSettings";
import { ModelSelector } from "../../components/chat/ModelSelector";
import {
    getStoredAssistantMode,
    setStoredAssistantMode,
    type ChatAssistantMode,
} from "@/src/lib/chatAgentModePreference";
import {
    ACTIVE_CHAT_TAB_STORAGE_KEY,
    CHAT_NEW_SESSION_EVENT,
    CHAT_TAB_DELETED_EVENT,
    type ChatTabDeletedDetail,
} from "@/src/lib/activeChatTabStorage";
import { getUserFacingApiErrorMessage } from "@/src/lib/apiErrorMessage";
import { CHAT_ENTRY_PATH, CHAT_NEW_SESSION_PATH } from "@/src/lib/chatRoutes";
import { ChatAssistantModeDropdown } from "@/src/components/chat/ChatAssistantModeDropdown";
import { YouTubeLinkPreview } from "@/src/components/chat/YouTubeLinkPreview";
import { ExternalLinkCard } from "@/src/components/chat/ExternalLinkCard";
import { DashboardLinkCard } from "@/src/components/chat/DashboardLinkCard";
import { extractYoutubeVideoId } from "@/src/lib/youtubeUrl";
import { preprocessAssistantMarkdownForLinkCards } from "@/src/lib/chatMarkdownPreprocess";
import { cn } from "@/lib/utils";
import { ChatLandingPage } from "./ChatLanding";
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
    onCreateContent?: (content: string, messageId?: number) => void;
    isSelectedForContent?: boolean;
    /** Latest status line (legacy; also set when using statusSteps) */
    currentStatus?: string | null;
    /** Cumulative agent / pipeline steps for this streaming reply */
    statusSteps?: string[];
    /** Open-in-dashboard links for resources created in this assistant turn */
    resourceLinks?: ChatResourceLink[];
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

function reactNodeToPlainString(node: unknown): string {
    if (node == null || node === false) return "";
    if (typeof node === "string" || typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(reactNodeToPlainString).join("");
    if (React.isValidElement(node)) {
        const props = node.props as { children?: unknown };
        if (props?.children != null) return reactNodeToPlainString(props.children);
    }
    return "";
}

/** Short anchor text like "here" stays inline; titles and pasted URLs use cards. */
function shouldUseInlineExternalLink(plain: string): boolean {
    const t = plain.trim();
    return t.length > 0 && t.length <= 8;
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
    onCreateContent,
    isSelectedForContent,
    currentStatus,
    statusSteps,
    resourceLinks = [],
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

    const assistantMarkdown = useMemo(() => {
        if (isUser) return displayContent;
        return preprocessAssistantMarkdownForLinkCards(displayContent);
    }, [isUser, displayContent]);

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
                    className={`relative max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl rounded-2xl px-4 py-3 ${isUser
                            ? "bg-[#DB2B30] !text-white shadow-sm **:!text-white"
                            : `bg-card border shadow-sm ${!isUser && isSelectedForContent ? "border-[#DB2B30] ring-1 ring-[#DB2B30]/60" : ""
                            }`
                        }`}
                >
                    {/* Subtle shine effect for user messages */}
                    {isUser && (
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-50" />
                    )}

                    {!isUser && isStreaming && (!displayContent || displayContent === "") ? (
                        statusSteps && statusSteps.length > 0 ? (
                            <div className="relative z-10 py-2 space-y-2 max-w-md">
                                {statusSteps.map((line, i) => {
                                    const isLast = i === statusSteps.length - 1;
                                    const looksLikeError =
                                        /try again|Couldn’t finish|Couldn't finish|didn’t finish|didn't finish/i.test(
                                            line,
                                        );
                                    return (
                                        <div
                                            key={`${i}-${line.slice(0, 24)}`}
                                            className="flex items-start gap-2 text-xs text-muted-foreground"
                                        >
                                            {!isLast ? (
                                                <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-500" />
                                            ) : looksLikeError ? (
                                                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-500" />
                                            ) : (
                                                <Loader2 className="w-3.5 h-3.5 mt-0.5 shrink-0 animate-spin text-[#DB2B30]" />
                                            )}
                                            <span className="leading-snug">{line}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : currentStatus ? (
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
                            className={`relative z-10 text-sm sm:text-base leading-relaxed ${isUser ? "text-white" : "text-foreground"}`}
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
                                        key={`md-${message.id}-${searchQuery}-${currentMatchIndex}-${isStreaming ? "stream" : "final"}`}
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
                                            // Customize lists (unordered: red squares via .markdown-content ul in globals.css)
                                            ul({ children }: any) {
                                                return <ul className="list-none mb-2 space-y-1 pl-0">{children}</ul>;
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
                                                return (
                                                    <li className="mb-1 last:mb-0">{highlightChildren(children)}</li>
                                                );
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
                                                const hrefStr =
                                                    typeof href === "string" ? href : href != null ? String(href) : "";
                                                const plainForCard = reactNodeToPlainString(children);
                                                const ytId = hrefStr ? extractYoutubeVideoId(hrefStr) : null;
                                                if (ytId) {
                                                    return (
                                                        <YouTubeLinkPreview
                                                            href={hrefStr}
                                                            videoId={ytId}
                                                            caption={highlightChildren(children)}
                                                        />
                                                    );
                                                }
                                                const isAppPath =
                                                    hrefStr.startsWith("/") &&
                                                    !hrefStr.startsWith("//");
                                                if (isAppPath) {
                                                    return (
                                                        <DashboardLinkCard
                                                            href={hrefStr}
                                                            caption={highlightChildren(children)}
                                                        />
                                                    );
                                                }
                                                const isHttp =
                                                    hrefStr.startsWith("http://") ||
                                                    hrefStr.startsWith("https://");
                                                if (
                                                    isHttp &&
                                                    !shouldUseInlineExternalLink(plainForCard)
                                                ) {
                                                    return (
                                                        <ExternalLinkCard
                                                            href={hrefStr}
                                                            caption={highlightChildren(children)}
                                                        />
                                                    );
                                                }
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
                                        {assistantMarkdown}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    )}

                    {!isUser && resourceLinks.length > 0 && (
                        <div className="relative z-10 mt-3 space-y-2">
                            {resourceLinks.map((rl, idx) => {
                                const kindLabel =
                                    rl.kind === "brainspace"
                                        ? "Brainspace"
                                        : rl.kind === "collection"
                                            ? "Collection"
                                            : "Content";
                                const Icon =
                                    rl.kind === "brainspace"
                                        ? Brain
                                        : rl.kind === "collection"
                                            ? FolderOpen
                                            : FileText;
                                return (
                                    <Link
                                        key={`${rl.href}-${idx}`}
                                        href={rl.href}
                                        className="flex items-center gap-3 rounded-lg border border-[#DB2B30]/25 bg-[#DB2B30]/5 px-3 py-2.5 text-sm transition-colors hover:bg-[#DB2B30]/10 dark:bg-[#DB2B30]/10 dark:hover:bg-[#DB2B30]/20"
                                    >
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#DB2B30]/15 text-[#DB2B30]">
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 flex-1 text-left">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#DB2B30]">
                                                {kindLabel}
                                            </p>
                                            <p className="truncate font-medium text-foreground">{rl.title}</p>
                                        </div>
                                        <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    </Link>
                                );
                            })}
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

            {/* Copy / Content actions for bot messages - appears below bubble on hover */}
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
                            if (onCreateContent && displayContent) {
                                onCreateContent(displayContent, message.id);
                            }
                        }}
                        size="sm"
                        variant={isSelectedForContent ? "default" : "ghost"}
                        className={`h-7 px-2 text-xs flex items-center gap-1 ${isSelectedForContent
                                ? "bg-[#DB2B30] text-white hover:bg-[#B52227]"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                        title={isSelectedForContent ? "Remove from content selection" : "Add/remove this response in content selection"}
                    >
                        {isSelectedForContent ? (
                            <>
                                <Check className="h-3 w-3" />
                                Selected
                            </>
                        ) : (
                            <>
                                <PenTool className="h-3 w-3" />
                                Select for Content
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

/** True on `/chat` or `/chat/new` (no concrete tab UUID in the path). */
function pathnameIsBareNewChatSession(pathname: string | null | undefined): boolean {
    if (!pathname) return false;
    return (
        pathname === CHAT_ENTRY_PATH ||
        pathname === CHAT_NEW_SESSION_PATH ||
        pathname.endsWith(CHAT_NEW_SESSION_PATH)
    );
}

/** UUID segment after /chat/ — uses the real URL, not useParams (can desync after clear or transitions). */
function parseChatTabUuidFromPath(path: string): string | undefined {
    const m = path.match(/\/chat\/([^/?#]+)/);
    const seg = m?.[1]?.trim();
    if (!seg || seg === "new") return undefined;
    return seg;
}

export default function ChatClient({
    chatId: chatIdProp,
    embed = false,
}: {
    chatId: string;
    /** When true (e.g. dashboard split panel), do not navigate away on tab-deleted recovery. */
    embed?: boolean;
}) {
    const router = useRouter();
    const pathname = usePathname();

    const queryClient = useQueryClient();
    const chatId = chatIdProp;
    /** UUID segment from URL — params can be briefly undefined in App Router; pathname stays correct. */
    const stableRouteChatId = useMemo(() => {
        const raw = typeof chatId === "string" ? chatId.trim() : "";
        if (raw && raw !== "new") return raw;
        if (pathname) {
            const fromPath = parseChatTabUuidFromPath(pathname);
            if (fromPath) return fromPath;
        }
        return null;
    }, [chatId, pathname]);
    /** Last known tab id on this page (survives param flicker after clear / refetch). */
    const routeChatTabPersistRef = useRef<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    /** Bumped when the embedded landing queues a message so the pending-question effect re-runs without navigation. */
    const [landingLaunchNonce, setLandingLaunchNonce] = useState(0);
    const [inputValue, setInputValue] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchMatches, setSearchMatches] = useState<Array<{ messageId: number; matchIndex: number; textOffset?: number; isUserMatch?: boolean }>>([]);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
    const [streamingMessageId, setStreamingMessageId] = useState<number | null>(null);
    const streamingMessageIdRef = useRef<number | null>(null);
    const [currentChatTabId, setCurrentChatTabId] = useState<string | null>(null); // UUID as string
    /** Mirrors `currentChatTabId` for use inside stream callbacks without stale closures. */
    const currentChatTabIdRef = useRef<string | null>(null);
    /** Tab id for API + message rows: stable route UUID wins so clear-chat still targets the same tab. */
    const resolvedChatTabId = useMemo(() => {
        if (stableRouteChatId) return stableRouteChatId;
        if (chatId && chatId !== "new") return chatId;
        return currentChatTabId ?? "";
    }, [stableRouteChatId, chatId, currentChatTabId]);

    useEffect(() => {
        currentChatTabIdRef.current = currentChatTabId;
    }, [currentChatTabId]);

    /** When navigating from an existing chat to `/chat/new`, drop the old tab id so the next send creates a fresh tab (not reuse). */
    const prevChatIdForNewResetRef = useRef<string | undefined>(undefined);
    useEffect(() => {
        if (
            chatId === "new" &&
            prevChatIdForNewResetRef.current != null &&
            prevChatIdForNewResetRef.current !== "new"
        ) {
            setCurrentChatTabId(null);
        }
        prevChatIdForNewResetRef.current = chatId;
    }, [chatId]);

    useEffect(() => {
        // Only clear persisted tab when the *URL path* is bare new-session (/chat or /chat/new) — not when
        // params briefly report chatId === "new" during refetch/clear (URL can stay /chat/{uuid}).
        const pathLooksNew = pathnameIsBareNewChatSession(pathname);
        if (pathLooksNew) {
            routeChatTabPersistRef.current = null;
        } else if (stableRouteChatId) {
            routeChatTabPersistRef.current = stableRouteChatId;
            setCurrentChatTabId(stableRouteChatId);
        }
    }, [pathname, stableRouteChatId]);

    useEffect(() => {
        const pathLooksNew = pathnameIsBareNewChatSession(pathname);
        try {
            if (stableRouteChatId) {
                sessionStorage.setItem(
                    ACTIVE_CHAT_TAB_STORAGE_KEY,
                    stableRouteChatId,
                );
            } else if (pathLooksNew && currentChatTabId) {
                sessionStorage.setItem(
                    ACTIVE_CHAT_TAB_STORAGE_KEY,
                    currentChatTabId,
                );
            } else if (pathLooksNew && !currentChatTabId) {
                sessionStorage.removeItem(ACTIVE_CHAT_TAB_STORAGE_KEY);
            }
        } catch {
            /* ignore */
        }
    }, [stableRouteChatId, pathname, currentChatTabId]);

    /**
     * Tab id for POST /chat/stream. Must not rely on `chatId` from useParams alone — it can
     * briefly read as "new" after clear/refetch while the browser URL is still /chat/{uuid}.
     */
    const getStreamChatTabId = useCallback((): string | undefined => {
        const path =
            typeof window !== "undefined" ? window.location.pathname : pathname ?? "";
        let id = parseChatTabUuidFromPath(path);
        if (!id) {
            try {
                const stored = sessionStorage.getItem(ACTIVE_CHAT_TAB_STORAGE_KEY);
                if (stored && stored !== "new") id = stored;
            } catch {
                /* ignore */
            }
        }
        if (!id && pathname) {
            id = parseChatTabUuidFromPath(pathname);
        }
        if (!id) id = stableRouteChatId ?? routeChatTabPersistRef.current ?? undefined;
        if (!id) id = currentChatTabIdRef.current ?? undefined;
        if (!id && typeof chatId === "string") {
            const t = chatId.trim();
            if (t && t !== "new") id = t;
        }
        return id;
    }, [pathname, stableRouteChatId, chatId]);

    const [assistantMode, setAssistantMode] = useState<ChatAssistantMode>("ask");
    const agentMode = assistantMode === "operator";

    const setAssistantModePersist = useCallback((next: ChatAssistantMode) => {
        setAssistantMode(next);
        setStoredAssistantMode(next);
    }, []);
    const [selectedModel, setSelectedModel] = useState<string>("default");
    const [settingsSheetOpen, setSettingsSheetOpen] = useState(false);
    const [enabledTones, setEnabledTones] = useState<string[]>([]);
    const [customInstructions, setCustomInstructions] = useState("");
    const [currentStatus, setCurrentStatus] = useState<string | null>(null);
    /** Agent / LangGraph / tool steps shown in the streaming bubble (cumulative). */
    const [agentStatusSteps, setAgentStatusSteps] = useState<string[]>([]);
    const streamingResourceLinksRef = useRef<ChatResourceLink[]>([]);
    const [streamingResourceLinks, setStreamingResourceLinks] = useState<ChatResourceLink[]>([]);

    const clearAgentStatus = useCallback(() => {
        setCurrentStatus(null);
        setAgentStatusSteps([]);
        streamingResourceLinksRef.current = [];
        setStreamingResourceLinks([]);
    }, []);
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
        setAssistantMode(getStoredAssistantMode());
    }, [chatId]);

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
        setCustomInstructions(settingsData.data.custom_instructions ?? "");
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

    const [selectedContentMessageIds, setSelectedContentMessageIds] = useState<number[]>([]);

    // Clicking "Select for Content" on a message now toggles it in the multi-select list.
    // The actual content is created from the bottom selection bar.
    const handleCreateContent = (_content: string, messageId?: number) => {
        if (typeof messageId !== "number") return;

        setSelectedContentMessageIds((prev) =>
            prev.includes(messageId)
                ? prev.filter((id) => id !== messageId)
                : [...prev, messageId]
        );
    };

    const handleCreateContentFromSelection = () => {
        const selectedMessagesInOrder = messages.filter(
            (msg) => msg.answer && !msg.question && (selectedContentMessageIds ?? []).includes(msg.id)
        );

        const combinedContent = selectedMessagesInOrder
            .map((msg) => msg.answer || "")
            .filter(Boolean)
            .join("\n\n");

        if (!combinedContent.trim()) {
            toast.error("Please select at least one AI response to create content.");
            return;
        }

        sessionStorage.setItem("pendingContent", combinedContent);
        setSelectedContentMessageIds([]);
        router.push("/dashboard/articles/new");
    };

    // Async function to rename chat tab once per tab (first user message after tab exists).
    // Do not use `chatId === "new"` as the guard: params can stay "new" until router.replace runs,
    // which previously caused auto-rename on every message.
    /** @returns true if the tab title was updated on the server (sidebar should refresh). */
    const renameChatTabIfNeeded = async (
        chatTabId: string,
        firstQuestion: string,
    ): Promise<boolean> => {
        if (!chatTabId || chatTabId.trim() === "") {
            console.log("Skipping rename - invalid chatTabId:", { chatTabId });
            return false;
        }

        if (hasRenamedChatRef.current.has(chatTabId)) {
            return false;
        }

        // Check if rename is already in progress
        if (isRenamingChatRef.current.has(chatTabId)) {
            console.log("Skipping rename - already in progress:", { chatTabId });
            return false;
        }

        if (!firstQuestion || !firstQuestion.trim()) {
            console.log("Skipping rename - no question provided:", { chatTabId, firstQuestion });
            return false;
        }

        // Mark as in-progress immediately to prevent duplicate calls (race condition protection)
        isRenamingChatRef.current.add(chatTabId);

        try {
            const newTitle = deriveAutomaticChatTabTitle(firstQuestion);
            console.log("Renaming chat tab:", { chatTabId, newTitle, originalQuestion: firstQuestion.substring(0, 100), questionLength: firstQuestion.length });

            if (newTitle.length >= CHAT_TAB_NAME_MIN_LENGTH) {
                await updateChatTabName(chatTabId, newTitle);
                console.log("Chat tab renamed successfully:", newTitle);
                hasRenamedChatRef.current.add(chatTabId);
                return true;
            }
            hasRenamedChatRef.current.add(chatTabId);
            return false;
        } catch (error) {
            // Log error for debugging
            console.error("Failed to rename chat tab:", error);
            // Remove from in-progress set so we can retry if needed (but keep in renamed set to prevent infinite retries)
            isRenamingChatRef.current.delete(chatTabId);
            // Don't add to hasRenamedChatRef on error, so it won't retry automatically
            return false;
        } finally {
            // Always remove from in-progress set
            isRenamingChatRef.current.delete(chatTabId);
        }
    };
    const lastLoadedChatIdRef = useRef<string | null>(null);
    /** Previous `chatId` — used to detect `/chat/new` → `/chat/{uuid}` so we re-apply history even when `lastLoadedChatIdRef` still matches. */
    const prevChatIdForHistoryRef = useRef<string | null>(null);
    /** True after navigating from `CHAT_NEW_SESSION_PATH` to an existing chat; cleared after server history is applied. */
    const reopenFromNewChatRouteRef = useRef(false);
    const isCreatingNewChatRef = useRef<boolean>(false);
    const lastChatHistoryMessageCountRef = useRef<number>(-1);
    const hasRenamedChatRef = useRef<Set<string>>(new Set()); // Track which chats have been renamed (UUID strings)
    const isRenamingChatRef = useRef<Set<string>>(new Set()); // Track which chats are currently being renamed (UUID strings)
    const currentStreamingChatTabIdRef = useRef<string | null>(null); // Track chat tab ID for current stream (UUID string)
    const currentStreamingQuestionRef = useRef<string | null>(null); // Track question for current stream
    const chatCreatedRef = useRef<boolean>(false); // Track if chat has been created (onStart called)
    /** Set true synchronously when a stream starts (before React commits isStreaming) so history never loads mid-stream. */
    const isStreamingRef = useRef(false);
    useEffect(() => {
        isStreamingRef.current = isStreaming;
    }, [isStreaming]);

    /** Sidebar deleted the open tab: clear UI (needed when URL stays `/chat/new` — no remount). */
    useEffect(() => {
        const onDeleted = (e: Event) => {
            const detail = (e as CustomEvent<ChatTabDeletedDetail>).detail;
            const deletedId = detail?.chatTabId;
            if (!deletedId) return;
            const urlTabId =
                typeof chatId === "string" && chatId !== "new"
                    ? chatId.trim()
                    : "";
            const activeTab =
                urlTabId ||
                (currentChatTabIdRef.current ?? currentChatTabId ?? "");
            if (!activeTab) return;
            if (activeTab.toLowerCase() !== deletedId.toLowerCase()) return;

            abortControllerRef.current?.abort();
            abortControllerRef.current = null;
            isStreamingRef.current = false;
            setIsStreaming(false);
            setStreamingMessageId(null);
            streamingMessageIdRef.current = null;
            clearAgentStatus();

            setMessages([]);
            setCurrentChatTabId(null);
            lastLoadedChatIdRef.current = null;
            lastChatHistoryMessageCountRef.current = -1;
            isCreatingNewChatRef.current = false;
            chatCreatedRef.current = false;
            try {
                sessionStorage.removeItem(ACTIVE_CHAT_TAB_STORAGE_KEY);
            } catch {
                /* ignore */
            }
        };
        window.addEventListener(
            CHAT_TAB_DELETED_EVENT,
            onDeleted as EventListener,
        );
        return () =>
            window.removeEventListener(
                CHAT_TAB_DELETED_EVENT,
                onDeleted as EventListener,
            );
    }, [chatId, currentChatTabId]);

    /** Sidebar "New action" on `/chat`: same URL does not remount — reset so the landing can show again. */
    useEffect(() => {
        const onNewSession = () => {
            if (chatId !== "new") return;
            abortControllerRef.current?.abort();
            abortControllerRef.current = null;
            isStreamingRef.current = false;
            setIsStreaming(false);
            setStreamingMessageId(null);
            streamingMessageIdRef.current = null;
            clearAgentStatus();
            setMessages([]);
            setInputValue("");
            setSearchQuery("");
            setSearchMatches([]);
            setCurrentMatchIndex(-1);
            setCurrentChatTabId(null);
            lastLoadedChatIdRef.current = null;
            lastChatHistoryMessageCountRef.current = -1;
            isCreatingNewChatRef.current = false;
            chatCreatedRef.current = false;
            try {
                sessionStorage.removeItem(ACTIVE_CHAT_TAB_STORAGE_KEY);
                sessionStorage.removeItem("pendingChatQuestion");
                sessionStorage.removeItem("pendingChatAssistantMode");
                sessionStorage.removeItem("pendingChatAgentMode");
            } catch {
                /* ignore */
            }
        };
        window.addEventListener(CHAT_NEW_SESSION_EVENT, onNewSession);
        return () => window.removeEventListener(CHAT_NEW_SESSION_EVENT, onNewSession);
    }, [chatId, clearAgentStatus]);

    // Load chat tabs to check if we should show landing page
    const currentTenantId = useAuthStore((s) => s.tenantId);
    const hydrated = useAuthStore((s) => s.hydrated);

    /** Refresh sidebar chat tab list (e.g. after creating a tab or renaming). */
    const invalidateChatTabsSidebar = useCallback(() => {
        if (currentTenantId) {
            void queryClient.invalidateQueries({ queryKey: ["chatTabs", currentTenantId] });
        } else {
            queryClient.invalidateQueries({
                predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "chatTabs",
            });
        }
    }, [currentTenantId, queryClient]);

    /** Run after `/chat/stream` has been kicked off so `tabs` does not compete with the SSE connection. */
    const scheduleChatTabsSidebarRefreshAfterStreamStart = useCallback(() => {
        if (typeof window === "undefined") return;
        window.setTimeout(() => {
            invalidateChatTabsSidebar();
        }, 0);
    }, [invalidateChatTabsSidebar]);

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
        // Don't update flags if we're currently streaming (onStart already set them).
        // Also check ref so we skip updates in the gap before React commits isStreaming=true.
        if (isStreaming || isStreamingRef.current) {
            return;
        }

        // On page refresh, reset flags if we're on an existing chat (not "new")
        // This ensures we don't incorrectly block history loading.
        // Skip when a new chat is being created (lastLoaded can be unset briefly) — do not clear isCreatingNewChatRef.
        if (
            chatId !== "new" &&
            lastLoadedChatIdRef.current === null &&
            !isCreatingNewChatRef.current
        ) {
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

    // When route goes from `/chat/new` to a concrete tab, mark so history sync replaces local state
    // (returning to the *same* UUID still needs a refresh — `lastLoadedChatIdRef` alone stays equal).
    useEffect(() => {
        const prev = prevChatIdForHistoryRef.current;
        if (prev === "new" && typeof chatId === "string" && chatId !== "new") {
            reopenFromNewChatRouteRef.current = true;
        }
        prevChatIdForHistoryRef.current = chatId;
    }, [chatId]);

    // Load chat history - only when selecting an existing chat tab, not when creating a new chat.
    // Do not gate on `isCreatingNewChatRef` here — it is a ref and does not re-render when cleared,
    // so `shouldLoadHistory` could stay false forever after visiting `/chat/new`. `chatId === "new"`
    // already excludes the new-session route from fetching.
    const shouldLoadHistory = !!(
        chatId &&
        chatId !== "new" &&
        currentTenantId &&
        !isStreaming
    );
    const {
        data: chatHistory,
        isLoading: isLoadingHistory,
        isFetching: isFetchingHistory,
        isSuccess: isChatHistorySuccess,
        isError: isChatHistoryError,
        refetch: refetchHistory,
    } = useQuery({
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
                    toast.error(
                        getUserFacingApiErrorMessage(
                            error,
                            "Failed to load chat history. Please try again.",
                        ),
                    );
                    // Do not return { chat_tab: null } — that triggers the "tab deleted" redirect.
                    throw error;
                }
            }
            return null;
        },
        enabled: shouldLoadHistory,
        retry: false, // Don't retry on 404/422 errors
        refetchOnWindowFocus: false,
        // Refetch when opening a tab so navigation always loads server state (avoids stale/partial cache until full refresh).
        refetchOnMount: true,
        staleTime: 0,
    });

    // Tab was deleted (sidebar or elsewhere): history reports no tab — leave stale UI and go to new chat landing
    useEffect(() => {
        if (chatId === "new" || isStreaming) return;
        if (isChatHistoryError) return;
        if (!isChatHistorySuccess || !chatHistory) return;
        if (chatHistory.chat_tab !== null) return;

        setMessages([]);
        setCurrentChatTabId(null);
        lastLoadedChatIdRef.current = null;
        lastChatHistoryMessageCountRef.current = -1;
        queryClient.removeQueries({
            queryKey: ["chatHistory", chatId, currentTenantId],
        });
        if (!embed) {
            router.replace(CHAT_ENTRY_PATH);
        }
    }, [
        chatId,
        chatHistory,
        isChatHistorySuccess,
        isStreaming,
        currentTenantId,
        queryClient,
        router,
        isChatHistoryError,
        embed,
    ]);

    // Check for pending question from landing page and auto-send
    useEffect(() => {
        if (chatId === "new") {
            const pendingQuestion = sessionStorage.getItem("pendingChatQuestion");
            const pendingAssistantMode = sessionStorage.getItem("pendingChatAssistantMode");
            const legacyPendingAgent = sessionStorage.getItem("pendingChatAgentMode");

            if (pendingQuestion && !isStreaming) {
                // Clear the pending question immediately
                sessionStorage.removeItem("pendingChatQuestion");
                sessionStorage.removeItem("pendingChatAgentMode");
                sessionStorage.removeItem("pendingChatAssistantMode");

                let resolvedAssistantMode: ChatAssistantMode = getStoredAssistantMode();
                if (pendingAssistantMode === "ask" || pendingAssistantMode === "operator") {
                    resolvedAssistantMode = pendingAssistantMode;
                } else if (legacyPendingAgent !== null) {
                    resolvedAssistantMode = legacyPendingAgent === "true" ? "operator" : "ask";
                }
                setAssistantMode(resolvedAssistantMode);
                setStoredAssistantMode(resolvedAssistantMode);

                const streamWithAgentMode = resolvedAssistantMode === "operator";

                // Auto-send the message
                const originalQuestion = pendingQuestion.trim();
                if (originalQuestion) {
                    // Same-frame exit from embedded ChatLandingPage (see shouldShowLandingPage) before any await.
                    isStreamingRef.current = true;
                    setIsStreaming(true);
                    clearAgentStatus();

                    void (async () => {
                        let deferredSidebarRefreshAfterCreate = false;
                        // For pending questions, we don't have knowledge base context yet
                        const contextToSend = selectedContext.type === 'text' && selectedContext.text
                            ? selectedContext.text
                            : null;

                        const storedQuestion = contextToSend
                            ? `${contextToSend}${CONTEXT_SEPARATOR}${originalQuestion}`
                            : originalQuestion;

                        const contextForBackend = contextToSend
                            ? { type: 'text' as const, text: contextToSend }
                            : undefined;

                        const questionForBackend = originalQuestion;

                        const optimisticUserMessageId = Date.now();
                        let streamTabId: string;
                        const reuseNewTabId =
                            currentChatTabIdRef.current ?? currentChatTabId;
                        if (reuseNewTabId) {
                            streamTabId = reuseNewTabId;
                            setMessages([
                                {
                                    id: optimisticUserMessageId,
                                    chat_tab_id: streamTabId,
                                    question: storedQuestion,
                                    answer: null,
                                    created_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString(),
                                },
                            ]);
                        } else {
                            setMessages([
                                {
                                    id: optimisticUserMessageId,
                                    chat_tab_id: "",
                                    question: storedQuestion,
                                    answer: null,
                                    created_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString(),
                                },
                            ]);
                            try {
                                const newTab = await createChatTab(
                                    DEFAULT_CHAT_TAB_DISPLAY_NAME
                                );
                                streamTabId = newTab.id;
                                deferredSidebarRefreshAfterCreate = true;
                            } catch (err: unknown) {
                                const msg =
                                    err instanceof Error
                                        ? err.message
                                        : "Could not create chat";
                                setMessages([]);
                                isStreamingRef.current = false;
                                setIsStreaming(false);
                                toast.error(msg);
                                return;
                            }
                        }

                        const abortController = new AbortController();
                        abortControllerRef.current = abortController;

                        try {
                            const controller = streamChat(
                            questionForBackend, // Send original question without context concatenation
                            streamTabId,
                            streamWithAgentMode,
                            contextForBackend, // Pass context separately so backend can use it in system prompt
                            {
                                onStart: (messageId, chatTabId, streamId) => {
                                    clearAgentStatus();
                                    // Mark chat as created
                                    chatCreatedRef.current = true;
                                    // Update with real IDs (chatTabId is UUID string)
                                    const previousChatTabId = currentChatTabId;
                                    setCurrentChatTabId(chatTabId);
                                    setStreamingMessageId(messageId);
                                    streamingMessageIdRef.current = messageId;
                                    currentStreamingChatTabIdRef.current = chatTabId;
                                    currentStreamingQuestionRef.current = originalQuestion;

                                    if (chatId === "new") {
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
                                    setAgentStatusSteps((prev) => [...prev, status]);
                                    setCurrentStatus(status);
                                },
                                onResourceCreated: (link) => {
                                    streamingResourceLinksRef.current = [
                                        ...streamingResourceLinksRef.current,
                                        link,
                                    ];
                                    setStreamingResourceLinks([...streamingResourceLinksRef.current]);
                                },
                                onComplete: async () => {
                                    const tabForRename = currentStreamingChatTabIdRef.current;
                                    const qForRename = currentStreamingQuestionRef.current;

                                    const completedMessageId = streamingMessageIdRef.current;
                                    const links = streamingResourceLinksRef.current;
                                    if (completedMessageId != null && links.length > 0) {
                                        setMessages((prev) =>
                                            prev.map((m) =>
                                                m.id === completedMessageId
                                                    ? {
                                                        ...m,
                                                        resourceLinks: [
                                                            ...(m.resourceLinks ?? []),
                                                            ...links,
                                                        ],
                                                    }
                                                    : m
                                            )
                                        );
                                    }
                                    streamingResourceLinksRef.current = [];
                                    setStreamingResourceLinks([]);
                                    setIsStreaming(false);
                                    setStreamingMessageId(null);
                                    clearAgentStatus();
                                    abortControllerRef.current = null;

                                    let didRename = false;
                                    if (tabForRename && qForRename) {
                                        didRename = await renameChatTabIfNeeded(
                                            tabForRename,
                                            qForRename,
                                        );
                                    }
                                    if (didRename) {
                                        invalidateChatTabsSidebar();
                                    }
                                    // Clear refs
                                    currentStreamingChatTabIdRef.current = null;
                                    currentStreamingQuestionRef.current = null;
                                    chatCreatedRef.current = false;
                                },
                                onStop: async () => {
                                    const tabId = currentStreamingChatTabIdRef.current;
                                    const tabForRename = tabId;
                                    const qForRename = currentStreamingQuestionRef.current;
                                    if (tabForRename && qForRename) {
                                        void renameChatTabIfNeeded(
                                            tabForRename,
                                            qForRename,
                                        ).then((didRename) => {
                                            if (didRename) {
                                                invalidateChatTabsSidebar();
                                            }
                                        });
                                    }
                                    setIsStreaming(false);
                                    setStreamingMessageId(null);
                                    clearAgentStatus();
                                    abortControllerRef.current = null;
                                    toast.info("Response stopped. Partial response saved.");
                                    // Wait for backend to save, then refetch to get the saved partial response
                                    setTimeout(async () => {
                                        const hid =
                                            tabId && tabId !== "new"
                                                ? tabId
                                                : chatId && chatId !== "new"
                                                  ? chatId
                                                  : null;
                                        if (hid) {
                                            try {
                                                await queryClient.invalidateQueries({
                                                    queryKey: ["chatHistory", hid, currentTenantId],
                                                });
                                            } catch (error) {
                                                console.error("Error refetching history after stop:", error);
                                            }
                                        }
                                    }, 1000); // Increased delay to ensure backend has time to save
                                },
                                onError: (error) => {
                                    const tabForRename = currentStreamingChatTabIdRef.current;
                                    const qForRename = currentStreamingQuestionRef.current;
                                    if (tabForRename && qForRename) {
                                        void renameChatTabIfNeeded(
                                            tabForRename,
                                            qForRename,
                                        ).then((didRename) => {
                                            if (didRename) {
                                                invalidateChatTabsSidebar();
                                            }
                                        });
                                    }
                                    setIsStreaming(false);
                                    setStreamingMessageId(null);
                                    clearAgentStatus();
                                    abortControllerRef.current = null;
                                    chatCreatedRef.current = false;
                                    // Clear context even on error (message was attempted to be sent)
                                    setSelectedContext({ type: null, id: null, name: null, text: null });
                                    toast.error(
                                        getUserFacingApiErrorMessage(
                                            error,
                                            "Something went wrong. Please try again.",
                                        ),
                                    );
                                },
                            },
                            selectedModel
                        );

                            abortControllerRef.current = controller;
                            if (deferredSidebarRefreshAfterCreate) {
                                startTransition(() => {
                                    setCurrentChatTabId(streamTabId);
                                    setMessages((prev) =>
                                        prev.map((m) =>
                                            m.id === optimisticUserMessageId
                                                ? { ...m, chat_tab_id: streamTabId }
                                                : m
                                        )
                                    );
                                });
                                scheduleChatTabsSidebarRefreshAfterStreamStart();
                            }
                            setSelectedContext({ type: null, id: null, name: null, text: null });
                            if (chatId === "new") {
                                isCreatingNewChatRef.current = true;
                                lastLoadedChatIdRef.current = "new";
                            }
                        } catch (error: any) {
                            setIsStreaming(false);
                            setStreamingMessageId(null);
                            clearAgentStatus();
                            chatCreatedRef.current = false;
                            setSelectedContext({ type: null, id: null, name: null, text: null });
                            toast.error(
                                getUserFacingApiErrorMessage(
                                    error,
                                    "Failed to send message. Please try again.",
                                ),
                            );
                        }
                    })();
                }
            }
        }
    }, [
        chatId,
        isStreaming,
        router,
        queryClient,
        refetchHistory,
        selectedModel,
        clearAgentStatus,
        currentTenantId,
        invalidateChatTabsSidebar,
        scheduleChatTabsSidebarRefreshAfterStreamStart,
        landingLaunchNonce,
    ]);

    // Update messages when history loads (only on initial load or when chatId changes)
    useEffect(() => {
        // Never replace local streaming/partial UI with server history while a response is in flight.
        if (isStreaming || isStreamingRef.current) {
            return;
        }

        // Check if this is a new chat (chatId changed) or we reopened an existing tab from `/chat/new`
        const isNewChat = lastLoadedChatIdRef.current !== chatId;
        const reopenFromNew = reopenFromNewChatRouteRef.current;

        if (chatHistory && typeof chatHistory === 'object' && 'messages' in chatHistory) {
            const currentMessageCount = chatHistory.messages?.length || 0;
            const previousMessageCount = lastChatHistoryMessageCountRef.current;

            // If chatHistory exists but has no messages (cleared chat), clear local messages
            if (currentMessageCount === 0) {
                // Keep tab id in sync when history is empty (clear-chat refetch) so the next send targets this chat
                if (chatHistory.chat_tab?.id) {
                    setCurrentChatTabId(chatHistory.chat_tab.id);
                }
                // Only clear messages if:
                // 1. We're viewing this chat and not streaming
                // 2. This is a transition from having messages to having no messages (cleared)
                //    OR it's a new chat load with no messages
                // Don't clear if we previously had 0 messages and still have 0 (to avoid clearing newly added local messages)
                if (chatId !== "new" && !isStreaming) {
                    // Clear if: transitioning from messages to empty, OR it's a new chat with no messages
                    if (previousMessageCount > 0 || isNewChat || reopenFromNew) {
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
                reopenFromNewChatRouteRef.current = false;
                return;
            }

            // Update the message count reference
            lastChatHistoryMessageCountRef.current = currentMessageCount;

            // Load/replace when chat id changed, or we navigated from `/chat/new` back to this tab
            // (same UUID as before — `isNewChat` is false — still need `reopenFromNew`).
            if (
                (isNewChat || reopenFromNew) &&
                !isStreaming &&
                chatHistory.messages
            ) {
                const formattedMessages: ChatMessage[] = [];
                chatHistory.messages.forEach((msg: ChatMessage) => {
                    // Add user message (question)
                    if (msg.question) {
                        formattedMessages.push({
                            id: msg.id,
                            chat_tab_id: msg.chat_tab_id,
                            question: msg.question,
                            answer: null,
                            created_at: msg.created_at,
                            updated_at: msg.updated_at,
                        });
                    }
                    // Add bot response (answer) if exists (resource links only on assistant row)
                    if (msg.answer) {
                        formattedMessages.push({
                            id: msg.id,
                            chat_tab_id: msg.chat_tab_id,
                            question: "",
                            answer: msg.answer,
                            created_at: msg.created_at,
                            updated_at: msg.updated_at,
                            resourceLinks: msg.resourceLinks,
                        });
                    }
                });
                setMessages(formattedMessages);
                lastLoadedChatIdRef.current = chatId;
                lastChatHistoryMessageCountRef.current = chatHistory.messages.length;
                isCreatingNewChatRef.current = false;
                reopenFromNewChatRouteRef.current = false;

                // Update currentChatTabId if available
                if (chatHistory.chat_tab) {
                    setCurrentChatTabId(chatHistory.chat_tab.id);
                    // Only mark as renamed if the tab already has a real title. Placeholder names
                    // (e.g. backend "New Action", legacy numeric ids) must not pre-empt async rename
                    // after the first message.
                    if (
                        chatHistory.messages &&
                        chatHistory.messages.length > 0 &&
                        !isPlaceholderChatTabName(chatHistory.chat_tab.name ?? "")
                    ) {
                        hasRenamedChatRef.current.add(chatHistory.chat_tab.id);
                    }
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
        isStreamingRef.current = true;
        setIsStreaming(true);
        clearAgentStatus();

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

        const optimisticUserMessageId = Date.now();
        let streamTabId: string;
        let userMessageAlreadyAppended = false;
        let deferredSidebarRefreshAfterCreate = false;

        if (chatId === "new") {
            const reuseNewTabId = currentChatTabIdRef.current ?? currentChatTabId;
            if (reuseNewTabId) {
                streamTabId = reuseNewTabId;
            } else {
                // Show user bubble before createChatTab returns (first message on /chat/new).
                const optimisticUser: ChatMessage = {
                    id: optimisticUserMessageId,
                    chat_tab_id: "",
                    question: storedQuestion,
                    answer: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, optimisticUser]);
                userMessageAlreadyAppended = true;
                try {
                    const newTab = await createChatTab(DEFAULT_CHAT_TAB_DISPLAY_NAME);
                    streamTabId = newTab.id;
                    deferredSidebarRefreshAfterCreate = true;
                } catch (err: unknown) {
                    const msg =
                        err instanceof Error ? err.message : "Could not create chat";
                    setMessages((prev) =>
                        prev.filter((m) => m.id !== optimisticUserMessageId)
                    );
                    isStreamingRef.current = false;
                    setIsStreaming(false);
                    toast.error(msg);
                    return;
                }
            }
        } else {
            const trimmedResolved = resolvedChatTabId.trim();
            const fromSession = getStreamChatTabId();
            const resolved = trimmedResolved !== "" ? trimmedResolved : (fromSession ?? "");
            if (!resolved) {
                isStreamingRef.current = false;
                setIsStreaming(false);
                toast.error("No chat tab selected.");
                return;
            }
            streamTabId = resolved;
        }

        if (!userMessageAlreadyAppended) {
            const userMessage: ChatMessage = {
                id: optimisticUserMessageId,
                chat_tab_id: streamTabId,
                question: storedQuestion,
                answer: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, userMessage]);
        }
        // Don't set streamingMessageId yet - will be set in onStart

        // Create abort controller and start stream before other setState so the first byte is not
        // queued behind context/history guards (start-only latency on /chat/new after createChatTab).
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
                streamTabId,
                agentMode,
                contextForBackend, // Pass context separately so backend can use it in system prompt
                {
                    onStart: (messageId, chatTabId, streamId) => {
                        clearAgentStatus();
                        // Mark chat as created
                        chatCreatedRef.current = true;
                        // Update with real IDs (chatTabId is UUID string)
                        const previousChatTabId = currentChatTabId;
                        setCurrentChatTabId(chatTabId);
                        setStreamingMessageId(messageId);
                        streamingMessageIdRef.current = messageId;
                        currentStreamingChatTabIdRef.current = chatTabId;
                        currentStreamingQuestionRef.current = originalQuestion;

                        if (chatId === "new") {
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
                    },
                    onChunk: (content) => {
                        const tabForMessage =
                            getStreamChatTabId() ??
                            currentStreamingChatTabIdRef.current ??
                            "";
                        setMessages((prev) => {
                            const currentStreamingId = streamingMessageIdRef.current;
                            if (!currentStreamingId) {
                                // If no streaming ID yet, create bot message (shouldn't happen, but handle it)
                                const botMessage: ChatMessage = {
                                    id: currentStreamingId || Date.now(),
                                    chat_tab_id: tabForMessage,
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
                                    chat_tab_id: tabForMessage,
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
                        setAgentStatusSteps((prev) => [...prev, status]);
                        setCurrentStatus(status);
                    },
                    onResourceCreated: (link) => {
                        streamingResourceLinksRef.current = [
                            ...streamingResourceLinksRef.current,
                            link,
                        ];
                        setStreamingResourceLinks([...streamingResourceLinksRef.current]);
                    },
                    onComplete: async () => {
                        const tabForRename = currentStreamingChatTabIdRef.current;
                        const qForRename = currentStreamingQuestionRef.current;

                        const completedMessageId = streamingMessageIdRef.current;
                        const links = streamingResourceLinksRef.current;
                        if (completedMessageId != null && links.length > 0) {
                            setMessages((prev) =>
                                prev.map((m) =>
                                    m.id === completedMessageId
                                        ? {
                                            ...m,
                                            resourceLinks: [
                                                ...(m.resourceLinks ?? []),
                                                ...links,
                                            ],
                                        }
                                        : m
                                )
                            );
                        }
                        streamingResourceLinksRef.current = [];
                        setStreamingResourceLinks([]);
                        setIsStreaming(false);
                        setStreamingMessageId(null);
                        clearAgentStatus();
                        abortControllerRef.current = null;

                        let didRename = false;
                        if (tabForRename && qForRename) {
                            didRename = await renameChatTabIfNeeded(
                                tabForRename,
                                qForRename,
                            );
                        }
                        if (didRename) {
                            invalidateChatTabsSidebar();
                        }
                        // Clear refs
                        currentStreamingChatTabIdRef.current = null;
                        currentStreamingQuestionRef.current = null;
                        chatCreatedRef.current = false;
                    },
                    onStop: async () => {
                        const tabId = currentStreamingChatTabIdRef.current;
                        const tabForRename = tabId;
                        const qForRename = currentStreamingQuestionRef.current;
                        if (tabForRename && qForRename) {
                            void renameChatTabIfNeeded(
                                tabForRename,
                                qForRename,
                            ).then((didRename) => {
                                if (didRename) {
                                    invalidateChatTabsSidebar();
                                }
                            });
                        }
                        setIsStreaming(false);
                        setStreamingMessageId(null);
                        clearAgentStatus();
                        abortControllerRef.current = null;
                        chatCreatedRef.current = false;
                        toast.info("Response stopped. Partial response saved.");
                        // Wait for backend to save, then refetch to get the saved partial response
                        setTimeout(async () => {
                            const hid =
                                tabId && tabId !== "new"
                                    ? tabId
                                    : chatId && chatId !== "new"
                                      ? chatId
                                      : null;
                            if (hid) {
                                try {
                                    await queryClient.invalidateQueries({
                                        queryKey: ["chatHistory", hid, currentTenantId],
                                    });
                                } catch (error) {
                                    console.error("Error refetching history after stop:", error);
                                }
                            }
                        }, 1000); // Increased delay to ensure backend has time to save
                    },
                    onError: (error) => {
                        const tabForRename = currentStreamingChatTabIdRef.current;
                        const qForRename = currentStreamingQuestionRef.current;
                        if (tabForRename && qForRename) {
                            void renameChatTabIfNeeded(
                                tabForRename,
                                qForRename,
                            ).then((didRename) => {
                                if (didRename) {
                                    invalidateChatTabsSidebar();
                                }
                            });
                        }
                        setIsStreaming(false);
                        setStreamingMessageId(null);
                        clearAgentStatus();
                        abortControllerRef.current = null;
                        toast.error(
                            getUserFacingApiErrorMessage(
                                error,
                                "Something went wrong. Please try again.",
                            ),
                        );
                    },
                },
                selectedModel
            );

            abortControllerRef.current = controller;
            if (deferredSidebarRefreshAfterCreate) {
                startTransition(() => {
                    setCurrentChatTabId(streamTabId);
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === optimisticUserMessageId
                                ? { ...m, chat_tab_id: streamTabId }
                                : m
                        )
                    );
                });
                scheduleChatTabsSidebarRefreshAfterStreamStart();
            }
            setSelectedContext({ type: null, id: null, name: null, text: null });
            if (chatId === "new") {
                isCreatingNewChatRef.current = true;
                lastLoadedChatIdRef.current = "new";
            }
        } catch (error: any) {
            setIsStreaming(false);
            setStreamingMessageId(null);
            clearAgentStatus();
            chatCreatedRef.current = false;
            // Clear context even on error (message was attempted to be sent)
            setSelectedContext({ type: null, id: null, name: null, text: null });
            toast.error(
                getUserFacingApiErrorMessage(
                    error,
                    "Failed to send message. Please try again.",
                ),
            );
        }
    };

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    };


    // Landing on `/chat` when this route has no in-flight or local thread yet (existing sidebar tabs are OK).
    const pendingQuestion = typeof window !== "undefined" ? sessionStorage.getItem("pendingChatQuestion") : null;
    // Show landing when not loading tabs, no pending auto-send, no messages, not streaming — only on `chatId === "new"`.
    const shouldShowLandingPage = chatId === "new" &&
        !isLoadingChatTabs &&
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

    // Greeting landing for a fresh new-session view (only on `chatId === "new"`)
    if (shouldShowLandingPage) {
        return (
            <div className="flex flex-col h-full w-full">
                <ChatLandingPage
                    onMessageQueued={() => setLandingLaunchNonce((n) => n + 1)}
                    embed={embed}
                />
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
                <ChatLandingPage
                    onMessageQueued={() => setLandingLaunchNonce((n) => n + 1)}
                    embed={embed}
                />
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
                                onCreateContent={handleCreateContent}
                                isSelectedForContent={(selectedContentMessageIds ?? []).includes(msg.id)}
                                currentStatus={currentStatus}
                                statusSteps={
                                    isStreaming && streamingMessageId === msg.id
                                        ? agentStatusSteps
                                        : undefined
                                }
                                resourceLinks={
                                    isStreaming && streamingMessageId === msg.id
                                        ? streamingResourceLinks
                                        : msg.resourceLinks ?? []
                                }
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

            {/* Content selection bar */}
            {(selectedContentMessageIds ?? []).length > 0 && (
                <div
                    className={cn(
                        "shrink-0 pb-2",
                        embed ? "px-2" : "px-4 sm:px-6",
                    )}
                >
                    <div className={cn("mx-auto", embed ? "max-w-full" : "max-w-4xl")}>
                        <div
                            className={cn(
                                "mb-2 flex flex-nowrap items-center justify-between gap-2 rounded-lg border bg-white/80 dark:bg-muted/60",
                                embed ? "px-2 py-1.5" : "gap-3 px-3 py-2",
                            )}
                        >
                            <div
                                className={cn(
                                    "flex min-w-0 flex-1 items-center gap-1.5 text-black dark:text-muted-foreground",
                                    embed ? "text-[11px] leading-tight" : "text-xs sm:text-sm",
                                )}
                            >
                                <FileText
                                    className={cn(
                                        "shrink-0 text-[#DB2B30]",
                                        embed ? "h-3 w-3" : "h-3.5 w-3.5 sm:h-4 sm:w-4",
                                    )}
                                />
                                <span
                                    className="min-w-0 truncate"
                                    title={
                                        `${(selectedContentMessageIds ?? []).length} ${
                                            (selectedContentMessageIds ?? []).length === 1
                                                ? "response selected"
                                                : "responses selected"
                                        } for content`
                                    }
                                >
                                    {(selectedContentMessageIds ?? []).length}{" "}
                                    {(selectedContentMessageIds ?? []).length === 1
                                        ? "response selected"
                                        : "responses selected"}{" "}
                                    for content
                                </span>
                            </div>
                            <div
                                className={cn(
                                    "flex shrink-0 items-center",
                                    embed ? "gap-1" : "gap-2",
                                )}
                            >
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        embed ? "h-6 px-1.5 text-[10px]" : "h-7 px-2 text-xs",
                                    )}
                                    onClick={() => setSelectedContentMessageIds([])}
                                >
                                    Clear
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    className={cn(
                                        "bg-[#DB2B30] text-white hover:bg-[#B52227]",
                                        embed ? "h-6 gap-0.5 px-2 text-[10px]" : "h-7 px-3 text-xs",
                                    )}
                                    onClick={handleCreateContentFromSelection}
                                >
                                    <PenTool
                                        className={cn(
                                            embed ? "h-2.5 w-2.5" : "mr-1 h-3 w-3",
                                        )}
                                    />
                                    {embed ? "For content" : "Select for Content"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Input */}
            <div
                className={cn(
                    "flex-shrink-0 border-t bg-background/80 backdrop-blur-sm",
                    embed ? "px-2 py-2" : "px-4 sm:px-6 py-4 sm:py-6",
                )}
            >
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
                        <div
                            className={cn(
                                "flex flex-col border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg overflow-hidden",
                                embed ? "rounded-xl" : "rounded-2xl",
                            )}
                        >
                            {/* Input Row */}
                            <div
                                className={cn(
                                    "flex items-center",
                                    embed ? "px-3 py-2" : "px-5 py-4",
                                )}
                            >
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
                                    className={cn(
                                        "flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-neutral-700 dark:text-neutral-200 placeholder:text-neutral-400 dark:placeholder:text-neutral-500",
                                        embed
                                            ? "text-sm px-1.5 py-1"
                                            : "text-[15px] px-2 py-2",
                                    )}
                                />
                            </div>

                            {/* Bottom Row - Icons and Controls */}
                            <div
                                className={cn(
                                    "flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 min-w-0 gap-1",
                                    embed
                                        ? "flex-wrap px-2 py-1.5"
                                        : "px-4 py-2.5",
                                )}
                            >
                                {/* Left icons */}
                                <div
                                    className={cn(
                                        "flex items-center shrink-0",
                                        embed ? "gap-0" : "gap-1",
                                    )}
                                >
                                    <button
                                        type="button"
                                        disabled={isStreaming}
                                        className={cn(
                                            "inline-flex items-center justify-center rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50",
                                            embed ? "h-6 w-6" : "h-8 w-8",
                                        )}
                                        title="Attach file"
                                    >
                                        <Paperclip className={embed ? "w-[14px] h-[14px]" : "w-[18px] h-[18px]"} />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isStreaming}
                                        className={cn(
                                            "inline-flex items-center justify-center rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50",
                                            embed ? "h-6 w-6" : "h-8 w-8",
                                        )}
                                        title="Add context"
                                    >
                                        <AtSign className={embed ? "w-[14px] h-[14px]" : "w-[18px] h-[18px]"} />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isStreaming}
                                        className={cn(
                                            "inline-flex items-center justify-center rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50",
                                            embed ? "h-6 w-6" : "h-8 w-8",
                                        )}
                                        title="Upload image"
                                    >
                                        <ImageIcon className={embed ? "w-[14px] h-[14px]" : "w-[18px] h-[18px]"} />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isStreaming}
                                        className={cn(
                                            "inline-flex items-center justify-center rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50",
                                            embed ? "h-6 w-6" : "h-8 w-8",
                                        )}
                                        title="Web search"
                                    >
                                        <Globe className={embed ? "w-[14px] h-[14px]" : "w-[18px] h-[18px]"} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSettingsSheetOpen(true)}
                                        disabled={isStreaming}
                                        className={cn(
                                            "inline-flex items-center justify-center rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50",
                                            embed ? "h-6 w-6" : "h-8 w-8",
                                        )}
                                        title="Settings"
                                    >
                                        <SlidersHorizontal className={embed ? "w-[14px] h-[14px]" : "w-[18px] h-[18px]"} />
                                    </button>
                                </div>

                                {/* Right controls */}
                                <div
                                    className={cn(
                                        "flex items-center shrink-0",
                                        embed ? "gap-1 ml-auto" : "gap-2",
                                    )}
                                >
                                    <ModelSelector
                                        value={selectedModel}
                                        onChange={handleModelChange}
                                        disabled={isStreaming}
                                        className={
                                            embed
                                                ? "h-7 px-1.5 text-[10px] [&_span]:max-w-[3.25rem]"
                                                : undefined
                                        }
                                    />
                                    <ChatAssistantModeDropdown
                                        value={assistantMode}
                                        onChange={setAssistantModePersist}
                                        disabled={isStreaming}
                                        className={
                                            embed
                                                ? "h-7 min-w-[4.25rem] px-1.5 text-[10px]"
                                                : undefined
                                        }
                                    />

                                    {isStreaming ? (
                                        <Button
                                            type="button"
                                            onClick={handleStop}
                                            size="icon"
                                            variant="destructive"
                                            className={cn(
                                                "rounded-full flex-shrink-0",
                                                embed ? "h-7 w-7" : "h-9 w-9",
                                            )}
                                        >
                                            <Square className={embed ? "h-3 w-3" : "h-4 w-4"} />
                                        </Button>
                                    ) : (
                                        <Button
                                            type="submit"
                                            size="icon"
                                            disabled={!inputValue.trim()}
                                            className={cn(
                                                "rounded-full bg-[#DB2B30] hover:bg-[#B52227] dark:bg-[#DB2B30] dark:hover:bg-[#B52227] text-white disabled:opacity-30 disabled:bg-neutral-200 dark:disabled:bg-neutral-700 disabled:text-neutral-400 dark:disabled:text-neutral-500 transition-all flex-shrink-0",
                                                embed ? "h-7 w-7" : "h-9 w-9",
                                            )}
                                        >
                                            <Send className={embed ? "h-3 w-3" : "h-4 w-4"} />
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
                                            custom_instructions: customInstructions.trim(),
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
